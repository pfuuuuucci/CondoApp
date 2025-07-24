
# 🏢 CondoApp - Sistema de Comunicação para Condomínios

![CondoApp](public/assets/logo-condoapp.png)

**CondoApp** é um sistema web completo de comunicação para condomínios, desenvolvido como Progressive Web App (PWA) com Node.js, Express.js, PostgreSQL e Bootstrap.

## 📋 Visão Geral

O CondoApp facilita a comunicação entre administradores, síndicos, moradores e mensageiros através de um sistema hierárquico organizado em blocos, agrupadores, grupos e unidades, com suporte a mensagens programadas, notificações push e gestão de usuários multi-perfil.

## 🚀 Características Principais

- ✅ **PWA (Progressive Web App)** - Instalável em dispositivos móveis
- ✅ **Notificações Push** - Sistema completo de notificações em tempo real
- ✅ **Multi-perfil** - Admin, Síndico, Morador, Mensageiro
- ✅ **Mensagens Programadas** - Com vigência temporal automática
- ✅ **Hierarquia Organizacional** - Blocos → Agrupadores → Grupos → Unidades
- ✅ **Interface Responsiva** - Bootstrap 5.3 para todos os dispositivos
- ✅ **Autenticação Segura** - BCrypt para senhas + tokens de validação
- ✅ **Email Integrado** - Sistema de notificações por email

## 📚 Documentação Completa

### 📖 **Documentos de Projeto**
- [📋 Documento de Visão](docs/01-documento-visao.md) - Objetivos, escopo e stakeholders
- [🏗️ Documento de Arquitetura](docs/02-documento-arquitetura.md) - Estrutura técnica e componentes
- [🗄️ Modelo de Dados](docs/03-modelo-dados.md) - ERD e estrutura do banco PostgreSQL
- [👤 Casos de Uso](docs/04-casos-uso.md) - Cenários por perfil de usuário

### 🛠️ **Documentos Técnicos**
- [⚙️ Manual de Instalação](docs/05-manual-instalacao.md) - Setup completo passo-a-passo
- [📱 Manual do Usuário](docs/06-manual-usuario.md) - Guias por perfil
- [🔌 API Documentation](docs/07-api-documentation.md) - Todas as rotas e endpoints
- [🔧 Guia de Manutenção](docs/08-guia-manutencao.md) - Logs, monitoramento e troubleshooting

## 🛠️ Stack Tecnológica

### **Backend**
- **Node.js** + **Express.js** - Servidor web
- **PostgreSQL** - Banco de dados relacional
- **BCrypt.js** - Criptografia de senhas
- **Nodemailer** - Envio de emails
- **Web-push** - Notificações push

### **Frontend**
- **HTML5** + **CSS3** + **JavaScript**
- **Bootstrap 5.3** - Framework CSS responsivo
- **Bootstrap Icons** - Biblioteca de ícones
- **Service Worker** - Funcionalidades PWA

## ⚡ Início Rápido

```bash
# Clone o repositório
git clone [seu-repositorio]

# Instale as dependências
npm install

# Configure as variáveis de ambiente (Secrets no Replit)
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=sua-senha-de-app
DATABASE_URL=sua-url-postgresql

# Execute o servidor
node index.js
```

**Acesse:** http://localhost:3000

## 🗂️ Estrutura do Projeto

```
CondoApp/
├── 📁 docs/              # Documentação completa
├── 📁 public/            # Frontend (HTML, CSS, JS)
├── 📁 routes/            # Rotas de autenticação
├── 📄 index.js           # Servidor principal Express
├── 📄 database.js        # Configuração PostgreSQL
├── 📄 email.js           # Sistema de emails
└── 📄 package.json       # Dependências Node.js
```

## 👥 Perfis de Usuário

| Perfil | Funcionalidades |
|--------|-----------------|
| **👑 Admin** | Gestão completa do sistema, usuários e estrutura organizacional |
| **🏛️ Síndico** | Gestão de seu condomínio, criação e envio de mensagens |
| **🏠 Morador** | Visualização de mensagens direcionadas à sua unidade |
| **📨 Mensageiro** | Envio de mensagens rápidas pré-cadastradas |

## 📊 Estatísticas do Projeto

- **🗃️ Tabelas:** 9 tabelas principais no PostgreSQL
- **🌐 Rotas API:** 45+ endpoints REST
- **📱 Telas:** 25 páginas HTML responsivas
- **👤 Perfis:** 4 tipos de usuário diferentes
- **📡 PWA:** Service Worker + Manifest completos

## 🤝 Contribuição

1. Consulte a [documentação técnica](docs/) completa
2. Siga os padrões de código existentes
3. Teste suas alterações localmente
4. Mantenha a documentação atualizada

## 📄 Licença

Este projeto está sob licença proprietária. Consulte o arquivo LICENSE para mais detalhes.

---

**Desenvolvido com ❤️ para facilitar a comunicação em condomínios**

🔗 **Links Úteis:**
- [Documento de Visão](docs/01-documento-visao.md)
- [Manual de Instalação](docs/05-manual-instalacao.md)  
- [Manual do Usuário](docs/06-manual-usuario.md)
- [API Documentation](docs/07-api-documentation.md)
