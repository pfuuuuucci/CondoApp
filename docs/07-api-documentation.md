
# 🔌 Documentação da API - CondoApp

## 1. Introdução

### 1.1 Sobre a API
O CondoApp utiliza uma API REST interna para comunicação entre frontend e backend. Esta documentação detalha todos os endpoints disponíveis, métodos HTTP, parâmetros e respostas.

### 1.2 Características Gerais
- **Arquitetura**: REST API
- **Formato**: JSON
- **Autenticação**: Session-based
- **URL Base**: `https://seu-dominio.replit.dev`
- **Porta**: 3000 (mapeada para 80/443 em produção)

### 1.3 Convenções
- **HTTP Methods**: GET, POST, PUT, DELETE
- **Status Codes**: Padrão HTTP
- **Content-Type**: `application/json`
- **Charset**: UTF-8

## 2. Autenticação e Sessão

### 2.1 Sistema de Sessão
```javascript
// Configuração de sessão (Express)
session({
  secret: 'chave-secreta-unica',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // true em HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
})
```

### 2.2 Verificação de Autenticação
Middleware aplicado automaticamente em rotas protegidas:
```javascript
// Verificação de sessão
if (!req.session.user) {
  return res.status(401).json({ error: 'Não autorizado' });
}
```

## 3. Endpoints da API

---

### 3.1 AUTENTICAÇÃO

#### POST `/auth/login`
Realiza login do usuário no sistema.

**Request:**
```json
{
  "username": "joao.silva",
  "password": "minhasenha123"
}
```

**Response - Sucesso (200):**
```json
{
  "message": "Login realizado com sucesso",
  "user": {
    "id": 1,
    "username": "joao.silva",
    "name": "João Silva",
    "email": "joao@email.com",
    "role": "morador",
    "primeiro_acesso": false
  },
  "redirect": "/dashboard.html"
}
```

**Response - Primeiro Acesso (200):**
```json
{
  "message": "Primeiro acesso detectado",
  "redirect": "/nova-senha.html"
}
```

**Response - Erro (401):**
```json
{
  "error": "Credenciais inválidas"
}
```

**Response - Não Aprovado (403):**
```json
{
  "error": "Usuário ainda não foi aprovado"
}
```

#### POST `/auth/logout`
Encerra a sessão do usuário.

**Response (200):**
```json
{
  "message": "Logout realizado com sucesso"
}
```

#### POST `/auth/nova-senha`
Altera senha no primeiro acesso.

**Request:**
```json
{
  "nova_senha": "novaSenhaSegura123"
}
```

**Response (200):**
```json
{
  "message": "Senha alterada com sucesso"
}
```

#### POST `/auth/esqueci-senha`
Solicita token de recuperação de senha.

**Request:**
```json
{
  "email": "joao@email.com"
}
```

**Response (200):**
```json
{
  "message": "Token enviado para o email"
}
```

#### POST `/auth/validar-token`
Valida token de recuperação.

**Request:**
```json
{
  "email": "joao@email.com",
  "token": "123456"
}
```

**Response (200):**
```json
{
  "message": "Token válido"
}
```

#### POST `/auth/redefinir-senha`
Redefine senha usando token válido.

**Request:**
```json
{
  "email": "joao@email.com",
  "token": "123456",
  "nova_senha": "novaSenhaSegura123"
}
```

**Response (200):**
```json
{
  "message": "Senha redefinida com sucesso"
}
```

#### POST `/auth/reenviar-token`
Reenvia token de recuperação.

**Request:**
```json
{
  "email": "joao@email.com"
}
```

**Response (200):**
```json
{
  "message": "Novo token enviado"
}
```

---

### 3.2 CADASTRO DE SÍNDICOS

#### POST `/cadastro-sindico`
Cadastra novo síndico (aguarda aprovação).

**Request:**
```json
{
  "login": "sindico.bloco1",
  "nome": "Carlos Santos",
  "email": "carlos@email.com",
  "celular": "(11) 98765-4321",
  "bloco": "Bloco 1",
  "unidade": "101"
}
```

**Response (201):**
```json
{
  "message": "Cadastro realizado! Aguarde aprovação do administrador.",
  "tokenEnviado": true
}
```

**Response - Erro (400):**
```json
{
  "error": "Login já existe"
}
```

---

### 3.3 USUÁRIOS

#### GET `/usuarios-pendentes`
Lista síndicos aguardando aprovação (apenas admin).

**Response (200):**
```json
[
  {
    "id": 2,
    "username": "sindico.bloco1",
    "name": "Carlos Santos",
    "email": "carlos@email.com",
    "telefone": "(11) 98765-4321",
    "bloco": "Bloco 1",
    "unidade": "101",
    "created_at": "2025-01-15T10:30:00Z"
  }
]
```

