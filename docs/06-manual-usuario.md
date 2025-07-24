
# 👥 Manual do Usuário - CondoApp

## 1. Introdução

### 1.1 Sobre o CondoApp
O CondoApp é uma plataforma de comunicação digital desenvolvida especificamente para condomínios, oferecendo um sistema organizado para envio e recebimento de mensagens entre administradores, síndicos, moradores e funcionários.

### 1.2 Acesso ao Sistema
- **URL**: Fornecida pela administração do seu condomínio
- **Compatibilidade**: Funciona em smartphones, tablets e computadores
- **Navegadores**: Chrome, Firefox, Safari, Edge

### 1.3 Instalação como PWA (App)
1. **No celular**: Abra no navegador e clique em "Adicionar à tela inicial"
2. **No computador**: Clique no ícone de instalação na barra de endereços
3. **Benefícios**: Notificações push, ícone na tela inicial, funcionamento offline

## 2. Primeiros Passos

### 2.1 Login Inicial
1. Acesse a URL do CondoApp
2. Clique em "Entrar"
3. Digite seu **usuário** e **senha**
4. No primeiro acesso, você será direcionado para alterar sua senha

### 2.2 Esqueci Minha Senha
1. Na tela de login, clique em **"Esqueci minha senha"**
2. Digite seu **email cadastrado**
3. Clique em **"Enviar Token"**
4. Verifique sua caixa de entrada (e spam)
5. Anote o **código de 6 dígitos** recebido
6. Clique em **"Validar Token"**
7. Digite seu **email** e o **código recebido**
8. Após validação, digite sua **nova senha**

### 2.3 Notificações Push
**Para receber notificações instantâneas:**
1. Quando solicitado pelo navegador, clique em **"Permitir"**
2. As notificações aparecerão mesmo com o app fechado
3. O ícone do app mostrará um número com mensagens não lidas

## 3. Manual por Perfil de Usuário

---

## 🔧 ADMINISTRADOR DO SISTEMA (Admin-App)

### 3.1 Responsabilidades
- Aprovar cadastros de síndicos
- Configurar sistema
- Gerenciar configurações globais
- Supervisionar funcionamento geral

### 3.2 Aprovar Novos Síndicos

**Passo a passo:**
1. No menu lateral, clique em **"Aprovar Usuários"**
2. Visualize a lista de síndicos pendentes
3. Para cada candidato, veja:
   - Nome completo
   - Email
   - Bloco e unidade
   - Data de cadastro
4. Clique em **"Aprovar"** para liberar acesso
5. O síndico receberá email de confirmação automaticamente

**Dicas importantes:**
- Sempre verifique os dados antes de aprovar
- Síndicos aprovados terão acesso total de gestão
- Em caso de dúvida, entre em contato com o candidato

### 3.3 Visualizar Mensagens
- O admin visualiza **todas as mensagens** do sistema
- Acesso completo para supervisão
- Dashboard com visão geral de atividades

---

## 👨‍💼 SÍNDICO (Administrador do Condomínio)

### 4.1 Responsabilidades
- Enviar mensagens para moradores
- Cadastrar usuários (moradores e funcionários)
- Gerenciar estrutura organizacional
- Configurar mensagens rápidas

### 4.2 Cadastro Inicial (Para novos síndicos)

**Como se cadastrar:**
1. Acesse a página de cadastro de síndico
2. Preencha todos os campos:
   - **Login**: Escolha um nome de usuário único
   - **Nome Completo**: Seu nome real
   - **Email**: Email válido para contato
   - **Celular**: Seu telefone no formato (XX) 99999-9999
   - **Bloco**: Selecione seu bloco
   - **Unidade**: Informe sua unidade
3. Clique em **"Cadastrar"**
4. Aguarde aprovação do administrador
5. Quando aprovado, você receberá um email com instruções

### 4.3 Enviar Mensagens

#### 4.3.1 Mensagem Convencional
**Quando usar:** Para comunicados detalhados, avisos específicos

**Passo a passo:**
1. Menu **"Enviar Mensagem"** → **"Convencional"**
2. Preencha:
   - **Assunto**: Título claro da mensagem
   - **Conteúdo**: Texto completo da mensagem
3. **Selecionar Destinatários:**
   - **Unidade específica**: Para um apartamento/casa
   - **Grupo**: Para um conjunto (bloco + andar + apartamentos)
   - **Todos os síndicos**: Para comunicação entre síndicos
4. **Definir Vigência:**
   - **Data/hora início**: Quando a mensagem ficará visível
   - **Data/hora fim**: Quando a mensagem expirará automaticamente
5. Clique em **"Enviar"**

#### 4.3.2 Mensagem Rápida
**Quando usar:** Para avisos padronizados, comunicados frequentes

**Passo a passo:**
1. Menu **"Enviar Mensagem"** → **"Rápida"**
2. **Selecionar Categoria:** Escolha o tipo (ex: Manutenção, Aviso, etc.)
3. **Selecionar Template:** Escolha a mensagem pré-definida
4. **Selecionar Destinatários:** Igual às mensagens convencionais
5. **Definir Vigência:** Data/hora de validade
6. Clique em **"Enviar"**

