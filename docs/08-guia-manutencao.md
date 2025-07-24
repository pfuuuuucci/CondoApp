
# 🛠️ Guia de Manutenção - CondoApp

## 1. Introdução

### 1.1 Propósito
Este guia fornece instruções detalhadas para manutenção, monitoramento e troubleshooting do sistema CondoApp, garantindo operação estável e resolução rápida de problemas.

### 1.2 Público-Alvo
- Administradores de sistema
- Desenvolvedores responsáveis pela manutenção
- Síndicos com conhecimento técnico
- Equipe de suporte

### 1.3 Responsabilidades de Manutenção
- **Monitoramento diário**: Status do sistema, logs, performance
- **Limpeza automática**: Mensagens expiradas, dados temporários
- **Backup**: Dados críticos e configurações
- **Atualizações**: Sistema, dependências, segurança
- **Suporte**: Resolução de problemas dos usuários

## 2. Monitoramento do Sistema

### 2.1 Verificações Diárias

#### 2.1.1 Status do Servidor
```bash
# Verificar se o processo está rodando
ps aux | grep node | grep index.js

# Verificar porta 3000
netstat -tulpn | grep :3000

# Verificar logs em tempo real
tail -f /tmp/repl-stdout.log
```

#### 2.1.2 Conectividade do Banco
```bash
# Testar conexão PostgreSQL
psql $DATABASE_URL -c "SELECT version();"

# Verificar número de conexões
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"

# Verificar tamanho do banco
psql $DATABASE_URL -c "
SELECT 
  pg_size_pretty(pg_database_size(current_database())) as tamanho_total,
  current_database() as banco;
"
```

#### 2.1.3 Verificar Aplicação
```bash
# Teste de health check
curl -I https://seu-repl.replit.dev/

# Verificar API básica
curl https://seu-repl.replit.dev/api/version

# Testar login (manual via browser)
# Acessar: https://seu-repl.replit.dev/login.html
```

### 2.2 Métricas Importantes

#### 2.2.1 Usuários Ativos
```sql
-- Usuários aprovados por role
SELECT role, COUNT(*) as total, 
       COUNT(CASE WHEN aprovado = true THEN 1 END) as aprovados
FROM users 
GROUP BY role;

-- Usuários que fizeram primeiro acesso
SELECT COUNT(*) as total_usuarios,
       COUNT(CASE WHEN primeiro_acesso = false THEN 1 END) as ja_acessaram
FROM users WHERE aprovado = true;
```

#### 2.2.2 Atividade de Mensagens
```sql
-- Mensagens ativas por período
SELECT 
  COUNT(*) as mensagens_ativas,
  MIN(inicio_vigencia) as mais_antiga,
  MAX(fim_vigencia) as expira_em
FROM messages 
WHERE NOW() BETWEEN inicio_vigencia AND fim_vigencia;

-- Mensagens por tipo (últimos 7 dias)
SELECT tipo, COUNT(*) as total
FROM messages 
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY tipo;
```

#### 2.2.3 Sistema de Notificações
```sql
-- Subscrições push ativas
SELECT 
  user_role, 
  COUNT(*) as subscricoes_ativas
FROM push_subscriptions 
GROUP BY user_role;

-- Chaves VAPID configuradas
SELECT COUNT(*) as chaves_vapid FROM vapid_keys;
```

### 2.3 Alertas Automáticos

#### 2.3.1 Script de Monitoramento
Crie um script `monitor.sh`:

```bash
#!/bin/bash
# monitor.sh - Monitoramento básico CondoApp

LOG_FILE="/tmp/condoapp-monitor.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$DATE] Iniciando monitoramento..." >> $LOG_FILE

# 1. Verificar processo
if ! pgrep -f "node index.js" > /dev/null; then
  echo "[$DATE] ALERTA: Processo Node.js não encontrado!" >> $LOG_FILE
  # Reiniciar se necessário
  # cd /home/runner/${REPL_SLUG} && node index.js &
fi

# 2. Verificar banco
if ! psql $DATABASE_URL -c "SELECT 1;" > /dev/null 2>&1; then
  echo "[$DATE] ALERTA: Banco PostgreSQL inacessível!" >> $LOG_FILE
fi

# 3. Verificar endpoint
if ! curl -f -s https://${REPL_SLUG}.${REPL_OWNER}.repl.co/api/version > /dev/null; then
  echo "[$DATE] ALERTA: Endpoint /api/version inacessível!" >> $LOG_FILE
fi

# 4. Verificar espaço em disco
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
  echo "[$DATE] ALERTA: Uso de disco em ${DISK_USAGE}%!" >> $LOG_FILE
fi

echo "[$DATE] Monitoramento concluído." >> $LOG_FILE
```

## 3. Tarefas de Limpeza

### 3.1 Limpeza Automática de Mensagens

