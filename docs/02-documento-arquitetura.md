
# 🏗️ Documento de Arquitetura - CondoApp

## 1. Introdução

### 1.1 Propósito
Este documento descreve a arquitetura técnica do CondoApp, detalhando componentes, tecnologias, padrões arquiteturais e decisões de design.

### 1.2 Escopo
Abrange a arquitetura completa do sistema, desde a camada de apresentação até persistência de dados, incluindo integrações externas.

### 1.3 Definições
- **MVC**: Model-View-Controller
- **SPA**: Single Page Application (comportamento)
- **REST**: Representational State Transfer
- **CRUD**: Create, Read, Update, Delete

## 2. Representação Arquitetural

### 2.1 Visão Geral
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   APRESENTAÇÃO  │    │     NEGÓCIO     │    │  PERSISTÊNCIA   │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ HTML5/CSS3/JS   │◄──►│ Node.js/Express │◄──►│   PostgreSQL    │
│ Bootstrap 5.3   │    │ RESTful APIs    │    │   Queries SQL   │
│ Service Worker  │    │ Business Logic  │    │   Transações    │
│ PWA Manifest    │    │ Authentication  │    │   Constraints   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
          │                       │                       
          ▼                       ▼                       
┌─────────────────┐    ┌─────────────────┐               
│   INTEGRAÇÕES   │    │    NOTIFICAÇÕES │               
├─────────────────┤    ├─────────────────┤               
│ Email (SMTP)    │    │ Web Push API    │               
│ Nodemailer      │    │ VAPID Keys      │               
│ Gmail Service   │    │ Service Worker  │               
└─────────────────┘    └─────────────────┘               
```

## 3. Metas e Restrições Arquiteturais

### 3.1 Metas
- **Escalabilidade**: Suporte a múltiplos condomínios
- **Performance**: Resposta < 3s para operações críticas
- **Segurança**: Autenticação robusta e criptografia
- **Usabilidade**: Interface responsiva e intuitiva
- **Manutenibilidade**: Código modular e documentado

### 3.2 Restrições
- **Tecnológica**: Node.js + PostgreSQL + Replit
- **Deployment**: Máximo 8GB no Replit
- **Browser**: Suporte a Service Workers obrigatório
- **Conectividade**: Dependência de internet

## 4. Visão de Casos de Uso

### 4.1 Casos de Uso Principais
```
                    ┌─────────────┐
                    │    Admin    │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
         [Configurar] [Aprovar]   [Gerenciar]
         [Sistema]   [Síndicos]   [Usuários]
              
                    ┌─────────────┐
                    │   Síndico   │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
         [Enviar]     [Cadastrar]  [Gerenciar]
         [Mensagens]  [Moradores]  [Estrutura]
              
                    ┌─────────────┐
                    │   Morador   │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
         [Visualizar] [Responder]  [Configurar]
         [Mensagens]  [Síndico]    [Perfil]
```

## 5. Visão Lógica

### 5.1 Camadas da Aplicação

#### 5.1.1 Camada de Apresentação
```javascript
// Estrutura de arquivos frontend
public/
├── index.html          // Página inicial
├── login.html          // Autenticação
├── dashboard.html      // Painel principal
├── style.css          // Estilos personalizados
├── script.js          // Lógica principal
├── sw.js              // Service Worker
├── manifest.json      // PWA Manifest
└── assets/            // Recursos estáticos
```

**Responsabilidades:**
- Interface do usuário responsiva
- Validação de formulários
- Gerenciamento de estado local
- Comunicação com APIs REST
- Notificações push

#### 5.1.2 Camada de Negócio
```javascript
// Estrutura do backend
├── index.js           // Servidor principal + rotas
├── database.js        // Camada de dados
├── email.js          // Serviços de email
├── cleanup-messages.js // Limpeza automática
└── routes/
    └── auth.js       // Rotas de autenticação
```

**Responsabilidades:**
- Lógica de negócio
- Validação de regras
- Autenticação e autorização
- Gerenciamento de sessões
- Processamento de mensagens

#### 5.1.3 Camada de Persistência
```sql
-- Principais entidades
users          -- Usuários do sistema
blocos         -- Blocos do condomínio
agrupadores    -- Agrupadores dos blocos
unidades       -- Unidades habitacionais
grupos         -- Grupos de destinatários
messages       -- Mensagens do sistema
msg_rapidas    -- Templates de mensagens
push_subscriptions -- Subscrições para notificações
vapid_keys     -- Chaves para push notifications
```

### 5.2 Pacotes Significativos

#### 5.2.1 Autenticação (`auth.js`)
- Gerenciamento de login/logout
- Recuperação de senhas
- Validação de tokens
- Aprovação de usuários

#### 5.2.2 Mensagens (`index.js - seção messages`)
- CRUD de mensagens
- Sistema de vigência temporal
- Segmentação de destinatários
- Limpeza automática

#### 5.2.3 Notificações (`push-notifications.js`)
- Registro de Service Workers
- Gerenciamento de subscrições
- Envio de notificações segmentadas
- Badge count dinâmico

## 6. Visão de Implementação

### 6.1 Estrutura de Módulos

```
CondoApp/
├── Frontend (Browser)
│   ├── Static Assets
│   ├── Service Worker
│   └── PWA Components
├── Backend (Node.js)
│   ├── Express Server
│   ├── Business Logic
│   ├── Authentication
│   └── Email Services
├── Database (PostgreSQL)
│   ├── User Management
│   ├── Organizational Structure
│   ├── Message System
│   └── Push Subscriptions
└── External Services
    ├── Gmail SMTP
    ├── Web Push Service
    └── Replit Platform
