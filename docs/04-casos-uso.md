
# 🎭 Casos de Uso - CondoApp

## 1. Introdução

### 1.1 Propósito
Este documento detalha todos os casos de uso do CondoApp, descrevendo interações entre atores e sistema para cada funcionalidade.

### 1.2 Escopo
Abrange todos os perfis de usuário e suas respectivas funcionalidades, desde autenticação até gestão completa de mensagens.

### 1.3 Atores do Sistema
- **Admin-App**: Administrador técnico do sistema
- **Síndico**: Administrador do condomínio
- **Morador**: Residente do condomínio  
- **Mensageiro**: Funcionário responsável por comunicados

## 2. Diagrama Geral de Casos de Uso

```
                    CondoApp Sistema

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌─────────────┐                                           │
│  │ Fazer Login │◄─────────────┐                            │
│  └─────────────┘              │                            │
│                                │                            │
│  ┌─────────────┐              │ ALL USERS                  │
│  │Recuperar    │◄─────────────┤                            │
│  │Senha        │              │                            │
│  └─────────────┘              │                            │
│                                │                            │
│  ┌─────────────┐              │                            │
│  │Visualizar   │◄─────────────┤                            │
│  │Mensagens    │              │                            │
│  └─────────────┘              │                            │
│                                                             │
│  ┌─────────────┐     ┌─────────────┐                      │
│  │Aprovar      │◄────┤  Admin-App  │                      │
│  │Síndicos     │     └─────────────┘                      │
│  └─────────────┘                                           │
│                                                             │
│  ┌─────────────┐     ┌─────────────┐                      │
│  │Enviar       │◄────┤   Síndico   │                      │
│  │Mensagens    │     └─────────────┘                      │
│  └─────────────┘                                           │
│                                                             │
│  ┌─────────────┐                                           │
│  │Gerenciar    │◄─────────────┐                            │
│  │Estrutura    │              │                            │
│  └─────────────┘              │                            │
│                                │                            │
│  ┌─────────────┐              │ SÍNDICO                    │
│  │Cadastrar    │◄─────────────┤                            │
│  │Usuários     │              │                            │
│  └─────────────┘              │                            │
│                                │                            │
│  ┌─────────────┐              │                            │
│  │Gerenciar    │◄─────────────┘                            │
│  │Msg Rápidas  │                                           │
│  └─────────────┘                                           │
│                                                             │
│  ┌─────────────┐     ┌─────────────┐                      │
│  │Responder    │◄────┤   Morador   │                      │
│  │Síndico      │     └─────────────┘                      │
│  └─────────────┘                                           │
│                                                             │
│  ┌─────────────┐     ┌─────────────┐                      │
│  │Enviar       │◄────┤ Mensageiro  │                      │
│  │Comunicados  │     └─────────────┘                      │
│  └─────────────┘                                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 3. Casos de Uso por Ator

### 3.1 ADMIN-APP (Administrador do Sistema)

#### UC001 - Fazer Login como Admin
**Ator Primário:** Admin-App  
**Pré-condições:** Admin possui credenciais válidas  
**Pós-condições:** Admin autenticado com acesso total

**Fluxo Principal:**
1. Admin acessa página de login
2. Sistema exibe formulário de autenticação
3. Admin informa username e senha
4. Sistema valida credenciais
5. Sistema verifica se é único admin-app cadastrado
6. Sistema autentica e redireciona para dashboard
7. Sistema exibe menu administrativo completo

**Fluxos Alternativos:**
- **A1**: Múltiplos admins detectados
  - Sistema bloqueia acesso
  - Exibe mensagem de erro crítico
- **A2**: Credenciais inválidas
  - Sistema exibe erro
  - Retorna ao formulário

#### UC002 - Aprovar Cadastro de Síndicos
**Ator Primário:** Admin-App  
**Pré-condições:** Admin autenticado, síndicos pendentes existem  
**Pós-condições:** Síndicos aprovados podem acessar sistema

**Fluxo Principal:**
1. Admin acessa "Aprovar Usuários"
2. Sistema lista síndicos pendentes de aprovação
3. Admin visualiza dados do síndico (nome, email, bloco, unidade)
4. Admin confirma aprovação
5. Sistema marca síndico como aprovado
6. Sistema envia notificação de aprovação por email
7. Sistema atualiza lista de pendentes

**Fluxos Alternativos:**
- **A1**: Rejeitar síndico
  - Admin pode excluir cadastro
  - Sistema remove dados do candidato

#### UC003 - Gerenciar Configurações Globais
**Ator Primário:** Admin-App  
**Pré-condições:** Admin autenticado  
**Pós-condições:** Configurações aplicadas ao sistema

**Fluxo Principal:**
1. Admin acessa configurações do sistema
2. Sistema exibe painel de configurações
3. Admin modifica parâmetros necessários
4. Sistema valida configurações
5. Sistema aplica mudanças
6. Sistema confirma sucesso da operação

### 3.2 SÍNDICO (Administrador do Condomínio)

#### UC004 - Cadastrar-se como Síndico
**Ator Primário:** Síndico (candidato)  
**Pré-condições:** Nenhuma  
**Pós-condições:** Cadastro criado, aguardando aprovação

**Fluxo Principal:**
1. Usuário acessa "Cadastro de Síndico"
2. Sistema exibe formulário de cadastro
3. Usuário preenche: login, nome, email, celular, bloco, unidade
4. Sistema valida unicidade de login e email
5. Sistema gera token de recuperação
6. Sistema cria usuário com status "não aprovado"
7. Sistema envia token por email para usuário
8. Sistema envia notificação para admin sobre novo síndico
9. Sistema exibe confirmação de cadastro

**Fluxos Alternativos:**
- **A1**: Login já existe
  - Sistema exibe erro
  - Solicita novo login
- **A2**: Email já cadastrado
  - Sistema exibe erro
  - Solicita novo email

#### UC005 - Enviar Mensagem Convencional
**Ator Primário:** Síndico  
**Pré-condições:** Síndico autenticado e aprovado  
**Pós-condições:** Mensagem enviada para destinatários

**Fluxo Principal:**
1. Síndico acessa "Enviar Mensagem"
2. Sistema exibe formulário de mensagem convencional
3. Síndico seleciona tipo "Convencional"
4. Síndico preenche assunto e conteúdo
5. Síndico seleciona destinatário (unidade, grupo, ou síndicos)
6. Síndico define período de vigência
7. Sistema valida dados
8. Sistema salva mensagem
9. Sistema incrementa unread_count dos destinatários
10. Sistema envia notificações push segmentadas
11. Sistema confirma envio

**Fluxos Alternativos:**
- **A1**: Campos obrigatórios não preenchidos
  - Sistema destaca campos
  - Solicita preenchimento
- **A2**: Vigência inválida
  - Sistema valida datas
  - Solicita correção

#### UC006 - Enviar Mensagem Rápida
**Ator Primário:** Síndico  
**Pré-condições:** Síndico autenticado, mensagens rápidas cadastradas  
**Pós-condições:** Mensagem rápida enviada

**Fluxo Principal:**
1. Síndico acessa "Enviar Mensagem"
2. Sistema exibe formulário de mensagem rápida
3. Síndico seleciona tipo "Rápida"
4. Sistema carrega tipos de mensagem rápida
5. Síndico seleciona categoria
6. Sistema carrega mensagens da categoria
7. Síndico seleciona mensagem template
8. Síndico seleciona destinatário
9. Síndico define vigência
10. Sistema envia mensagem usando template
11. Sistema processa notificações
12. Sistema confirma envio

#### UC007 - Gerenciar Estrutura Organizacional
**Ator Primário:** Síndico  
**Pré-condições:** Síndico autenticado  
**Pós-condições:** Estrutura atualizada

**Fluxo Principal - Gerenciar Blocos:**
1. Síndico acessa "Gerenciar Blocos"
2. Sistema lista blocos existentes
3. Síndico seleciona ação (criar, editar, excluir)
4. Sistema exibe formulário apropriado
5. Síndico preenche/modifica dados
6. Sistema valida informações
7. Sistema atualiza banco de dados
8. Sistema atualiza lista

**Fluxos Similares:**
- Agrupadores (vinculados a blocos)
- Unidades (livres)
- Grupos (bloco + agrupador + unidades)

**Fluxos Alternativos:**
- **A1**: Tentativa de excluir item com dependências
  - Sistema exibe erro informativo
  - Lista dependências existentes

#### UC008 - Cadastrar Usuários Internos
**Ator Primário:** Síndico  
**Pré-condições:** Síndico autenticado  
**Pós-condições:** Usuário criado com acesso imediato

**Fluxo Principal:**
1. Síndico acessa "Cadastrar Usuários"
2. Sistema exibe formulário de cadastro
3. Síndico preenche dados completos
4. Síndico define tipo (morador ou mensageiro)
5. Síndico define senha inicial
6. Sistema valida unicidade
7. Sistema cria usuário com status aprovado
8. Sistema envia credenciais por email
9. Sistema adiciona à lista de usuários

#### UC009 - Gerenciar Mensagens Rápidas
**Ator Primário:** Síndico  
**Pré-condições:** Síndico autenticado  
**Pós-condições:** Templates atualizados

**Fluxo Principal - Tipos:**
1. Síndico acessa "Tipos de Mensagem Rápida"
2. Sistema lista categorias existentes
3. Síndico gerencia tipos (criar, editar, excluir)
4. Sistema valida operações
5. Sistema atualiza estrutura

**Fluxo Principal - Mensagens:**
1. Síndico acessa "Mensagens Rápidas"
2. Sistema lista templates por tipo
3. Síndico gerencia mensagens (criar, editar, excluir)
4. Sistema valida conteúdo
5. Sistema atualiza templates

### 3.3 MORADOR (Residente)

#### UC010 - Visualizar Mensagens Destinadas
**Ator Primário:** Morador  
**Pré-condições:** Morador autenticado  
**Pós-condições:** Mensagens visualizadas, badge zerado

**Fluxo Principal:**
1. Morador acessa dashboard
2. Sistema identifica unidade do morador
3. Sistema busca mensagens vigentes:
   - Mensagens para sua unidade específica
   - Mensagens para grupos que incluem sua unidade
   - Mensagens direcionadas a síndicos (visibilidade geral)
4. Sistema executa limpeza de mensagens expiradas
5. Sistema zera unread_count do morador
6. Sistema exibe mensagens ordenadas por data
7. Morador visualiza conteúdo das mensagens

**Fluxos Alternativos:**
- **A1**: Nenhuma mensagem vigente
  - Sistema exibe mensagem informativa

#### UC011 - Responder para Síndico
**Ator Primário:** Morador  
**Pré-condições:** Morador autenticado  
**Pós-condições:** Mensagem enviada para síndicos

**Fluxo Principal:**
1. Morador acessa "Enviar Mensagem"
2. Sistema exibe formulário simplificado
3. Morador preenche assunto e conteúdo
4. Sistema define destinatário como "sindico-role"
5. Morador define vigência
6. Sistema envia mensagem para todos os síndicos
7. Sistema processa notificações
8. Sistema confirma envio

### 3.4 MENSAGEIRO (Funcionário)

#### UC012 - Enviar Comunicados Operacionais
**Ator Primário:** Mensageiro  
**Pré-condições:** Mensageiro autenticado  
**Pós-condições:** Comunicado enviado

**Fluxo Principal:**
1. Mensageiro acessa sistema
2. Sistema exibe painel de mensageiro
3. Mensageiro seleciona tipo de mensagem (rápida ou convencional)
4. Mensageiro preenche formulário
5. Mensageiro seleciona destinatários
6. Sistema processa envio
7. Sistema confirma operação

**Características Específicas:**
- Acesso total como síndico para envio
- Foco em comunicados operacionais
- Sem permissões administrativas

## 4. Casos de Uso Transversais

### 4.1 TODOS OS USUÁRIOS

#### UC013 - Autenticar no Sistema
**Ator Primário:** Qualquer usuário  
**Pré-condições:** Usuário possui credenciais  
**Pós-condições:** Usuário autenticado

**Fluxo Principal:**
1. Usuário acessa página inicial
2. Sistema redireciona para login
3. Usuário informa credenciais
4. Sistema valida username e senha
5. Sistema verifica aprovação (para síndicos)
6. Sistema cria sessão
7. Sistema redireciona para dashboard apropriado

**Fluxos Alternativos:**
- **A1**: Primeiro acesso
  - Sistema redireciona para alteração de senha
- **A2**: Usuário não aprovado
  - Sistema exibe mensagem de pendência

#### UC014 - Recuperar Senha
**Ator Primário:** Qualquer usuário  
**Pré-condições:** Usuário possui email cadastrado  
**Pós-condições:** Nova senha definida

**Fluxo Principal:**
1. Usuário acessa "Esqueci minha senha"
2. Sistema solicita email
3. Usuário informa email
4. Sistema valida email cadastrado
5. Sistema gera token de 6 dígitos
6. Sistema envia token por email
7. Usuário acessa "Validar Token"
8. Usuário informa email e token
9. Sistema valida token e expiração
10. Sistema redireciona para "Nova Senha"
11. Usuário define nova senha
12. Sistema atualiza senha e remove token

**Fluxos Alternativos:**
- **A1**: Email não encontrado
  - Sistema exibe erro específico
- **A2**: Token expirado
  - Sistema oferece reenvio
- **A3**: Token inválido
  - Sistema solicita verificação

#### UC015 - Receber Notificações Push
**Ator Primário:** Usuário com PWA instalado  
**Pré-condições:** Service Worker registrado  
**Pós-condições:** Notificação exibida

**Fluxo Principal:**
1. Sistema envia mensagem para grupo de usuários
2. Sistema identifica subscrições push dos destinatários
3. Sistema monta payload da notificação
4. Sistema envia via Web Push API
5. Service Worker do usuário recebe notificação
6. Browser exibe notificação com badge count
7. Usuário clica na notificação
8. PWA abre na página de dashboard
9. Sistema atualiza badge conforme mensagens

## 5. Regras de Negócio

### 5.1 Autenticação
- **RN001**: Apenas um admin-app por sistema
- **RN002**: Síndicos precisam aprovação para acesso
- **RN003**: Tokens de recuperação expiram em 1 hora
- **RN004**: Senhas devem ser alteradas no primeiro acesso

### 5.2 Mensagens
- **RN005**: Toda mensagem deve ter vigência definida
- **RN006**: Mensagens expiram automaticamente
- **RN007**: Sistema executa limpeza diária automática
- **RN008**: Badge zera ao acessar dashboard

### 5.3 Estrutura Organizacional
- **RN009**: Blocos não podem ser excluídos se tiverem agrupadores
- **RN010**: Agrupadores não podem ser excluídos se tiverem grupos
- **RN011**: Unidades podem ser livres (sem vinculação obrigatória)
- **RN012**: Grupos devem ter pelo menos uma unidade

### 5.4 Notificações
- **RN013**: Notificações são segmentadas por destinatário
- **RN014**: Badge máximo é 99
- **RN015**: System de unread_count simples (sem rastreamento individual)

## 6. Requisitos Especiais

### 6.1 Performance
- Busca de mensagens deve executar em < 2 segundos
- Notificações push em < 1 segundo
- Limpeza automática não deve impactar performance

### 6.2 Usabilidade
- Interface responsiva obrigatória
- Feedback visual para todas as ações
- Navegação intuitiva por perfil

### 6.3 Segurança
- Validação de entrada em todos os formulários
- Criptografia BCrypt para senhas
- Timeouts automáticos de sessão

---

**Data:** Janeiro 2025  
**Versão:** 1.0  
**Autor:** Documentação CondoApp