#### 3.1.1 Script cleanup-messages.js
```javascript
// cleanup-messages.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function cleanupExpiredMessages() {
  try {
    const result = await pool.query(`
      DELETE FROM messages 
      WHERE fim_vigencia < NOW()
    `);
    
    console.log(`${new Date().toISOString()}: ${result.rowCount} mensagens expiradas removidas`);
    
    // Log estatísticas
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as ativas,
        COUNT(CASE WHEN fim_vigencia < NOW() + INTERVAL '24 hours' THEN 1 END) as expiram_24h
      FROM messages
    `);
    
    console.log(`Mensagens ativas: ${stats.rows[0].ativas}`);
    console.log(`Expiram em 24h: ${stats.rows[0].expiram_24h}`);
    
  } catch (error) {
    console.error('Erro na limpeza:', error);
  } finally {
    await pool.end();
  }
}

cleanupExpiredMessages();
```

#### 3.1.2 Executar Limpeza
```bash
# Execução manual
node cleanup-messages.js

# Via script diário
./cleanup-daily.sh

# Agendar no Replit (Always On)
# O script roda automaticamente quando há atividade
```

### 3.2 Limpeza de Tokens Expirados

```sql
-- Remover tokens de recuperação expirados
DELETE FROM users 
WHERE token_expira < NOW() 
  AND token_recuperacao IS NOT NULL;

-- Verificar quantos foram removidos
SELECT COUNT(*) as tokens_expirados_removidos
FROM users 
WHERE token_expira < NOW() 
  AND token_recuperacao IS NOT NULL;
```

### 3.3 Limpeza de Logs

```bash
# Limpar logs antigos (manter últimos 7 dias)
find /tmp -name "*.log" -mtime +7 -delete

# Rotacionar log principal
if [ -f /tmp/repl-stdout.log ]; then
  cp /tmp/repl-stdout.log /tmp/repl-stdout.log.$(date +%Y%m%d)
  > /tmp/repl-stdout.log
fi

# Manter apenas últimos 5 arquivos de log
ls -t /tmp/repl-stdout.log.* | tail -n +6 | xargs rm -f
```

## 4. Backup e Recuperação

### 4.1 Backup do Banco de Dados

#### 4.1.1 Backup Completo
```bash
# Backup com timestamp
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > "backup_condoapp_${BACKUP_DATE}.sql"

# Backup compactado
pg_dump $DATABASE_URL | gzip > "backup_condoapp_${BACKUP_DATE}.sql.gz"

# Verificar tamanho do backup
ls -lh backup_condoapp_*.sql.gz
```

#### 4.1.2 Backup de Tabelas Críticas
```bash
# Apenas dados dos usuários
pg_dump $DATABASE_URL --table=users --data-only > backup_users_$(date +%Y%m%d).sql

# Estrutura organizacional
pg_dump $DATABASE_URL --table=blocos --table=agrupadores --table=unidades --table=grupos > backup_estrutura_$(date +%Y%m%d).sql

# Configurações do sistema
pg_dump $DATABASE_URL --table=vapid_keys --table=tipos_msg_rapidas --table=msg_rapidas > backup_config_$(date +%Y%m%d).sql
```

#### 4.1.3 Script Automático de Backup
```bash
#!/bin/bash
# backup-daily.sh

BACKUP_DIR="/tmp/backups"
DATE=$(date +%Y%m%d)
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Criar diretório se não existir
mkdir -p $BACKUP_DIR

# Backup completo
echo "Iniciando backup em $TIMESTAMP..."
pg_dump $DATABASE_URL | gzip > "$BACKUP_DIR/condoapp_full_${TIMESTAMP}.sql.gz"

# Verificar sucesso
if [ $? -eq 0 ]; then
  echo "Backup concluído: condoapp_full_${TIMESTAMP}.sql.gz"
  
  # Manter apenas últimos 7 backups
  cd $BACKUP_DIR
  ls -t condoapp_full_*.sql.gz | tail -n +8 | xargs rm -f
  
  echo "Backups antigos removidos. Arquivos atuais:"
  ls -lh condoapp_full_*.sql.gz
else
  echo "ERRO: Falha no backup!"
fi
```

### 4.2 Recuperação de Dados

#### 4.2.1 Restauração Completa
```bash
# Restaurar backup completo
gunzip < backup_condoapp_20250115_143000.sql.gz | psql $DATABASE_URL

# Ou sem descompactar
psql $DATABASE_URL < backup_condoapp_20250115.sql
```

#### 4.2.2 Restauração Parcial
```bash
# Restaurar apenas usuários
psql $DATABASE_URL -c "TRUNCATE users CASCADE;"
psql $DATABASE_URL < backup_users_20250115.sql

