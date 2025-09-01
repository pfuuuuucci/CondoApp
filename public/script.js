// Verificação imediata de admin-app (antes de carregar DOM)
(function() {
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  // Se está no dashboard e é admin-app, redireciona imediatamente
  if (window.location.pathname.endsWith('dashboard.html') && user && user.role === 'admin-app') {
    console.log('⚡ Admin-app detectado, redirecionamento imediato');
    window.location.replace('aprovar-usuarios.html'); // replace evita histórico
    return;
  }
})();

// LOGIN
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;

      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (data.success) {
        localStorage.setItem('user', JSON.stringify(data.user));

        // Verifica se é primeiro acesso - redireciona para alterar senha
        if (data.primeiro_acesso) {
          if (data.user.role === 'sindico') {
            // Síndico: precisa validar token (pois se cadastrou sozinho)
            window.location.href = `validar-token.html?email=${encodeURIComponent(data.user.email)}&msg=2`;
          } else {
            // Morador/Mensageiro: vai direto para nova senha (cadastrado pelo síndico)
            console.log('🔍 Redirecionando para primeiro acesso direto');
            window.location.href = 'nova-senha.html?direct=true';
          }
          return;
        }

        if (data.user.role === 'admin-app') {
          // Admin-app: redireciona direto para tela de aprovação de síndicos
          window.location.href = 'aprovar-usuarios.html';
        } else {
          // Demais perfis (síndico, morador, mensageiro): vão para dashboard via loading
          window.location.href = 'loading.html';
        }

      } else {
        document.getElementById('msg').textContent = 'Usuário ou senha incorretos!';
      }
    });
  }
});

function logout() {
  localStorage.removeItem('user');
  window.location.href = "index.html";
}

function formatTarget(target) {
  if (!target) return '';
  if (target.type === 'all') return 'Todos os moradores';
  if (target.type === 'column') return `Colunas ${target.values.join(', ')}`;
  if (target.type === 'floor') return `Andares ${target.values.join(', ')}`;
  if (target.type === 'apartment') return `Apto ${target.values[0]}`;
  if (target.type === 'bloco') return `Bloco(s) ${target.values.join(', ')}`;
  if (target.type === 'agrupador') return `Agrupador(es) ${target.values.join(', ')}`;
  if (target.type === 'unidade') return `Unidade(s) ${target.values.join(', ')}`;
  return '';
}