```

### 6.2 Dependências Principais

```json
{
  "express": "^5.1.0",          // Framework web
  "pg": "^8.16.0",              // PostgreSQL client
  "bcryptjs": "^3.0.2",         // Criptografia
  "nodemailer": "^7.0.3",       // Email service
  "web-push": "^3.6.7",         // Push notifications
  "bootstrap": "^5.3.3",        // UI framework
  "dotenv": "^16.5.0"           // Environment vars
}
```

## 7. Visão de Deployment

### 7.1 Arquitetura de Deployment

```
┌─────────────────────────────────────────────────────────┐
│                    REPLIT CLOUD                         │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Web App   │  │  Database   │  │   Secrets   │     │
│  │  (Node.js)  │  │(PostgreSQL) │  │   (Env)     │     │
│  │   Port 3000 │  │             │  │             │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
├─────────────────────────────────────────────────────────┤
│                   EXTERNAL SERVICES                     │
│  ┌─────────────┐  ┌─────────────┐                      │
│  │ Gmail SMTP  │  │ Push Service│                      │
│  │ (Email)     │  │ (Browser)   │                      │
│  └─────────────┘  └─────────────┘                      │
└─────────────────────────────────────────────────────────┘
```

### 7.2 Configuração de Ambiente

#### 7.2.1 Variáveis de Ambiente (Secrets)
```bash
# Database
DATABASE_URL=postgresql://...

# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
ADMIN_EMAIL=admin@condominio.com

# Environment
NODE_ENV=production
```

#### 7.2.2 Configuração do Servidor
```javascript
const PORT = 3000; // Porta padrão Replit
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
```

## 8. Visão de Dados

### 8.1 Modelo Lógico Principal

```sql
-- Estrutura hierárquica organizacional
blocos (1) ──────── (N) agrupadores
   │                       │
   │                       │
   │ (N)               (N) │
   └─── grupos ───────────┘
          │
          │ (N)
          └─── unidades (N)

-- Sistema de usuários e mensagens
users (1) ──── (N) push_subscriptions
users (N) ──── (N) messages (via destinatario)
messages (N) ─ (1) msg_rapidas
msg_rapidas (N) ─ (1) tipos_msg_rapidas
```

### 8.2 Entidades Principais

#### 8.2.1 Users (Usuários)
```sql
users {
  id: SERIAL PRIMARY KEY
  username: VARCHAR(50) UNIQUE
  password: VARCHAR(255) -- BCrypt hash
  name: VARCHAR(100)
  email: VARCHAR(100) UNIQUE
  role: VARCHAR(20) -- admin-app, sindico, morador, mensageiro
  aprovado: BOOLEAN
  unread_count: INTEGER -- Sistema de badge
}
```

#### 8.2.2 Messages (Mensagens)
```sql
messages {
  id: SERIAL PRIMARY KEY
  tipo: VARCHAR(20) -- rapida, convencional
  sender: VARCHAR(100)
  content: TEXT
  destinatario_tipo: VARCHAR(15) -- unidade, grupo, sindico-role
  destinatario_id: INTEGER
  inicio_vigencia: TIMESTAMP
  fim_vigencia: TIMESTAMP
}
```

## 9. Qualidade

### 9.1 Performance
- **Connection Pooling**: PostgreSQL pool para otimização
- **Cleanup Automático**: Remoção de mensagens expiradas
- **Índices**: Em campos de busca frequente
- **Caching**: Service Worker para assets estáticos

### 9.2 Segurança
- **Autenticação**: BCrypt + tokens temporários
- **Autorização**: Verificação por perfil de usuário
- **Validação**: Sanitização de entrada
- **HTTPS**: Protocolo seguro em produção

### 9.3 Escalabilidade
- **Stateless**: Servidor sem estado de sessão
- **Modular**: Separação clara de responsabilidades
- **Database**: Estrutura normalizada
- **Push**: Sistema assíncrono de notificações

## 10. Decisões Arquiteturais

### 10.1 Escolhas Tecnológicas

| Aspecto | Tecnologia | Justificativa |
|---------|------------|---------------|
| **Backend** | Node.js + Express | Ecosystem JavaScript, performance, simplicidade |
| **Database** | PostgreSQL | Robustez, ACID, arrays nativos |
| **Frontend** | Vanilla JS + Bootstrap | Simplicidade, performance, responsividade |
| **Push** | Web Push API | Padrão web, multiplataforma |
| **PWA** | Service Worker | Experiência nativa, offline |

### 10.2 Padrões Arquiteturais

#### 10.2.1 MVC Adaptado
- **Model**: Camada de dados (database.js)
- **View**: Frontend HTML/CSS/JS
- **Controller**: Rotas Express (index.js)

#### 10.2.2 REST API
- Endpoints semânticos
- HTTP methods apropriados
- Status codes padronizados
- JSON como formato padrão

### 10.3 Sistema de Badge Simplificado
```javascript
// Sistema B: Badge baseado em unread_count
// - Incrementa ao receber mensagem
// - Zera ao acessar dashboard
// - Simples e eficiente
```

---

**Data:** Janeiro 2025  
**Versão:** 1.0  
**Autor:** Documentação CondoApp