# Restaurar configurações
psql $DATABASE_URL < backup_config_20250115.sql
```

#### 4.2.3 Recuperação de Emergência
```sql
-- 1. Verificar integridade
SELECT tablename, schemaname 
FROM pg_tables 
WHERE schemaname = 'public';

-- 2. Recriar admin se perdido
INSERT INTO users (username, password, name, email, role, aprovado, primeiro_acesso)
VALUES ('admin', '$2a$10$hash-emergencia', 'Admin Emergência', 'admin@condoapp.com', 'admin-app', true, false);

-- 3. Recriar chaves VAPID se necessário
-- (Execute o gerador de chaves VAPID)
```

## 5. Troubleshooting

### 5.1 Problemas Comuns

#### 5.1.1 Servidor Não Responde
**Sintomas:** Site inacessível, timeout nas requisições

**Diagnóstico:**
```bash
# Verificar processo
ps aux | grep node

# Verificar portas
netstat -tulpn | grep :3000

# Verificar logs
tail -20 /tmp/repl-stdout.log
```

**Soluções:**
```bash
# Reiniciar aplicação
pkill -f "node index.js"
cd /home/runner/${REPL_SLUG}
node index.js &

# Verificar variáveis de ambiente
env | grep -E "(DATABASE_URL|EMAIL_|NODE_ENV)"
```

#### 5.1.2 Banco de Dados Inacessível
**Sintomas:** Erro "connection refused", timeouts em queries

**Diagnóstico:**
```bash
# Testar conexão
psql $DATABASE_URL -c "SELECT NOW();"

# Verificar string de conexão
echo $DATABASE_URL
```

**Soluções:**
```bash
# Verificar se PostgreSQL está rodando
pg_isready -h localhost

# Reiniciar conexão (no código)
# A aplicação reconecta automaticamente
```

#### 5.1.3 Emails Não São Enviados
**Sintomas:** Tokens de recuperação não chegam, notificações de aprovação falham

**Diagnóstico:**
```javascript
// Teste manual no console do Node.js
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

transporter.verify((error, success) => {
  if (error) {
    console.log('Erro:', error);
  } else {
    console.log('SMTP OK:', success);
  }
});
```

**Soluções:**
- Verificar EMAIL_USER e EMAIL_PASS nos Secrets
- Gerar nova senha de app no Gmail
- Verificar se 2FA está ativo na conta Google
- Testar com outro provedor SMTP

#### 5.1.4 Notificações Push Não Funcionam
**Sintomas:** Service Worker não registra, notificações não aparecem

**Diagnóstico:**
```bash
# Verificar chaves VAPID no banco
psql $DATABASE_URL -c "SELECT COUNT(*) FROM vapid_keys;"

# Verificar subscrições
psql $DATABASE_URL -c "SELECT user_role, COUNT(*) FROM push_subscriptions GROUP BY user_role;"
```

**Soluções:**
```javascript
// Gerar novas chaves VAPID
const webpush = require('web-push');
const keys = webpush.generateVAPIDKeys();

// Inserir no banco
const query = `
INSERT INTO vapid_keys (public_key, private_key) 
VALUES ($1, $2)
`;
// Execute com as novas chaves
```

### 5.2 Logs e Diagnósticos

#### 5.2.1 Estrutura de Logs
```bash
# Logs principais
/tmp/repl-stdout.log         # Saída da aplicação
/tmp/condoapp-monitor.log    # Log de monitoramento
/tmp/condoapp-cleanup.log    # Log de limpeza

# Verificar logs em tempo real
tail -f /tmp/repl-stdout.log

# Buscar erros
grep -i error /tmp/repl-stdout.log | tail -10

# Buscar problemas de conexão
grep -i "connection\|timeout\|refused" /tmp/repl-stdout.log
```

#### 5.2.2 Logs de Aplicação
A aplicação deve gerar logs estruturados:

```javascript
// Exemplo de logging no index.js
console.log(`${new Date().toISOString()} - Servidor iniciado na porta 3000`);
console.log(`${new Date().toISOString()} - Banco conectado: ${pool.totalCount} conexões`);
console.error(`${new Date().toISOString()} - ERRO:`, error);
```

### 5.3 Performance

#### 5.3.1 Monitorar Queries Lentas
```sql
-- Verificar queries em execução
SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
FROM pg_stat_activity 
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';

-- Estatísticas de tabelas
SELECT schemaname,tablename,attname,n_distinct,correlation 
FROM pg_stats 
WHERE schemaname = 'public';
```

#### 5.3.2 Otimização de Índices
```sql
-- Verificar índices existentes
SELECT tablename, indexname, indexdef 
FROM pg_indexes 
WHERE schemaname = 'public';