function formatDateTimeUTCtoLocal(utcDateTime) {
  if (!utcDateTime) return 'N/A';
  const date = new Date(utcDateTime);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// DASHBOARD: Menu dinâmico, nome do usuário, refresh, boas-vindas e cache de mensagens
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.endsWith('dashboard.html')) {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      window.location.href = 'login.html';
      return;
    }

    // Exibe nome do usuário
    const userNameElem = document.getElementById('userName');
    if (userNameElem) userNameElem.textContent = user.name;

    // Controle do menu hambúrguer e ícones de mensagem por perfil
    const menuToggler = document.querySelector('.navbar-toggler');
    const messageIcons = document.getElementById('messageIcons');

    // Configurar biometria no dashboard
    const biometricConfigLink = document.getElementById('biometricConfigLink');
    if (biometricConfigLink) {
      biometricConfigLink.addEventListener('click', async (e) => {
        e.preventDefault();

        if (window.biometricAuth && window.biometricAuth.isSupported) {
          try {
            const success = await window.biometricAuth.showBiometricOptions(user.id, user.name);
            if (success) {
              console.log('✅ Configuração biométrica atualizada');
            }
          } catch (error) {
            console.error('❌ Erro na configuração biométrica:', error);
            alert('Erro: ' + error.message);
          }
        } else {
          alert('⚠️ Biometria não suportada neste dispositivo ou navegador');
        }
      });
    }

    // Verificar biometria após login (apenas uma vez por sessão)
    const biometricChecked = sessionStorage.getItem('biometric_checked');
    if (!biometricChecked && window.biometricAuth && window.biometricAuth.isSupported) {
      setTimeout(async () => {
        try {
          const status = await window.biometricAuth.checkBiometricStatus(user.id);

          // Oferecer configuração apenas se nunca foi configurado
          if (status === 'not_configured') {
            const offered = localStorage.getItem('biometric_offered');
            if (!offered) {
              const configured = await window.biometricAuth.showBiometricOptions(user.id, user.name);
              if (!configured) {
                localStorage.setItem('biometric_offered', 'true'); // Não oferecer novamente
              }
            }
          }
          // Para outros status, usuário pode acessar via menu

          sessionStorage.setItem('biometric_checked', 'true');
        } catch (error) {
          console.log('Biometria não disponível:', error.message);
        }
      }, 3000); // Aguardar 3 segundos após carregar dashboard
    }

    if (user.role === 'sindico') {
      // Síndico: acesso completo ao menu hambúrguer e ícones de mensagens
      if (menuToggler) menuToggler.style.setProperty('display', 'block', 'important');
      if (messageIcons) messageIcons.style.setProperty('display', 'flex', 'important');
    } else if (user.role === 'morador') {
      // Morador: sem acesso ao menu hambúrguer, mas com acesso aos ícones de mensagens (apenas convencional)
      if (menuToggler) menuToggler.style.setProperty('display', 'none', 'important');
      if (messageIcons) messageIcons.style.setProperty('display', 'flex', 'important');

      // Ocultar apenas o ícone de mensagem rápida para moradores
      const quickMessageIcon = document.querySelector('a[href="mensagens-texto.html"]');
      if (quickMessageIcon) quickMessageIcon.style.setProperty('display', 'none', 'important');
    } else if (user.role === 'mensageiro') {
      // Mensageiro: sem acesso ao menu hambúrguer, mas com acesso aos ícones de mensagens
      if (menuToggler) menuToggler.style.setProperty('display', 'none', 'important');
      if (messageIcons) messageIcons.style.setProperty('display', 'flex', 'important');
    } else if (user.role === 'admin-app') {
      // Admin-app: se chegou aqui, algo deu errado, mas já foi tratado no topo
      console.log('🔄 Admin-app - redirecionamento de segurança');
      window.location.replace('aprovar-usuarios.html');
      return;
    }

    // Tornar página visível após verificações
    document.body.classList.add('loaded');

    // --- FLUXO DE BOAS-VINDAS, REFRESH E CACHE ---
    // Sistema inteligente que detecta origem do acesso e exibe tela apropriada:
    // 1. Primeira entrada: mostra boas-vindas por 2s
    // 2. Via loading.html: vai direto para mensagens
    // 3. Volta de outra tela: restaura cache sem refresh
    // 4. Refresh normal: carrega mensagens diretamente
    const welcomeScreen = document.getElementById('welcomeScreen');
    const messagesListContainer = document.getElementById('messagesListContainer');
    const messagesList = document.getElementById('messagesList');



    if (!sessionStorage.getItem('dashboardVisited') && !sessionStorage.getItem('fromLoadingScreen')) {
      // PRIMEIRA ENTRADA NA SESSÃO: detecta dispositivo e mostra tela apropriada
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const screenToShow = isMobile ? welcomeScreen : welcomeScreen; // Sempre welcome na primeira vez

      if (screenToShow) screenToShow.style.display = 'flex';
      if (messagesListContainer) messagesListContainer.style.display = 'none';
      sessionStorage.setItem('dashboardVisited', '1');
      setTimeout(() => {
        if (screenToShow) screenToShow.style.display = 'none';
        if (messagesListContainer) messagesListContainer.style.display = 'block';

        // 🎯 ZERAR BADGE - PRIMEIRA ENTRADA (quando carrega mensagens)
        if (window.appBadgeManager) {
          window.appBadgeManager.sendZeroBadgeToServiceWorker();
        }

        loadMessages();
      }, 2000);
    } else if (sessionStorage.getItem('fromLoadingScreen')) {
      // VEIO DO LOADING.HTML: não mostra boas-vindas, vai direto para mensagens
      if (welcomeScreen) welcomeScreen.style.display = 'none';
      if (messagesListContainer) messagesListContainer.style.display = 'block';
      sessionStorage.setItem('dashboardVisited', '1');
      sessionStorage.removeItem('fromLoadingScreen'); // Remove a flag após usar

      // 🎯 ZERAR BADGE - ENTRADA VIA LOADING (quando carrega mensagens)
      if (window.appBadgeManager) {
        window.appBadgeManager.sendZeroBadgeToServiceWorker();
      }

      loadMessages();
    } else if (sessionStorage.getItem('fromBackButton')) {
      // VOLTANDO DE OUTRA TELA: não mostra boas-vindas, não faz refresh, restaura cache
      if (welcomeScreen) welcomeScreen.style.display = 'none';
      if (messagesListContainer) messagesListContainer.style.display = 'block';
      const cachedMessages = sessionStorage.getItem('cachedMessages');
      if (cachedMessages && messagesList) {
        messagesList.innerHTML = cachedMessages;
      } else {
        loadMessages();
      }
      sessionStorage.removeItem('fromBackButton');
    } else {
      // REFRESH NORMAL OU ACESSO DIRETO: mostra mensagens sem boas-vindas
      if (welcomeScreen) welcomeScreen.style.display = 'none';
      if (messagesListContainer) messagesListContainer.style.display = 'block';

      // 🎯 ZERAR BADGE FUCCI
      if (window.appBadgeManager) {
        window.appBadgeManager.sendZeroBadgeToServiceWorker();
      }
      // FIM ZERAR BADGE FUCCI

      loadMessages();
    }
    // --- FIM DO FLUXO ---

    // Botão de refresh
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
      refreshBtn.onclick = () => {
        // 🎯 ZERAR BADGE - BOTÃO REFRESH
        if (window.appBadgeManager) {
          window.appBadgeManager.sendZeroBadgeToServiceWorker();
        }

        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const screenToShow = isMobile ? document.getElementById('refreshMobileScreen') : document.getElementById('loadScreen');

        if (screenToShow) screenToShow.style.display = 'flex';
        document.getElementById('messagesListContainer').style.display = 'none';

        setTimeout(() => {
          if (screenToShow) screenToShow.style.display = 'none';
          document.getElementById('messagesListContainer').style.display = 'block';
          loadMessages();
        }, 2000);
      };
    }

    // Atualiza relógio local
    const localNowElem = document.getElementById('localNow');
    if (localNowElem) {
      setInterval(() => {
        localNowElem.textContent = new Date().toLocaleString();
      }, 1000);
    }
  }
});

