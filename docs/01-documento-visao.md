
# 📋 Documento de Visão - CondoApp

## 1. Introdução

### 1.1 Propósito
O CondoApp é uma solução de comunicação digital para condomínios que permite a gestão eficiente de mensagens entre administradores, síndicos, moradores e mensageiros, oferecendo controle granular de destinatários e vigência temporal das comunicações.

### 1.2 Escopo
Sistema web responsivo (PWA) para comunicação interna de condomínios com:
- Gestão hierárquica de usuários por perfil
- Sistema de mensagens com controle de vigência
- Notificações push em tempo real
- Interface administrativa completa
- Estrutura organizacional flexível (blocos, agrupadores, grupos, unidades)

### 1.3 Definições e Acrônimos
- **PWA**: Progressive Web App
- **VAPID**: Voluntary Application Server Identification
- **BCrypt**: Biblioteca de criptografia de senhas
- **Service Worker**: Script que executa em background no navegador

## 2. Posicionamento

### 2.1 Declaração do Problema
| Item | Descrição |
|------|-----------|
| **O problema** | Comunicação ineficiente e dispersa em condomínios |
| **Afeta** | Administradores, síndicos, moradores e funcionários |
| **Cujo impacto é** | Informações perdidas, retrabalho, falta de controle |
| **Uma solução seria** | Sistema centralizado de comunicação com controle de acesso |

### 2.2 Declaração de Posição do Produto
Para condomínios que precisam de comunicação eficiente, o CondoApp é um sistema web que oferece controle completo de mensagens por perfil de usuário, diferente de soluções genéricas, nosso produto oferece estrutura organizacional específica para condomínios e controle temporal de mensagens.

## 3. Descrições dos Stakeholders

### 3.1 Resumo dos Stakeholders
| Nome | Descrição | Responsabilidades |
|------|-----------|-------------------|
| **Admin-App** | Administrador técnico do sistema | Configuração geral, aprovação de síndicos |
| **Síndico** | Administrador do condomínio | Gestão de mensagens, cadastro de usuários |
| **Morador** | Residente do condomínio | Recepção e leitura de mensagens |
| **Mensageiro** | Funcionário responsável por comunicados | Envio de mensagens específicas |

### 3.2 Ambiente do Usuário
- **Plataforma**: Web (desktop e mobile)
- **Navegadores**: Chrome, Firefox, Safari, Edge
- **Dispositivos**: Smartphones, tablets, computadores
- **Conexão**: Internet banda larga ou móvel

## 4. Visão Geral do Produto

### 4.1 Perspectiva do Produto
Sistema standalone web-based com arquitetura cliente-servidor, utilizando:
- **Frontend**: HTML5, CSS3, JavaScript ES6+, Bootstrap 5.3
- **Backend**: Node.js, Express.js
- **Banco de Dados**: PostgreSQL
- **Notificações**: Web Push API com VAPID

### 4.2 Resumo das Capacidades
| Capacidade | Benefício |
|------------|-----------|
| **Gestão por Perfis** | Controle de acesso baseado em função |
| **Vigência Temporal** | Mensagens com data/hora de validade |
| **Notificações Push** | Comunicação instantânea |
| **Estrutura Hierárquica** | Organização flexível de destinatários |
| **Mensagens Rápidas** | Templates para comunicados frequentes |
| **PWA** | Experiência nativa em dispositivos móveis |

## 5. Recursos do Produto

### 5.1 Autenticação e Autorização
- Login seguro com BCrypt
- Recuperação de senha via email
- Aprovação de síndicos pelo admin
- Controle de primeiro acesso

### 5.2 Gestão Organizacional
- **Blocos**: Divisões físicas do condomínio
- **Agrupadores**: Subdivisões dos blocos
- **Grupos**: Combinações de bloco + agrupador + unidades
- **Unidades**: Apartamentos/casas individuais

### 5.3 Sistema de Mensagens
- **Mensagens Convencionais**: Texto livre com assunto
- **Mensagens Rápidas**: Templates pré-definidos
- **Vigência Temporal**: Controle de início e fim
- **Segmentação**: Envio para unidades, grupos ou síndicos

### 5.4 Notificações
- **Push Notifications**: Via Service Worker
- **Badge Count**: Contador de mensagens não lidas
- **Segmentação**: Notificações direcionadas por perfil

## 6. Restrições

### 6.1 Restrições Técnicas
- Dependência de conexão com internet
- Limitação de navegadores que suportam Service Workers
- Tamanho máximo de 8GB para deployment no Replit

### 6.2 Restrições de Negócio
- Um único admin-app por sistema
- Síndicos precisam de aprovação
- Mensagens possuem vigência obrigatória

## 7. Qualidade

### 7.1 Requisitos de Performance
- Tempo de resposta < 3 segundos
- Suporte a 100+ usuários simultâneos
- Notificações push < 1 segundo

### 7.2 Requisitos de Segurança
- Senhas criptografadas com BCrypt
- Validação de entrada em todos os formulários
- Sessões com timeout automático

### 7.3 Requisitos de Usabilidade
- Interface responsiva para mobile
- Navegação intuitiva por perfil
- Feedback visual para todas as ações

## 8. Precedência e Prioridade
1. **Alta**: Autenticação, envio/recepção de mensagens
2. **Média**: Notificações push, gestão organizacional
3. **Baixa**: Relatórios, estatísticas avançadas

## 9. Outros Requisitos

### 9.1 Aplicabilidade
- Sistema específico para condomínios
- Flexível para diferentes tamanhos de empreendimentos

### 9.2 Instalação
- Deploy direto no Replit
- Configuração via variáveis de ambiente
- Banco PostgreSQL gerenciado

---

**Data:** Janeiro 2025  
**Versão:** 1.0  
**Autor:** Documentação CondoApp
