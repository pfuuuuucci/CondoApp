
# 🚀 Manual de Instalação - CondoApp

## 1. Pré-requisitos

### 1.1 Ambiente de Desenvolvimento
- **Plataforma**: Replit (recomendado)
- **Node.js**: Versão 22+ 
- **PostgreSQL**: Versão 16+
- **Navegador**: Chrome, Firefox, Safari ou Edge (com suporte a Service Workers)

### 1.2 Serviços Externos
- **Email SMTP**: Gmail ou servidor SMTP compatível
- **Conta Google**: Para geração de senha de aplicativo

## 2. Configuração no Replit

### 2.1 Criação do Projeto
1. Acesse [replit.com](https://replit.com)
2. Clique em "Create Repl"
3. Selecione "Node.js" como template
4. Nomeie o projeto como "CondoApp"
5. Clique em "Create Repl"

### 2.2 Configuração do Ambiente
```bash
# O Replit configura automaticamente:
# - Node.js 22.17.0
# - PostgreSQL 16
# - Módulos necessários
```

### 2.3 Upload dos Arquivos
1. **Via GitHub Import** (recomendado):
   - Use "Import from GitHub" se o código estiver em repositório
   
2. **Via Upload Manual**:
   - Arraste os arquivos para o Replit
   - Mantenha a estrutura de pastas

## 3. Configuração do Banco de Dados

### 3.1 Conexão PostgreSQL
O Replit configura automaticamente o PostgreSQL. A string de conexão fica disponível em:
- **Console**: `echo $DATABASE_URL`
- **Secrets**: Variável `DATABASE_URL`

### 3.2 Criação das Tabelas
Execute o comando para criar as tabelas:

```bash
# Via Shell no Replit
node database.js
```

**Ou conecte diretamente ao PostgreSQL:**
```bash
psql $DATABASE_URL -c "
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  telefone VARCHAR(15),
  bloco VARCHAR(50),
  unidade VARCHAR(50),
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin-app', 'sindico', 'morador', 'mensageiro')),
  aprovado BOOLEAN DEFAULT false,
  primeiro_acesso BOOLEAN DEFAULT true,
  token_recuperacao VARCHAR(10),
  token_expira TIMESTAMP,
  unread_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS blocos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS agrupadores (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  bloco_id INTEGER NOT NULL REFERENCES blocos(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS unidades (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS grupos (
  id SERIAL PRIMARY KEY,
  bloco_id INTEGER NOT NULL REFERENCES blocos(id) ON DELETE CASCADE,
  agrupador_id INTEGER NOT NULL REFERENCES agrupadores(id) ON DELETE CASCADE,
  unidade_ids INTEGER[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tipos_msg_rapidas (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS msg_rapidas (
  id SERIAL PRIMARY KEY,
  tipo_id INTEGER NOT NULL REFERENCES tipos_msg_rapidas(id) ON DELETE CASCADE,
  texto TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('rapida', 'convencional')),
  sender VARCHAR(100) NOT NULL,
  assunto VARCHAR(200),
  content TEXT NOT NULL,
  destinatario_tipo VARCHAR(15) NOT NULL CHECK (destinatario_tipo IN ('unidade', 'grupo', 'sindico-role')),
  destinatario_id INTEGER NOT NULL,
  inicio_vigencia TIMESTAMP NOT NULL,
  fim_vigencia TIMESTAMP NOT NULL,
  tipo_msg_rapida_id INTEGER REFERENCES tipos_msg_rapidas(id),
  msg_rapida_id INTEGER REFERENCES msg_rapidas(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_vigencia CHECK (fim_vigencia > inicio_vigencia)
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_role VARCHAR(20) NOT NULL,
  user_bloco VARCHAR(50),
  user_unidade VARCHAR(50),
  subscription_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS vapid_keys (
  id SERIAL PRIMARY KEY,
  public_key TEXT NOT NULL,
  private_key TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"
```

## 4. Configuração de Variáveis de Ambiente (Secrets)

### 4.1 Acessar Secrets no Replit
1. No painel lateral, clique em **Tools**
2. Selecione **Secrets**
3. Adicione as seguintes variáveis:

### 4.2 Configuração de Email
```bash
# Email Configuration
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=sua-senha-de-app-gmail
ADMIN_EMAIL=admin@seucondominio.com
```

### 4.3 Configuração de Ambiente
```bash
# Environment
NODE_ENV=production
DATABASE_URL=sua-string-de-conexao-postgresql
```

### 4.4 Geração de Senha de App (Gmail)
1. Acesse [myaccount.google.com](https://myaccount.google.com)
2. Vá em **Segurança** → **Verificação em duas etapas**
3. Role até **Senhas de app**
4. Clique em **Selecionar app** → **Outro (nome personalizado)**
5. Digite "CondoApp" e clique em **Gerar**
6. **Copie a senha gerada** (16 caracteres)
7. Cole em `EMAIL_PASS` no Secrets

## 5. Instalação de Dependências

### 5.1 Verificar package.json
O arquivo `package.json` deve conter:

```json
{
  "name": "condoapp",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "express": "^5.1.0",
    "pg": "^8.16.0",
    "bcryptjs": "^3.0.2",
    "nodemailer": "^7.0.3",
    "web-push": "^3.6.7",
    "bootstrap": "^5.3.3",
    "dotenv": "^16.5.0",
    "cookie-parser": "^1.4.7",
    "express-session": "^1.18.1"
  }
}
```

### 5.2 Instalação Automática
O Replit instala automaticamente as dependências quando você:
- Executa o projeto pela primeira vez
- Modifica o `package.json`

## 6. Configuração Inicial do Sistema

### 6.1 Criação do Admin Principal
Execute o script para criar o admin:

```bash
node gera-hash.js
```

**Ou crie manualmente:**
```sql
-- Conecte ao PostgreSQL e execute:
INSERT INTO users (username, password, name, email, role, aprovado, primeiro_acesso) 
VALUES ('admin', '$2a$10$hash-aqui', 'Administrador', 'admin@condoapp.com', 'admin-app', true, false);
```

### 6.2 Geração de Chaves VAPID
```bash
# Execute no terminal do Replit
node -e "
const webpush = require('web-push');
const keys = webpush.generateVAPIDKeys();
console.log('Public Key:', keys.publicKey);
console.log('Private Key:', keys.privateKey);
"
```

### 6.3 Inserção das Chaves no Banco
```sql
INSERT INTO vapid_keys (public_key, private_key) 
VALUES ('sua-chave-publica', 'sua-chave-privada');
```

## 7. Execução e Teste

### 7.1 Iniciar o Servidor
1. **Via Run Button**: Clique no botão "Run" no Replit
2. **Via Terminal**:
   ```bash
   node index.js
   ```

### 7.2 Verificar Funcionamento
O servidor deve exibir:
```
Servidor rodando na porta 3000
Banco PostgreSQL conectado com sucesso
VAPID keys carregadas: {public: "BNr...", private: "..."}
```

### 7.3 Acessar a Aplicação
- **URL Local**: `https://seu-repl.replit.dev`
- **Porta**: 3000 (mapeada automaticamente)

## 8. Configuração de Deployment

### 8.1 Configurar Autoscale
1. No Replit, vá em **Deployments**
2. Clique em **Create deployment**
3. Selecione **Autoscale**
4. Configure:
   - **Build Command**: `npm install`
   - **Run Command**: `node index.js`

### 8.2 Verificar .replit
O arquivo `.replit` deve conter:
```ini
entrypoint = "index.js"
modules = ["nodejs-22", "postgresql-16"]

[deployment]
run = ["node", "index.js"]
deploymentTarget = "autoscale"
ignorePorts = false

[[ports]]
localPort = 3000
externalPort = 80
```

## 9. Tarefas de Manutenção

### 9.1 Cleanup Automático
Configure o cron job para limpeza:
```bash
# Criar script de cleanup
chmod +x cleanup-daily.sh

# Teste manual
./cleanup-daily.sh
```

### 9.2 Backup do Banco
```bash
# Backup manual
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restauração
psql $DATABASE_URL < backup_arquivo.sql
```

## 10. Troubleshooting

### 10.1 Problemas Comuns

**Erro de Conexão PostgreSQL:**
```bash
# Verificar string de conexão
echo $DATABASE_URL

# Testar conexão
psql $DATABASE_URL -c "SELECT version();"
```

**Erro de Email:**
- Verificar se a senha de app está correta
- Confirmar que a verificação em duas etapas está ativa
- Testar SMTP:
```bash
node -e "
const nodemailer = require('nodemailer');
const transport = nodemailer.createTransporter({...});
transport.verify((err, success) => console.log(err || 'Email OK'));
"
```

**Service Worker não funciona:**
- Verificar se está sendo servido via HTTPS
- Inspecionar console do navegador
- Verificar se as chaves VAPID estão no banco

### 10.2 Logs e Monitoramento
```bash
# Verificar logs do servidor
tail -f /tmp/logs/condoapp.log

# Monitorar processo
ps aux | grep node

# Verificar uso de memória
free -h
```

## 11. Checklist de Instalação

- [ ] Projeto criado no Replit
- [ ] Código fonte carregado
- [ ] PostgreSQL conectado
- [ ] Tabelas criadas
- [ ] Secrets configurados (EMAIL_USER, EMAIL_PASS, etc.)
- [ ] Admin principal criado
- [ ] Chaves VAPID geradas e inseridas
- [ ] Servidor executando sem erros
- [ ] Aplicação acessível via browser
- [ ] Login funcionando
- [ ] Email de recuperação funcionando
- [ ] Notificações push funcionando
- [ ] Deployment configurado

## 12. Próximos Passos

1. **Configurar estrutura organizacional** (blocos, agrupadores, unidades)
2. **Criar tipos de mensagens rápidas**
3. **Cadastrar usuários síndicos** 
4. **Testar fluxo completo** de mensagens
5. **Configurar backup automático**
6. **Documentar procedimentos** específicos do condomínio

---

**Data:** Janeiro 2025  
**Versão:** 1.0  
**Autor:** Documentação CondoApp  
**Suporte:** Para dúvidas, consulte os demais documentos da pasta `/docs/`