// Função para carregar mensagens baseada no perfil do usuário
async function loadMessages() {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) {
    console.error('Usuário não encontrado no localStorage');
    return;
  }

  // Verificação de segurança: admin-app não deve acessar mensagens
  if (user.role === 'admin-app') {
    console.log('🚫 Admin-app tentou acessar mensagens, redirecionando...');
    window.location.href = 'aprovar-usuarios.html';
    return;
  }

  let messages = [];

  try {
    const response = await fetch(`/api/messages?userId=${user.id}&userRole=${user.role}&userBloco=${user.bloco || ''}&userUnidade=${user.unidade || ''}`);
    messages = await response.json();
  } catch (error) {
    console.error('❌ Erro ao buscar mensagens:', error);
    return;
  }

  const list = document.getElementById('messagesList');
  list.innerHTML = '';

  if (messages.length === 0) {
    list.innerHTML = '<div class="alert alert-info text-center">Nenhuma mensagem válida no momento.</div>';
  } else {
    messages.forEach(msg => {
      const deleteButton = (user.role === 'sindico' || user.role === 'mensageiro')
        ? `<button class="btn btn-sm btn-danger ms-2" onclick="deleteMessage(${msg.id})">Excluir</button>`
        : '';

      list.innerHTML += `
        <div class="list-group-item mb-2">
          <div class="d-flex justify-content-between align-items-start">
            <div class="flex-grow-1">
              <h6 class="mb-1">${msg.sender}</h6>
              ${msg.assunto ? `<h6 class="mb-1 text-primary">${msg.assunto}</h6>` : ''}
              <p class="mb-1">${msg.content}</p>
              <small class="text-muted">
                Vigência: ${formatDateTimeUTCtoLocal(msg.inicioVigencia)} até ${formatDateTimeUTCtoLocal(msg.fimVigencia)} |
                Destino: ${msg.destinatarioNome}
              </small>
            </div>
            <div class="flex-shrink-0">
              ${deleteButton}
            </div>
          </div>
        </div>
      `;
    });
  }

  // Salva mensagens no cache para restaurar ao voltar
  sessionStorage.setItem('cachedMessages', list.innerHTML);
}

