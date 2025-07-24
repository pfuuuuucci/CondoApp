
# 🗄️ Modelo de Dados - CondoApp

## 1. Introdução

### 1.1 Propósito
Este documento descreve o modelo de dados completo do CondoApp, incluindo entidades, relacionamentos, constraints e políticas de integridade.

### 1.2 Convenções
- **Nomenclatura**: snake_case para tabelas e colunas
- **Chaves**: PRIMARY KEY sempre `id SERIAL`
- **Timestamps**: Sempre em UTC
- **Nullable**: Apenas quando necessário para o negócio

## 2. Diagrama Entidade-Relacionamento (ERD)

```
                    ┌─────────────┐
                    │    users    │
                    ├─────────────┤
                    │ id (PK)     │
                    │ username    │
                    │ password    │
                    │ name        │
                    │ email       │
                    │ role        │
                    │ unread_count│
                    └─────┬───────┘
                          │ 1
                          │
                          │ N
              ┌───────────▼──────────┐
              │ push_subscriptions   │
              ├──────────────────────┤
              │ id (PK)              │
              │ user_id (FK)         │
              │ subscription_data    │
              └──────────────────────┘

┌─────────────┐    1:N    ┌──────────────┐    N:1    ┌─────────────┐
│   blocos    │◄──────────┤ agrupadores  ├──────────►│   grupos    │
├─────────────┤           ├──────────────┤           ├─────────────┤
│ id (PK)     │           │ id (PK)      │           │ id (PK)     │
│ nome        │           │ nome         │           │ bloco_id    │
└─────────────┘           │ bloco_id(FK) │           │ agrupador_id│
                          └──────────────┘           │ unidade_ids │
                                                     └─────────────┘
                                                           │ N
                                                           │
                                                           │ N
                          ┌─────────────┐                  │
                          │  unidades   │◄─────────────────┘
                          ├─────────────┤
                          │ id (PK)     │
                          │ nome        │
                          └─────────────┘

                    ┌─────────────────┐    N:1    ┌──────────────────┐
                    │    messages     │◄──────────┤ tipos_msg_rapidas│
                    ├─────────────────┤           ├──────────────────┤
                    │ id (PK)         │           │ id (PK)          │
                    │ tipo            │           │ nome             │
                    │ sender          │           └──────────────────┘
                    │ content         │                    │ 1
                    │ destinatario_   │                    │
                    │ inicio_vigencia │                    │ N
                    │ fim_vigencia    │           ┌────────▼─────────┐
                    │ tipo_msg_id(FK) │           │   msg_rapidas    │
                    │ msg_rapida_id   │◄──────────┤                  │
                    └─────────────────┘           ├──────────────────┤
                                                  │ id (PK)          │
                                                  │ tipo_id (FK)     │
                                                  │ texto            │
                                                  └──────────────────┘

                          ┌─────────────┐
                          │ vapid_keys  │
                          ├─────────────┤
                          │ id (PK)     │
                          │ public_key  │
                          │ private_key │
                          └─────────────┘
```

## 3. Dicionário de Dados

### 3.1 Tabela: users

Armazena todos os usuários do sistema com diferentes perfis de acesso.

| Campo | Tipo | Nulo | Padrão | Descrição |
|-------|------|------|--------|-----------|
| `id` | SERIAL | Não | - | Identificador único |
| `username` | VARCHAR(50) | Não | - | Login único do usuário |
| `password` | VARCHAR(255) | Sim | - | Hash BCrypt da senha |
| `name` | VARCHAR(100) | Não | - | Nome completo |
| `email` | VARCHAR(100) | Não | - | Email único |
| `telefone` | VARCHAR(15) | Sim | - | Telefone (apenas números) |
| `bloco` | VARCHAR(50) | Sim | - | Bloco do usuário |
| `unidade` | VARCHAR(50) | Sim | - | Unidade do usuário |
| `role` | VARCHAR(20) | Não | - | Perfil: admin-app, sindico, morador, mensageiro |
| `aprovado` | BOOLEAN | Não | false | Se usuário foi aprovado pelo admin |
| `primeiro_acesso` | BOOLEAN | Não | true | Se é o primeiro login |
| `token_recuperacao` | VARCHAR(10) | Sim | - | Token temporário para recuperação |
| `token_expira` | TIMESTAMP | Sim | - | Expiração do token |
| `unread_count` | INTEGER | Não | 0 | Contador de mensagens não lidas |
| `created_at` | TIMESTAMP | Não | NOW() | Data de criação |