#### POST `/aprovar-usuario/:id`
Aprova cadastro de síndico (apenas admin).

**Response (200):**
```json
{
  "message": "Usuário aprovado com sucesso"
}
```

#### GET `/usuarios`
Lista todos os usuários do sistema.

**Response (200):**
```json
[
  {
    "id": 1,
    "username": "admin",
    "name": "Administrador",
    "email": "admin@condoapp.com",
    "role": "admin-app",
    "aprovado": true
  },
  {
    "id": 2,
    "username": "joao.silva",
    "name": "João Silva",
    "email": "joao@email.com",
    "role": "morador",
    "aprovado": true,
    "bloco": "Torre A",
    "unidade": "203"
  }
]
```

#### POST `/usuarios`
Cadastra novo usuário (síndicos podem cadastrar moradores/mensageiros).

**Request:**
```json
{
  "username": "maria.santos",
  "name": "Maria Santos",
  "email": "maria@email.com",
  "telefone": "(11) 91234-5678",
  "bloco": "Torre B",
  "unidade": "105",
  "role": "morador",
  "password": "senhaTemporaria123"
}
```

**Response (201):**
```json
{
  "message": "Usuário cadastrado com sucesso",
  "user": {
    "id": 15,
    "username": "maria.santos",
    "name": "Maria Santos"
  }
}
```

---

### 3.4 ESTRUTURA ORGANIZACIONAL

#### GET `/blocos`
Lista todos os blocos.

**Response (200):**
```json
[
  {
    "id": 1,
    "nome": "Torre A",
    "created_at": "2025-01-10T00:00:00Z"
  },
  {
    "id": 2,
    "nome": "Torre B",
    "created_at": "2025-01-10T00:00:00Z"
  }
]
```

#### POST `/blocos`
Cria novo bloco.

**Request:**
```json
{
  "nome": "Torre C"
}
```

**Response (201):**
```json
{
  "message": "Bloco criado com sucesso",
  "bloco": {
    "id": 3,
    "nome": "Torre C"
  }
}
```

#### PUT `/blocos/:id`
Atualiza bloco existente.

**Request:**
```json
{
  "nome": "Torre C - Reformada"
}
```

**Response (200):**
```json
{
  "message": "Bloco atualizado com sucesso"
}
```

#### DELETE `/blocos/:id`
Remove bloco (apenas se não tiver agrupadores).

**Response (200):**
```json
{
  "message": "Bloco removido com sucesso"
}
```

**Response - Erro (400):**
```json
{
  "error": "Não é possível excluir bloco com agrupadores associados"
}
```

#### GET `/agrupadores`
Lista agrupadores com informações do bloco.

**Response (200):**
```json
[
  {
    "id": 1,
    "nome": "1º Andar",
    "bloco_id": 1,
    "bloco_nome": "Torre A",
    "created_at": "2025-01-10T00:00:00Z"
  }
]
```

#### POST `/agrupadores`
Cria novo agrupador.

**Request:**
```json
{
  "nome": "2º Andar",
  "bloco_id": 1
}
```

**Response (201):**
```json
{
  "message": "Agrupador criado com sucesso",
  "agrupador": {
    "id": 2,
    "nome": "2º Andar",
    "bloco_id": 1
  }
}
```

#### GET `/unidades`
Lista todas as unidades.

**Response (200):**
```json
[
  {
    "id": 1,
    "nome": "101",
    "created_at": "2025-01-10T00:00:00Z"
  },
  {
    "id": 2,
    "nome": "102",
    "created_at": "2025-01-10T00:00:00Z"
  }
]
```

#### POST `/unidades`
Cria nova unidade.

**Request:**
```json
{
  "nome": "203"
}
```

**Response (201):**
```json
{
  "message": "Unidade criada com sucesso",
  "unidade": {
    "id": 5,
    "nome": "203"
  }
}
```

#### GET `/grupos`
Lista grupos com detalhes completos.

**Response (200):**
```json
[
  {
    "id": 1,
    "bloco_id": 1,
    "bloco_nome": "Torre A",
    "agrupador_id": 1,
    "agrupador_nome": "1º Andar",
    "unidade_ids": [1, 2, 3],
    "unidades": ["101", "102", "103"],
    "created_at": "2025-01-10T00:00:00Z"
  }
]
```

#### POST `/grupos`
Cria novo grupo.

**Request:**
```json
{
  "bloco_id": 1,
  "agrupador_id": 1,
  "unidade_ids": [1, 2, 3, 4]
}
```

**Response (201):**
```json
{
  "message": "Grupo criado com sucesso",
  "grupo": {
    "id": 2,
    "bloco_id": 1,
    "agrupador_id": 1,
    "unidade_ids": [1, 2, 3, 4]
  }
}
```