### 4.4 Gerenciar Estrutura Organizacional

#### 4.4.1 Blocos
**Função:** Divisões principais do condomínio (Bloco A, Bloco B, etc.)

1. Menu **"Gerenciar"** → **"Blocos"**
2. **Criar novo:**
   - Clique em **"Novo Bloco"**
   - Digite o nome (ex: "Bloco A", "Torre Norte")
   - Clique em **"Salvar"**
3. **Editar:** Clique no nome do bloco existente
4. **Excluir:** Só é possível se não houver agrupadores vinculados

#### 4.4.2 Agrupadores
**Função:** Subdivisões dos blocos (Andares, Alas, etc.)

1. Menu **"Gerenciar"** → **"Agrupadores"**
2. **Criar novo:**
   - Clique em **"Novo Agrupador"**
   - Selecione o **Bloco**
   - Digite o nome (ex: "1º Andar", "Ala Norte")
   - Clique em **"Salvar"**

#### 4.4.3 Unidades
**Função:** Apartamentos/casas individuais

1. Menu **"Gerenciar"** → **"Unidades"**
2. **Criar nova:**
   - Clique em **"Nova Unidade"**
   - Digite o identificador (ex: "101", "Casa 1", "Apto 203")
   - Clique em **"Salvar"**

#### 4.4.4 Grupos
**Função:** Combinações para facilitar envio de mensagens

1. Menu **"Gerenciar"** → **"Grupos"**
2. **Criar novo:**
   - Selecione **Bloco**
   - Selecione **Agrupador**
   - Marque as **Unidades** que farão parte
   - Clique em **"Salvar"**

**Exemplo prático:**
- Bloco: "Torre A"
- Agrupador: "5º Andar"  
- Unidades: 501, 502, 503, 504
- Resultado: Grupo "Torre A - 5º Andar" para comunicados específicos

### 4.5 Cadastrar Usuários

#### 4.5.1 Cadastrar Moradores
1. Menu **"Gerenciar"** → **"Cadastrar Usuários"**
2. Preencha os dados:
   - Nome completo
   - Email válido
   - Telefone
   - Bloco e unidade
   - **Tipo:** Selecione "Morador"
   - **Senha inicial:** Digite uma senha temporária
3. Clique em **"Cadastrar"**
4. O morador receberá email com as credenciais
5. No primeiro acesso, ele deve alterar a senha

#### 4.5.2 Cadastrar Funcionários/Mensageiros
- Mesmo processo dos moradores
- **Tipo:** Selecione "Mensageiro"
- Funcionários podem enviar mensagens como síndicos

### 4.6 Gerenciar Mensagens Rápidas

#### 4.6.1 Tipos de Mensagem Rápida
**Função:** Categorias para organizar templates

1. Menu **"Gerenciar"** → **"Tipos Msg Rápida"**
2. **Criar categoria:**
   - Clique em **"Novo Tipo"**
   - Digite o nome (ex: "Manutenção", "Avisos Gerais", "Segurança")
   - Clique em **"Salvar"**

#### 4.6.2 Mensagens Rápidas (Templates)
**Função:** Textos pré-definidos para agilizar comunicação

1. Menu **"Gerenciar"** → **"Mensagens Rápidas"**
2. **Criar template:**
   - Selecione a **Categoria**
   - Digite o **Texto** da mensagem
   - Clique em **"Salvar"**

**Exemplos de templates úteis:**

**Categoria: Manutenção**
- "Manutenção no elevador hoje das 8h às 12h. Pedimos desculpas pelo transtorno."
- "Interrupção de água amanhã das 14h às 16h para reparo na caixa d'água."

**Categoria: Avisos Gerais**
- "Reunião de condomínio dia 15 às 19h no salão de festas."
- "Lembrete: Taxa condominial vence dia 10. Evite multa!"

---

## 🏠 MORADOR (Residente)

### 5.1 Responsabilidades
- Visualizar mensagens destinadas a sua unidade
- Responder para síndicos quando necessário
- Manter dados atualizados

### 5.2 Visualizar Mensagens

**Dashboard principal:**
1. Ao fazer login, você verá todas as mensagens vigentes
2. **Tipos de mensagens que você recebe:**
   - Mensagens direcionadas à sua unidade específica
   - Mensagens para grupos que incluem sua unidade
   - Comunicados gerais para todos os moradores
   - Mensagens enviadas para síndicos (visibilidade ampla)

**Como funcionam as mensagens:**
- **Vigência:** Apenas mensagens dentro do período aparecem
- **Limpeza automática:** Mensagens expiradas são removidas
- **Badge:** O número no ícone do app mostra mensagens não lidas
- **Zerar badge:** Acesse o dashboard para marcar como lidas

### 5.3 Responder para Síndicos

**Quando usar:** Para esclarecimentos, solicitações, reclamações