**Constraints:**
- `UNIQUE(username, email)`
- `CHECK (role IN ('admin-app', 'sindico', 'morador', 'mensageiro'))`

### 3.2 Tabela: blocos

Representa as divisões físicas principais do condomínio.

| Campo | Tipo | Nulo | Padrão | Descrição |
|-------|------|------|--------|-----------|
| `id` | SERIAL | Não | - | Identificador único |
| `nome` | VARCHAR(100) | Não | - | Nome do bloco |
| `created_at` | TIMESTAMP | Não | NOW() | Data de criação |

### 3.3 Tabela: agrupadores

Subdivisões dos blocos (andares, alas, etc.).

| Campo | Tipo | Nulo | Padrão | Descrição |
|-------|------|------|--------|-----------|
| `id` | SERIAL | Não | - | Identificador único |
| `nome` | VARCHAR(100) | Não | - | Nome do agrupador |
| `bloco_id` | INTEGER | Não | - | Referência ao bloco |
| `created_at` | TIMESTAMP | Não | NOW() | Data de criação |

**Constraints:**
- `FOREIGN KEY (bloco_id) REFERENCES blocos(id) ON DELETE CASCADE`

### 3.4 Tabela: unidades

Unidades habitacionais individuais (apartamentos, casas).

| Campo | Tipo | Nulo | Padrão | Descrição |
|-------|------|------|--------|-----------|
| `id` | SERIAL | Não | - | Identificador único |
| `nome` | VARCHAR(100) | Não | - | Identificação da unidade |
| `created_at` | TIMESTAMP | Não | NOW() | Data de criação |

**Observação:** Sistema livre - unidades não obrigatoriamente vinculadas a blocos.

### 3.5 Tabela: grupos

Grupos de destinatários formados por bloco + agrupador + unidades.

| Campo | Tipo | Nulo | Padrão | Descrição |
|-------|------|------|--------|-----------|
| `id` | SERIAL | Não | - | Identificador único |
| `bloco_id` | INTEGER | Não | - | Referência ao bloco |
| `agrupador_id` | INTEGER | Não | - | Referência ao agrupador |
| `unidade_ids` | INTEGER[] | Não | - | Array de IDs das unidades |
| `created_at` | TIMESTAMP | Não | NOW() | Data de criação |

**Constraints:**
- `FOREIGN KEY (bloco_id) REFERENCES blocos(id) ON DELETE CASCADE`
- `FOREIGN KEY (agrupador_id) REFERENCES agrupadores(id) ON DELETE CASCADE`

### 3.6 Tabela: tipos_msg_rapidas

Categorias para agrupar mensagens rápidas.

| Campo | Tipo | Nulo | Padrão | Descrição |
|-------|------|------|--------|-----------|
| `id` | SERIAL | Não | - | Identificador único |
| `nome` | VARCHAR(100) | Não | - | Nome da categoria |
| `created_at` | TIMESTAMP | Não | NOW() | Data de criação |

### 3.7 Tabela: msg_rapidas

Templates de mensagens pré-definidas.

| Campo | Tipo | Nulo | Padrão | Descrição |
|-------|------|------|--------|-----------|
| `id` | SERIAL | Não | - | Identificador único |
| `tipo_id` | INTEGER | Não | - | Categoria da mensagem |
| `texto` | TEXT | Não | - | Conteúdo do template |
| `created_at` | TIMESTAMP | Não | NOW() | Data de criação |