---

### 3.5 MENSAGENS RÁPIDAS

#### GET `/tipos-msg-rapidas`
Lista tipos de mensagens rápidas.

**Response (200):**
```json
[
  {
    "id": 1,
    "nome": "Manutenção",
    "created_at": "2025-01-10T00:00:00Z"
  },
  {
    "id": 2,
    "nome": "Avisos Gerais",
    "created_at": "2025-01-10T00:00:00Z"
  }
]
```

#### POST `/tipos-msg-rapidas`
Cria novo tipo de mensagem rápida.

**Request:**
```json
{
  "nome": "Segurança"
}
```

**Response (201):**
```json
{
  "message": "Tipo criado com sucesso",
  "tipo": {
    "id": 3,
    "nome": "Segurança"
  }
}
```

#### GET `/msg-rapidas`
Lista mensagens rápidas com tipos.

**Response (200):**
```json
[
  {
    "id": 1,
    "tipo_id": 1,
    "tipo_nome": "Manutenção",
    "texto": "Manutenção no elevador hoje das 8h às 12h. Pedimos desculpas pelo transtorno.",
    "created_at": "2025-01-10T00:00:00Z"
  }
]
```

#### GET `/msg-rapidas/:tipo_id`
Lista mensagens rápidas de um tipo específico.

**Response (200):**
```json
[
  {
    "id": 1,
    "texto": "Manutenção no elevador hoje das 8h às 12h. Pedimos desculpas pelo transtorno."
  },
  {
    "id": 2,
    "texto": "Interrupção de água amanhã das 14h às 16h para reparo na caixa d'água."
  }
]
```

#### POST `/msg-rapidas`
Cria nova mensagem rápida.

**Request:**
```json
{
  "tipo_id": 1,
  "texto": "Manutenção preventiva na bomba d'água dia 20/01 das 9h às 11h."
}
```

**Response (201):**
```json
{
  "message": "Mensagem rápida criada com sucesso",
  "mensagem": {
    "id": 10,
    "tipo_id": 1,
    "texto": "Manutenção preventiva na bomba d'água dia 20/01 das 9h às 11h."
  }
}
```

---

### 3.6 MENSAGENS DO SISTEMA

#### GET `/messages`
Lista mensagens vigentes para o usuário logado.

**Response (200):**
```json
[
  {
    "id": 1,
    "tipo": "convencional",
    "sender": "Carlos Santos",
    "assunto": "Reunião de Condomínio",
    "content": "Reunião extraordinária dia 25/01 às 19h no salão de festas para discutir obras.",
    "destinatario_tipo": "grupo",
    "destinatario_id": 1,
    "inicio_vigencia": "2025-01-15T00:00:00Z",
    "fim_vigencia": "2025-01-25T23:59:59Z",
    "created_at": "2025-01-15T10:00:00Z"
  },
  {
    "id": 2,
    "tipo": "rapida",
    "sender": "João Porteiro",
    "content": "Manutenção no elevador hoje das 8h às 12h. Pedimos desculpas pelo transtorno.",
    "destinatario_tipo": "sindico-role",
    "destinatario_id": 0,
    "inicio_vigencia": "2025-01-16T08:00:00Z",
    "fim_vigencia": "2025-01-16T12:00:00Z",
    "created_at": "2025-01-16T07:30:00Z"
  }
]
```

#### POST `/send-message`
Envia nova mensagem.

**Request - Mensagem Convencional:**
```json
{
  "tipo": "convencional",
  "assunto": "Aviso sobre obras",
  "content": "Informamos que as obras no playground iniciarão dia 20/01.",
  "destinatario_tipo": "unidade",
  "destinatario_id": 5,
  "inicio_vigencia": "2025-01-18T00:00:00Z",
  "fim_vigencia": "2025-01-20T23:59:59Z"
}
```

**Request - Mensagem Rápida:**
```json
{
  "tipo": "rapida",
  "tipo_msg_rapida_id": 1,
  "msg_rapida_id": 3,
  "destinatario_tipo": "grupo",
  "destinatario_id": 2,
  "inicio_vigencia": "2025-01-18T09:00:00Z",
  "fim_vigencia": "2025-01-18T11:00:00Z"
}
```

**Response (201):**
```json
{
  "message": "Mensagem enviada com sucesso",
  "notificacoes_enviadas": 15
}
```

#### POST `/cleanup-expired-messages`
Remove mensagens expiradas (executado automaticamente).

**Response (200):**
```json
{
  "message": "Limpeza concluída",
  "removidas": 8
}
```

---

### 3.7 NOTIFICAÇÕES PUSH