// Função de confirmação personalizada com Sim/Não
function confirmarAcao(mensagem) {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.5); display: flex; align-items: center;
      justify-content: center; z-index: 9999;
    `;

    modal.innerHTML = `
      <div style="background: white; padding: 20px; border-radius: 8px; max-width: 400px; text-align: center;">
        <p style="margin-bottom: 20px; font-size: 16px;">${mensagem}</p>
        <button id="btnSim" style="background: #dc3545; color: white; border: none; padding: 8px 20px; margin: 0 5px; border-radius: 4px; cursor: pointer;">Sim</button>
        <button id="btnNao" style="background: #6c757d; color: white; border: none; padding: 8px 20px; margin: 0 5px; border-radius: 4px; cursor: pointer;">Não</button>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('btnSim').onclick = () => {
      document.body.removeChild(modal);
      resolve(true);
    };

    document.getElementById('btnNao').onclick = () => {
      document.body.removeChild(modal);
      resolve(false);
    };

    // Fechar com ESC
    modal.onclick = (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
        resolve(false);
      }
    };
  });
}

// Função para excluir mensagem (apenas síndico e mensageiro)
async function deleteMessage(id) {
  if (await confirmarAcao('Deseja realmente excluir esta mensagem?')) {
    try {
      const res = await fetch(`/api/messages/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (data.success) {
        loadMessages(); // Recarrega a lista
      } else {
        alert('Erro ao excluir mensagem: ' + data.error);
      }
    } catch (error) {
      alert('Erro ao excluir mensagem');
    }
  }
}

/**
 * Gerenciador de Badge do Ícone do App (Sistema de Notificações Fase 4)
 * Controla o número exibido no ícone do app no sistema operacional
 * Funciona com Service Worker para sincronizar badge entre dispositivos
 */
class AppBadgeManager {
  constructor() {
    this.currentUser = null;
    this.badgeSupported = 'setAppBadge' in navigator;
    this.pollingInterval = null;

    // Configurar comunicação bidirecional com Service Worker
    this.setupServiceWorkerCommunication();
  }

  // Configurar comunicação com Service Worker
  setupServiceWorkerCommunication() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'GET_USER_ID') {
          let userId = null;
          let source = 'none';

          if (this.currentUser && this.currentUser.id) {
            userId = this.currentUser.id;
            source = 'instance';
          } else {
            try {
              const user = JSON.parse(localStorage.getItem('user'));
              if (user && user.id) {
                userId = user.id;
                source = 'localStorage';
              }
            } catch (error) {
              // Silencioso
            }
          }

          const response = {
            userId: userId,
            timestamp: Date.now(),
            source: source
          };

          if (event.ports && event.ports[0]) {
            try {
              event.ports[0].postMessage(response);
            } catch (error) {
              // Silencioso
            }
          }
        }
      });
    }
  }

  // Inicializar sistema para usuário
  init(user) {
    this.currentUser = user;

    if (!this.badgeSupported) {
      return false;
    }

    // Buscar contagem inicial
    this.updateBadge();

    // Atualizar periodicamente (a cada 30 segundos)
    this.startPolling();

    return true;
  }

  // Buscar contagem de mensagens não lidas
  async fetchUnreadCount() {
    try {
      const response = await fetch(`/api/unread-count?userId=${this.currentUser.id}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        return data.unreadCount;
      } else {
        return 0;
      }
    } catch (error) {
      return 0;
    }
  }

  // Atualizar badge no ícone do app
  async updateBadge() {
    if (!this.badgeSupported || !this.currentUser) {
      return;
    }

    try {
      const unreadCount = await this.fetchUnreadCount();

      if (unreadCount > 0) {
        // Mostrar número no ícone
        await navigator.setAppBadge(unreadCount);
      } else {
        // Remover badge
        await navigator.clearAppBadge();
      }
    } catch (error) {
      // Silencioso
    }
  }

  // Iniciar polling automático
  startPolling() {
    // Limpar polling existente
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    // Atualizar a cada 15 segundos (mais responsivo)
    this.pollingInterval = setInterval(() => {
      this.updateBadge();
    }, 15000);
  }

  // Parar polling
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  // Limpar badge manualmente
  async clearBadge() {
    if (this.badgeSupported) {
      try {
        await navigator.clearAppBadge();
      } catch (error) {
        // Silencioso
      }
    }
  }

  // Marcar mensagens como lidas (ETAPA 4)
  async markMessagesAsRead() {
    if (!this.currentUser) {
      return false;
    }

    try {
      const response = await fetch('/api/mark-messages-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.currentUser.id,
          userRole: this.currentUser.role,
          userBloco: this.currentUser.bloco || '',
          userUnidade: this.currentUser.unidade || ''
        })
      });

      const data = await response.json();

      if (data.success) {
        // Atualizar badge imediatamente após marcar
        await this.updateBadge();
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Função crítica para zerar badge e remover notificações do Android
   * Especialmente importante para dispositivos móveis que não limpam automaticamente
   * Garante que Service Worker esteja ativo antes de enviar comandos
   */
  async sendZeroBadgeToServiceWorker() {
    if (!this.badgeSupported) {
      return;
    }

    try {
      // Limpar badge diretamente
      await navigator.clearAppBadge();
      console.log('✅ Badge zerado na entrada da dashboard');

      // Garantir que Service Worker esteja ativo antes de enviar comandos
      if ('serviceWorker' in navigator) {
        let registration = await navigator.serviceWorker.getRegistration();

        // Se não há registration, esperar um pouco e tentar novamente
        if (!registration) {
          console.log('⏱️ Aguardando Service Worker...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          registration = await navigator.serviceWorker.getRegistration();
        }

        if (registration) {
          // Aguardar SW estar ativo
          let serviceWorker = registration.active;

          if (!serviceWorker) {
            console.log('⏱️ Service Worker não ativo, aguardando...');
            await new Promise(resolve => setTimeout(resolve, 1500));
            serviceWorker = registration.active;
          }

          if (serviceWorker) {
            // Comando 1: Limpar badge
            serviceWorker.postMessage({
              type: 'CLEAR_BADGE',
              userId: this.currentUser?.id
            });

            // Comando 2: Remover TODAS as notificações do painel Android
            serviceWorker.postMessage({
              type: 'DISMISS_ALL_NOTIFICATIONS'
            });

            console.log('✅ Comandos enviados para Service Worker: badge + notificações');

            // Retry automático após 2 segundos (garantia extra para Android)
            setTimeout(() => {
              if (serviceWorker) {
                serviceWorker.postMessage({
                  type: 'DISMISS_ALL_NOTIFICATIONS'
                });
                console.log('🔄 Retry: Comando adicional para remover notificações Android');
              }
            }, 2000);

          } else {
            console.log('⚠️ Service Worker não está ativo');
          }
        } else {
          console.log('⚠️ Service Worker não registrado');
        }
      }

    } catch (error) {
      console.log('⚠️ Erro ao zerar badge:', error);
    }
  }


}

// Instância global
window.appBadgeManager = new AppBadgeManager();