**Constraints:**
- `FOREIGN KEY (tipo_id) REFERENCES tipos_msg_rapidas(id) ON DELETE CASCADE`

### 3.8 Tabela: messages

Sistema principal de mensagens do CondoApp.

| Campo | Tipo | Nulo | Padrão | Descrição |
|-------|------|------|--------|-----------|
| `id` | SERIAL | Não | - | Identificador único |
| `tipo` | VARCHAR(20) | Não | - | Tipo: 'rapida' ou 'convencional' |
| `sender` | VARCHAR(100) | Não | - | Remetente da mensagem |
| `assunto` | VARCHAR(200) | Sim | - | Assunto (só para convencionais) |
| `content` | TEXT | Não | - | Conteúdo da mensagem |
| `destinatario_tipo` | VARCHAR(15) | Não | - | Tipo: 'unidade', 'grupo', 'sindico-role' |
| `destinatario_id` | INTEGER | Não | - | ID do destinatário (0 para sindico-role) |
| `inicio_vigencia` | TIMESTAMP | Não | - | Início da validade |
| `fim_vigencia` | TIMESTAMP | Não | - | Fim da validade |
| `tipo_msg_rapida_id` | INTEGER | Sim | - | Ref. ao tipo (se for rápida) |
| `msg_rapida_id` | INTEGER | Sim | - | Ref. ao template (se for rápida) |
| `created_at` | TIMESTAMP | Não | NOW() | Data de criação |

**Constraints:**
- `CHECK (tipo IN ('rapida', 'convencional'))`
- `CHECK (destinatario_tipo IN ('unidade', 'grupo', 'sindico-role'))`
- `FOREIGN KEY (tipo_msg_rapida_id) REFERENCES tipos_msg_rapidas(id)`
- `FOREIGN KEY (msg_rapida_id) REFERENCES msg_rapidas(id)`

### 3.9 Tabela: push_subscriptions

Subscrições para notificações push dos usuários.

| Campo | Tipo | Nulo | Padrão | Descrição |
|-------|------|------|--------|-----------|
| `id` | SERIAL | Não | - | Identificador único |
| `user_id` | INTEGER | Não | - | Usuário proprietário |
| `user_role` | VARCHAR(20) | Não | - | Role do usuário |
| `user_bloco` | VARCHAR(50) | Sim | - | Bloco do usuário |
| `user_unidade` | VARCHAR(50) | Sim | - | Unidade do usuário |
| `subscription_data` | JSONB | Não | - | Dados da subscrição push |
| `created_at` | TIMESTAMP | Não | NOW() | Data de criação |
| `updated_at` | TIMESTAMP | Não | NOW() | Última atualização |

**Constraints:**
- `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`
- `UNIQUE(user_id)` - Um usuário = uma subscrição

### 3.10 Tabela: vapid_keys

Chaves VAPID permanentes para notificações push.

| Campo | Tipo | Nulo | Padrão | Descrição |
|-------|------|------|--------|-----------|
| `id` | SERIAL | Não | - | Identificador único |
| `public_key` | TEXT | Não | - | Chave pública VAPID |
| `private_key` | TEXT | Não | - | Chave privada VAPID |
| `created_at` | TIMESTAMP | Não | NOW() | Data de geração |

## 4. Relacionamentos

### 4.1 Relacionamentos 1:N

1. **blocos → agrupadores**
   - Um bloco pode ter vários agrupadores
   - Deleção em cascata

2. **tipos_msg_rapidas → msg_rapidas**
   - Um tipo pode ter várias mensagens
   - Deleção em cascata

3. **users → push_subscriptions**
   - Um usuário pode ter uma subscrição
   - Deleção em cascata

### 4.2 Relacionamentos N:M

1. **grupos ↔ unidades** (via array)
   - Um grupo contém várias unidades
   - Uma unidade pode estar em vários grupos
   - Implementado via `unidade_ids INTEGER[]`