#### POST `/subscribe-push`
Registra subscrição para notificações push.

**Request:**
```json
{
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/fcm/send/...",
    "keys": {
      "p256dh": "chave-p256dh...",
      "auth": "chave-auth..."
    }
  }
}
```

**Response (200):**
```json
{
  "message": "Subscrição registrada com sucesso"
}
```

#### GET `/vapid-public-key`
Retorna chave pública VAPID para configuração do Service Worker.

**Response (200):**
```json
{
  "publicKey": "BNrm3h7w8X2Y9Z..."
}
```

---

### 3.8 INFORMAÇÕES DO SISTEMA

#### GET `/api/version`
Retorna versão atual do sistema.

**Response (200):**
```json
{
  "version": "v1751336169710",
  "date": "30/06/2025, 23:16",
  "description": "Sistema CondoApp - Comunicação de Condomínio"
}
```

#### GET `/user-session`
Retorna informações da sessão atual.

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "username": "joao.silva",
    "name": "João Silva",
    "email": "joao@email.com",
    "role": "morador",
    "bloco": "Torre A",
    "unidade": "203",
    "unread_count": 3
  }
}
```

#### POST `/reset-unread-count`
Zera contador de mensagens não lidas.

**Response (200):**
```json
{
  "message": "Contador zerado com sucesso"
}
```

---

## 4. Códigos de Status HTTP

### 4.1 Códigos de Sucesso
- **200 OK**: Requisição processada com sucesso
- **201 Created**: Recurso criado com sucesso

### 4.2 Códigos de Erro do Cliente
- **400 Bad Request**: Dados inválidos ou malformados
- **401 Unauthorized**: Não autenticado
- **403 Forbidden**: Não autorizado para a ação
- **404 Not Found**: Recurso não encontrado
- **409 Conflict**: Conflito (ex: username já existe)

### 4.3 Códigos de Erro do Servidor
- **500 Internal Server Error**: Erro interno do servidor
- **503 Service Unavailable**: Serviço temporariamente indisponível

## 5. Estruturas de Dados

### 5.1 User Object
```json
{
  "id": 1,
  "username": "joao.silva",
  "name": "João Silva",
  "email": "joao@email.com",
  "telefone": "(11) 98765-4321",
  "bloco": "Torre A",
  "unidade": "203",
  "role": "morador|sindico|mensageiro|admin-app",
  "aprovado": true,
  "primeiro_acesso": false,
  "unread_count": 0,
  "created_at": "2025-01-10T00:00:00Z"
}
```

### 5.2 Message Object
```json
{
  "id": 1,
  "tipo": "convencional|rapida",
  "sender": "Nome do Remetente",
  "assunto": "Assunto da Mensagem",
  "content": "Conteúdo da mensagem...",
  "destinatario_tipo": "unidade|grupo|sindico-role",
  "destinatario_id": 1,
  "inicio_vigencia": "2025-01-15T00:00:00Z",
  "fim_vigencia": "2025-01-25T23:59:59Z",
  "tipo_msg_rapida_id": 1,
  "msg_rapida_id": 3,
  "created_at": "2025-01-15T10:00:00Z"
}
```

### 5.3 Push Subscription Object
```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "keys": {
    "p256dh": "chave-p256dh-base64...",
    "auth": "chave-auth-base64..."
  }
}
```

## 6. Middleware e Validações

### 6.1 Autenticação Required
Rotas que exigem login:
- Todas exceto: `/`, `/login.html`, `/auth/login`, `/cadastro-sindico`, `/auth/esqueci-senha`, etc.

### 6.2 Role-based Authorization
- **admin-app**: Acesso total, aprovação de síndicos
- **sindico**: Gestão completa, cadastro de usuários
- **morador**: Visualização e resposta para síndicos
- **mensageiro**: Envio de mensagens operacionais

### 6.3 Validações Automáticas
- **Email**: Formato válido obrigatório
- **Vigência**: Fim deve ser posterior ao início
- **Unicidade**: Username e email únicos
- **Sanitização**: Inputs limpos de caracteres perigosos

## 7. Rate Limiting e Segurança

### 7.1 Limites Implementados
- **Login**: 5 tentativas por minuto por IP
- **Envio de email**: 3 por minuto por usuário
- **Criação de recursos**: 10 por minuto por usuário

### 7.2 Segurança
- **BCrypt**: Hash de senhas com salt
- **Sanitização**: Todos os inputs validados
- **SQL Injection**: Queries parametrizadas
- **XSS**: Headers de segurança configurados

---

**Data:** Janeiro 2025  
**Versão:** 1.0  
**Autor:** Documentação CondoApp  
**Ambiente:** Node.js + Express + PostgreSQL