**Passo a passo:**
1. No dashboard, clique em **"Enviar Mensagem"**
2. Preencha:
   - **Assunto:** Motivo do contato
   - **Conteúdo:** Sua mensagem detalhada
3. **Destinatário:** Automaticamente configurado para "Todos os Síndicos"
4. **Vigência:** Defina por quanto tempo sua mensagem ficará visível
5. Clique em **"Enviar"**

**Dicas:**
- Seja claro e objetivo
- Inclua dados relevantes (unidade, data do problema, etc.)
- Use assunto descritivo
- Todos os síndicos receberão sua mensagem

---

## 📨 MENSAGEIRO/FUNCIONÁRIO

### 6.1 Responsabilidades
- Enviar comunicados operacionais
- Informar sobre manutenções e serviços
- Coordenar com síndicos para avisos urgentes

### 6.2 Enviar Mensagens

**Funcionalidades disponíveis:**
- **Mensagens convencionais:** Para avisos detalhados
- **Mensagens rápidas:** Para comunicados padronizados
- **Destinatários:** Todas as opções disponíveis (unidades, grupos, síndicos)

**Processo:** Igual ao do síndico (ver seção 4.3)

**Tipos comuns de mensagens:**
- Avisos de manutenção
- Interrupções de serviços
- Comunicados de segurança
- Informações sobre reformas

---

## 4. Recursos Avançados

### 4.1 Notificações Push

**Como funcionam:**
- Chegam instantaneamente quando uma mensagem é enviada
- Aparecem mesmo com app fechado
- Mostram contador de mensagens não lidas
- Clicando na notificação, abre direto no dashboard

**Configurar:**
- Permita notificações quando solicitado
- Em configurações do celular, verifique se estão habilitadas
- Badge aparece no ícone do app

### 4.2 Funcionamento Offline

**O CondoApp funciona parcialmente offline:**
- **Visualização:** Mensagens já carregadas ficam disponíveis
- **Envio:** Requer conexão com internet
- **Sincronização:** Automática quando reconectar

### 4.3 Vigência das Mensagens

**Sistema automático:**
- Mensagens têm data/hora de início e fim
- Aparecem automaticamente no período definido
- Expiram e são removidas automaticamente
- Limpeza diária mantém o sistema organizado

### 4.4 Sistema de Badge

**Contador de mensagens não lidas:**
- Incrementa quando recebe nova mensagem
- Aparece no ícone do app e notificações
- Zera automaticamente ao acessar dashboard
- Máximo exibido: 99

## 5. Dicas e Boas Práticas

### 5.1 Para Síndicos

**Organização:**
- Configure todos os blocos, agrupadores e unidades antes de enviar mensagens
- Crie tipos e mensagens rápidas para comunicados frequentes
- Use grupos para facilitar envios direcionados

**Comunicação eficaz:**
- Seja claro e objetivo nas mensagens
- Defina vigência apropriada (não muito curta, não muito longa)
- Use assuntos descritivos
- Evite mensagens urgentes desnecessárias

**Gestão de usuários:**
- Cadastre moradores gradualmente
- Forneça instruções claras sobre primeiro acesso
- Mantenha dados atualizados

### 5.2 Para Moradores

**Primeiros passos:**
- Altere sua senha no primeiro acesso
- Ative notificações push
- Explore o dashboard para entender o funcionamento

**Uso eficiente:**
- Acesse regularmente para verificar mensagens
- Responda quando necessário
- Mantenha dados de contato atualizados

### 5.3 Para Todos

**Segurança:**
- Não compartilhe suas credenciais
- Use senhas fortes
- Altere senha periodicamente
- Informe problemas de acesso imediatamente

## 6. Solução de Problemas

### 6.1 Não Consigo Fazer Login
- Verifique usuário e senha
- Use "Esqueci minha senha" se necessário
- Verifique se sua conta foi aprovada (síndicos)
- Entre em contato com administração

### 6.2 Não Recebo Notificações
- Verifique permissões do navegador
- Confirme se PWA está instalado
- Verifique configurações do celular
- Reinstale o app se necessário

### 6.3 Mensagens Não Aparecem
- Verifique se estão dentro da vigência
- Confirme se são destinadas à sua unidade/grupo
- Recarregue a página
- Verifique conexão com internet

### 6.4 Erro ao Enviar Mensagem
- Verifique todos os campos obrigatórios
- Confirme vigência (fim deve ser após início)
- Verifique conexão
- Tente novamente em alguns minutos

## 7. Contatos e Suporte

### 7.1 Hierarquia de Suporte
1. **Dúvidas de uso:** Consulte este manual
2. **Problemas técnicos:** Entre em contato com síndico
3. **Questões administrativas:** Fale com administração
4. **Emergências:** Use canais tradicionais do condomínio

### 7.2 Informações Úteis
- **Versão do sistema:** Visível na página inicial
- **Última atualização:** Consulte histórico de versões
- **Compatibilidade:** Navegadores modernos com Service Workers

---

**Data:** Janeiro 2025  
**Versão:** 1.0  
**Autor:** Documentação CondoApp  
**Próxima revisão:** Conforme atualizações do sistema