### 4.3 Relacionamentos Complexos

1. **messages → destinatários**
   - Relacionamento polimórfico via `destinatario_tipo` + `destinatario_id`
   - Pode apontar para: unidades, grupos, ou role especial (síndicos)

## 5. Índices e Performance

### 5.1 Índices Automáticos
```sql
-- Primary Keys (automáticos)
users_pkey ON users(id)
blocos_pkey ON blocos(id)
messages_pkey ON messages(id)
-- ... demais PKs

-- Unique Constraints
users_username_key ON users(username)
users_email_key ON users(email)
push_subscriptions_user_id_key ON push_subscriptions(user_id)
```

### 5.2 Índices Recomendados
```sql
-- Performance para buscas frequentes
CREATE INDEX idx_messages_vigencia ON messages(fim_vigencia);
CREATE INDEX idx_messages_destinatario ON messages(destinatario_tipo, destinatario_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_aprovado ON users(aprovado);
```

## 6. Integridade e Constraints

### 6.1 Regras de Integridade Referencial

1. **Agrupadores dependem de Blocos**
   ```sql
   CONSTRAINT fk_agrupadores_bloco 
   FOREIGN KEY (bloco_id) REFERENCES blocos(id) ON DELETE CASCADE
   ```

2. **Grupos dependem de Blocos e Agrupadores**
   ```sql
   CONSTRAINT fk_grupos_bloco 
   FOREIGN KEY (bloco_id) REFERENCES blocos(id) ON DELETE CASCADE
   
   CONSTRAINT fk_grupos_agrupador 
   FOREIGN KEY (agrupador_id) REFERENCES agrupadores(id) ON DELETE CASCADE
   ```

3. **Subscrições dependem de Usuários**
   ```sql
   CONSTRAINT fk_push_user 
   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
   ```

### 6.2 Constraints de Domínio

1. **Roles válidos**
   ```sql
   CONSTRAINT chk_user_role 
   CHECK (role IN ('admin-app', 'sindico', 'morador', 'mensageiro'))
   ```

2. **Tipos de mensagem válidos**
   ```sql
   CONSTRAINT chk_message_tipo 
   CHECK (tipo IN ('rapida', 'convencional'))
   
   CONSTRAINT chk_destinatario_tipo 
   CHECK (destinatario_tipo IN ('unidade', 'grupo', 'sindico-role'))
   ```

3. **Vigência consistente**
   ```sql
   CONSTRAINT chk_vigencia 
   CHECK (fim_vigencia > inicio_vigencia)
   ```

## 7. Políticas de Dados

### 7.1 Retenção de Dados

1. **Mensagens**: Expiram automaticamente baseado em `fim_vigencia`
2. **Tokens**: Expiram automaticamente baseado em `token_expira`
3. **Logs**: Sistema de limpeza automática via `cleanup-messages.js`

### 7.2 Backup e Recuperação

1. **Backup diário**: Gerenciado pelo Replit PostgreSQL
2. **Point-in-time recovery**: Disponível via Replit
3. **Dados críticos**: Users, estrutura organizacional

### 7.3 Segurança de Dados

1. **Senhas**: Hash BCrypt, nunca em texto claro
2. **Tokens**: Temporários com expiração automática
3. **Emails**: Validação de formato obrigatória
4. **Subscrições**: Dados JSONB validados pelo Web Push

## 8. Evolução do Schema

### 8.1 Versionamento
- Alterações controladas via migrations
- Sempre backward compatible quando possível
- Documentação de breaking changes

### 8.2 Campos Futuros Previstos
```sql
-- Possíveis extensões futuras
ALTER TABLE users ADD COLUMN avatar_url TEXT;
ALTER TABLE messages ADD COLUMN priority INTEGER DEFAULT 1;
ALTER TABLE blocos ADD COLUMN descricao TEXT;
```

---

**Data:** Janeiro 2025  
**Versão:** 1.0  
**Autor:** Documentação CondoApp