-- Criar índices para performance (se necessário)
CREATE INDEX IF NOT EXISTS idx_messages_vigencia ON messages(fim_vigencia);
CREATE INDEX IF NOT EXISTS idx_messages_destinatario ON messages(destinatario_tipo, destinatario_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
```

## 6. Atualizações e Manutenção Preventiva

### 6.1 Atualizações de Dependências

#### 6.1.1 Verificar Vulnerabilidades
```bash
# Auditoria de segurança
npm audit

# Corrigir automaticamente
npm audit fix
```

#### 6.1.2 Atualizar Packages
```bash
# Verificar versões desatualizadas
npm outdated

# Atualizar packages menores
npm update

# Atualizar packages maiores (cuidado!)
npm install express@latest
npm install pg@latest
```

### 6.2 Manutenção do Banco

#### 6.2.1 Limpeza e Otimização
```sql
-- Atualizar estatísticas
ANALYZE;

-- Limpeza completa (cuidado - pode ser lenta)
VACUUM FULL;

-- Limpeza rápida
VACUUM;

-- Verificar fragmentação
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 6.3 Checklist de Manutenção

#### 6.3.1 Semanal
- [ ] Executar backup completo
- [ ] Verificar logs de erro
- [ ] Monitorar uso de disco
- [ ] Testar funcionalidades críticas
- [ ] Verificar performance das queries
- [ ] Limpar logs antigos

#### 6.3.2 Mensal
- [ ] Atualizar dependências
- [ ] Executar VACUUM no banco
- [ ] Revisar métricas de uso
- [ ] Testar processo de recuperação
- [ ] Verificar configurações de segurança
- [ ] Documentar mudanças

#### 6.3.3 Trimestral
- [ ] Auditoria completa de segurança
- [ ] Backup de configuração completa
- [ ] Teste de disaster recovery
- [ ] Revisão de performance
- [ ] Atualização da documentação
- [ ] Treinamento de usuários

## 7. Scripts Úteis

### 7.1 Script de Saúde do Sistema
```bash
#!/bin/bash
# health-check.sh

echo "=== CondoApp Health Check ==="
echo "Data: $(date)"
echo

# Verificar processo
if pgrep -f "node index.js" > /dev/null; then
  echo "✓ Processo Node.js: ATIVO"
else
  echo "✗ Processo Node.js: INATIVO"
fi

# Verificar banco
if psql $DATABASE_URL -c "SELECT 1;" > /dev/null 2>&1; then
  echo "✓ PostgreSQL: CONECTADO"
else
  echo "✗ PostgreSQL: DESCONECTADO"
fi

# Verificar endpoint
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://${REPL_SLUG}.${REPL_OWNER}.repl.co/)
if [ "$HTTP_CODE" = "200" ]; then
  echo "✓ Endpoint HTTP: OK ($HTTP_CODE)"
else
  echo "✗ Endpoint HTTP: ERRO ($HTTP_CODE)"
fi

# Verificar espaço
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
echo "ℹ Uso de disco: ${DISK_USAGE}%"

echo
echo "=== Estatísticas do Banco ==="
psql $DATABASE_URL -c "
SELECT 
  'Usuários' as item, COUNT(*) as total 
FROM users
UNION ALL
SELECT 
  'Mensagens ativas', COUNT(*) 
FROM messages 
WHERE NOW() BETWEEN inicio_vigencia AND fim_vigencia
UNION ALL
SELECT 
  'Push subscriptions', COUNT(*) 
FROM push_subscriptions;
"
```

### 7.2 Script de Reset Completo (Emergência)
```bash
#!/bin/bash
# reset-system.sh - CUIDADO: Apaga todos os dados!

read -p "ATENÇÃO: Isso apagará TODOS os dados. Digite 'RESET' para confirmar: " confirm
if [ "$confirm" != "RESET" ]; then
  echo "Operação cancelada."
  exit 1
fi

echo "Executando reset completo..."

# Parar aplicação
pkill -f "node index.js"

# Reset do banco
psql $DATABASE_URL -c "
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO public;
"

# Executar script de criação
node database.js

# Criar admin padrão
node gera-hash.js

# Gerar novas chaves VAPID
node -e "
const webpush = require('web-push');
const { Pool } = require('pg');
const pool = new Pool({connectionString: process.env.DATABASE_URL});

const keys = webpush.generateVAPIDKeys();
pool.query('INSERT INTO vapid_keys (public_key, private_key) VALUES (\$1, \$2)', 
  [keys.publicKey, keys.privateKey])
  .then(() => {
    console.log('Chaves VAPID criadas');
    pool.end();
  });
"

# Reiniciar aplicação
cd /home/runner/${REPL_SLUG}
node index.js &

echo "Reset completo concluído!"
```

---

**Data:** Janeiro 2025  
**Versão:** 1.0  
**Autor:** Documentação CondoApp  
**Contato:** Para dúvidas sobre manutenção, consulte este guia ou entre em contato com a equipe técnica.
