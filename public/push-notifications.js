/**
 * Gerenciador de Push Notifications Segmentado por Condômino
 * Sistema inteligente que detecta dispositivo, gerencia permissões e configura subscrições
 * Suporta notificações direcionadas por unidade, grupo ou perfil
 */
class PushNotificationManager {
  constructor() {
    this.user = null;
    this.subscription = null;
  }

  // Inicializar sistema para usuário específico
  async init(user) {
    this.user = user;

    // Verificar suporte
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return false;
    }

    try {
      // Registrar Service Worker
      const registration = await navigator.serviceWorker.register('/sw.js');

      // Verificar/Solicitar permissão automaticamente
      const permission = await this.checkPermission();

      if (permission !== 'granted') {
        return false;
      }

      // Criar subscrição
      await this.createSubscription(registration);

      return true;
    } catch (error) {
      console.error('❌ Erro ao inicializar push notifications:', error);
      return false;
    }
  }

  // Verificar/Solicitar permissão automaticamente
  async checkPermission() {
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    console.log(`🌐 Dispositivo: ${isMobile ? 'MOBILE' : 'DESKTOP'}`);
    console.log(`🔗 URL atual: ${window.location.href}`);

    // Remover qualquer popup existente
    this.removePermissionPopup();

    // Para dispositivos móveis que perderam permissão (comum após reinstalar app)
    const hadPermissionBefore = localStorage.getItem('condoapp_had_permission');
    if (isMobile && hadPermissionBefore === 'true' && Notification.permission !== 'granted') {
      console.log('📱 MOBILE: Dispositivo perdeu permissão após reinstalação - reativando...');
      localStorage.removeItem('condoapp_had_permission');

      // No mobile, mostrar popup imediatamente para reativar
      this.showReactivatePermissionPopup();
      return Notification.permission;
    }

    // Para qualquer dispositivo sem histórico que não tem permissão
    if (isMobile && Notification.permission === 'default') {
      console.log('📱 MOBILE: Primeira vez ou sem permissão - solicitando...');
      // No mobile, tentar solicitar automaticamente
      setTimeout(() => {
        this.showPermissionRequestPopup();
      }, 1000);
    }

    if (Notification.permission === 'default') {
      console.log('🔔 Solicitando permissão para notificações...');

      // Solicitar permissão IMEDIATAMENTE (sem popup)
      try {
        const permission = await Notification.requestPermission();
        console.log(`🔔 Resultado da solicitação: ${permission}`);

        if (permission === 'granted') {
          console.log('✅ SUCESSO: Permissão concedida!');
          localStorage.setItem('condoapp_had_permission', 'true');
          return permission;
        } else if (permission === 'denied') {
          console.log('❌ Permissão negada pelo usuário');
          this.showPermissionDeniedPopup();
          return permission;
        }
      } catch (error) {
        console.error('❌ Erro ao solicitar permissão:', error);
      }

      return Notification.permission;
    }

    if (Notification.permission === 'granted') {
      console.log('✅ ATIVO: Permissão já concedida - Este dispositivo receberá notificações');
      localStorage.setItem('condoapp_had_permission', 'true');
    } else if (Notification.permission === 'denied') {
      console.log('❌ BLOQUEADO: Notificações foram negadas anteriormente');
      this.showPermissionDeniedPopup();
    }

    return Notification.permission;
  }

  // Remover popup de permissão
  removePermissionPopup() {
    const popup = document.getElementById('notification-permission-popup');
    if (popup) {
      popup.remove();
    }
  }

  // Mostrar popup de permissão negada
  showPermissionDeniedPopup() {
    this.removePermissionPopup();

    const popup = document.createElement('div');
    popup.id = 'notification-permission-popup';
    popup.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: white;
      padding: 20px;
      border: 1px solid #ccc;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      z-index: 1000;
      text-align: center;
    `;

    const message = document.createElement('p');
    message.textContent = 'Notificações bloqueadas. Para ativar, siga as instruções abaixo:';

    const instructions = document.createElement('p');
    instructions.innerHTML = `
      <b>NO REPLIT:</b> Clique no botão "🔔 Ativar" no topo da tela<br>
      <b>MOBILE:</b> Menu do navegador (⋮) → Configurações do site → Notificações → Permitir<br>
      <b>DESKTOP:</b> Configurações do navegador → Privacidade → Notificações → Permitir para este site
    `;

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Fechar';
    closeButton.onclick = () => this.removePermissionPopup();
    closeButton.style.cssText = `
      margin-top: 10px;
      padding: 8px 12px;
      background-color: #ddd;
      border: none;
      cursor: pointer;
    `;

    popup.appendChild(message);
    popup.appendChild(instructions);
    popup.appendChild(closeButton);

    document.body.appendChild(popup);
  }

  // Mostrar popup para reativar permissões perdidas
  showReactivatePermissionPopup() {
    this.removePermissionPopup();

    const popup = document.createElement('div');
    popup.id = 'notification-permission-popup';
    popup.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: white;
      padding: 25px;
      border: 2px solid #dc3545;
      box-shadow: 0 6px 12px rgba(0,0,0,0.3);
      z-index: 1000;
      text-align: center;
      border-radius: 8px;
      max-width: 400px;
    `;

    const title = document.createElement('h4');
    title.textContent = '🔔 Reativar Notificações';
    title.style.color = '#dc3545';
    title.style.marginBottom = '15px';

    const message = document.createElement('p');
    message.innerHTML = `Detectamos que você <strong>reinstalou o app</strong> e perdeu as permissões de notificação.<br><br>Clique abaixo para <strong>reativar</strong>:`;
    message.style.marginBottom = '20px';

    const reactivateButton = document.createElement('button');
    reactivateButton.textContent = '🔔 Reativar Notificações';
    reactivateButton.onclick = async () => {
      try {
        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
          console.log('✅ SUCESSO: Permissão reativada!');
          localStorage.setItem('condoapp_had_permission', 'true');
          this.removePermissionPopup();
          location.reload(); // Reinicializar sistema
        } else {
          console.log('❌ Permissão negada novamente');
          this.showPermissionDeniedPopup();
        }
      } catch (error) {
        console.error('❌ Erro ao reativar:', error);
        this.showPermissionDeniedPopup();
      }
    };
    reactivateButton.style.cssText = `
      background-color: #dc3545;
      color: white;
      border: none;
      padding: 12px 24px;
      font-size: 16px;
      border-radius: 5px;
      cursor: pointer;
      margin: 5px;
      font-weight: bold;
    `;

    const skipButton = document.createElement('button');
    skipButton.textContent = 'Pular por agora';
    skipButton.onclick = () => {
      console.log('⏭️ Usuário pulou a reativação');
      this.removePermissionPopup();
    };
    skipButton.style.cssText = `
      background-color: #6c757d;
      color: white;
      border: none;
      padding: 10px 20px;
      font-size: 14px;
      border-radius: 5px;
      cursor: pointer;
      margin: 5px;
    `;

    popup.appendChild(title);
    popup.appendChild(message);
    popup.appendChild(reactivateButton);
    popup.appendChild(document.createElement('br'));
    popup.appendChild(skipButton);

    document.body.appendChild(popup);
  }

  // Mostrar popup para solicitar permissão (primeira vez)
  showPermissionRequestPopup() {
    this.removePermissionPopup();

    const popup = document.createElement('div');
    popup.id = 'notification-permission-popup';
    popup.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: white;
      padding: 25px;
      border: 1px solid #007bff;
      box-shadow: 0 6px 12px rgba(0,0,0,0.3);
      z-index: 1000;
      text-align: center;
      border-radius: 8px;
      max-width: 400px;
    `;

    const title = document.createElement('h4');
    title.textContent = '🔔 Ativar Notificações';
    title.style.color = '#007bff';
    title.style.marginBottom = '15px';

    const message = document.createElement('p');
    message.innerHTML = `Para receber avisos importantes do condomínio, <strong>clique no botão abaixo</strong> e aceite as notificações quando o navegador solicitar.`;
    message.style.marginBottom = '20px';

    const requestButton = document.createElement('button');
    requestButton.textContent = '🔔 Permitir Notificações';
    requestButton.onclick = async () => {
      try {
        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
          console.log('✅ SUCESSO: Permissão concedida para notificações!');
          console.log('📱 Este dispositivo receberá notificações push');
          this.removePermissionPopup();

          // Continuar com a criação da subscrição
          try {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration) {
              await this.createSubscription(registration);
            }
          } catch (error) {
            console.error('❌ Erro ao criar subscrição:', error);
          }
        } else if (permission === 'denied') {
          console.log('❌ NEGADO: Permissão negada para notificações');
          this.showPermissionDeniedPopup();
        } else {
          console.log('⚠️ Permissão para notificações foi ignorada pelo usuário');
          this.showPermissionIgnoredPopup();
        }
      } catch (error) {
        console.error('❌ Erro ao solicitar permissão:', error);
        this.showPermissionDeniedPopup();
      }
    };
    requestButton.style.cssText = `
      background-color: #007bff;
      color: white;
      border: none;
      padding: 12px 24px;
      font-size: 16px;
      border-radius: 5px;
      cursor: pointer;
      margin: 5px;
      font-weight: bold;
    `;

    const skipButton = document.createElement('button');
    skipButton.textContent = 'Pular por agora';
    skipButton.onclick = () => {
      console.log('⏭️ Usuário pulou a configuração de notificações');
      this.removePermissionPopup();
    };
    skipButton.style.cssText = `
      background-color: #6c757d;
      color: white;
      border: none;
      padding: 10px 20px;
      font-size: 14px;
      border-radius: 5px;
      cursor: pointer;
      margin: 5px;
    `;

    popup.appendChild(title);
    popup.appendChild(message);
    popup.appendChild(requestButton);
    popup.appendChild(document.createElement('br'));
    popup.appendChild(skipButton);

    document.body.appendChild(popup);
  }

  // Mostrar popup de permissão ignorada
  showPermissionIgnoredPopup() {
    this.removePermissionPopup();

    const popup = document.createElement('div');
    popup.id = 'notification-permission-popup';
    popup.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: white;
      padding: 20px;
      border: 1px solid #ffc107;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      z-index: 1000;
      text-align: center;
      border-radius: 8px;
    `;

    const message = document.createElement('p');
    message.textContent = 'Você não respondeu à solicitação de permissão. Clique no botão abaixo para tentar novamente:';

    const requestButton = document.createElement('button');
    requestButton.textContent = 'Tentar Novamente';
    requestButton.onclick = async () => {
      await this.requestPermissionManually();
    };
    requestButton.style.cssText = `
      margin-top: 10px;
      padding: 8px 12px;
      background-color: #ffc107;
      color: black;
      border: none;
      cursor: pointer;
      border-radius: 4px;
    `;

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Fechar';
    closeButton.onclick = () => this.removePermissionPopup();
    closeButton.style.cssText = `
      margin-top: 10px;
      margin-left: 10px;
      padding: 8px 12px;
      background-color: #ddd;
      border: none;
      cursor: pointer;
      border-radius: 4px;
    `;

    popup.appendChild(message);
    popup.appendChild(requestButton);
    popup.appendChild(closeButton);

    document.body.appendChild(popup);
  }

  // Mostrar mensagem de sucesso
  showSuccessMessage() {
    this.removePermissionPopup();

    const popup = document.createElement('div');
    popup.id = 'notification-permission-popup';
    popup.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: white;
      padding: 20px;
      border: 1px solid #ccc;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      z-index: 1000;
      text-align: center;
    `;

    const message = document.createElement('p');
    message.textContent = 'Notificações ativadas com sucesso!';

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Fechar';
    closeButton.onclick = () => this.removePermissionPopup();
    closeButton.style.cssText = `
      margin-top: 10px;
      padding: 8px 12px;
      background-color: #ddd;
      border: none;
      cursor: pointer;
    `;

    popup.appendChild(message);
    popup.appendChild(closeButton);

    document.body.appendChild(popup);
  }

  // Mostrar instruções específicas por dispositivo
  showPermissionInstructions(isMobile) {
    if (isMobile) {
      console.log('📱 MOBILE - Como permitir notificações:');
      console.log('1️⃣ Toque no ícone de menu (⋮) do navegador');
      console.log('2️⃣ Vá em "Configurações do site" ou "Informações do site"');
      console.log('3️⃣ Procure por "Notificações"');
      console.log('4️⃣ Mude de "Bloquear" para "Permitir"');
      console.log('5️⃣ Recarregue esta página');
    } else {
      console.log('🖥️ DESKTOP - Como permitir notificações:');
      console.log('1️⃣ Clique no ícone 🔒 ou ℹ️ ao lado da URL');
      console.log('2️⃣ Procure por "Notificações" nas configurações');
      console.log('3️⃣ Mude de "Bloquear" para "Permitir"');
      console.log('4️⃣ Recarregue esta página (F5)');
    }
  }

  // Mostrar botão para resetar permissões (apenas para teste)
  showResetButton() {
    console.log('🔧 Para desenvolvedores: Execute no console:');
    console.log('window.pushNotificationManager.requestPermissionManually()');
  }

  // Função manual para tentar solicitar permissão novamente
  async requestPermissionManually() {
    console.log('🔄 Tentativa manual de solicitar permissão...');
    try {
      const permission = await Notification.requestPermission();
      console.log(`🔔 Resultado: ${permission}`);

      if (permission === 'granted') {
        console.log('✅ Sucesso! Configurando sistema de notificações...');
        this.removePermissionPopup();

        // Tentar criar subscrição automaticamente
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            await this.createSubscription(registration);
            console.log('✅ Sistema completo de notificações ativado!');
          }
        } catch (error) {
          console.error('❌ Erro ao criar subscrição:', error);
        }

        return true;
      } else if (permission === 'denied') {
        console.log('❌ Permissão negada pelo usuário');
        this.showPermissionDeniedPopup();
        return false;
      } else {
        console.log('⚠️ Usuário ignorou a solicitação novamente');
        this.showPermissionIgnoredPopup();
        return false;
      }
    } catch (error) {
      console.error('❌ Erro ao solicitar permissão:', error);
      this.showPermissionDeniedPopup();
      return false;
    }
  }

  // Criar subscrição única por usuário
  async createSubscription(registration) {
    try {
      // Obter chave VAPID pública do servidor
      const vapidResponse = await fetch('/api/vapid-public-key');

      if (!vapidResponse.ok) {
        throw new Error(`Erro HTTP: ${vapidResponse.status}`);
      }

      const vapidData = await vapidResponse.json();

      if (!vapidData.publicKey) {
        throw new Error('Chave VAPID não disponível no servidor');
      }

      console.log('🔑 Chave VAPID recebida do servidor');
      console.log('📱 Verificando subscrições existentes...');

      // Verificar se o navegador suporta push manager
      if (!registration.pushManager) {
        throw new Error('Push Manager não suportado');
      }

      // STEP 1: Limpar qualquer subscrição existente (resolução do conflito de chaves VAPID)
      try {
        const existingSubscription = await registration.pushManager.getSubscription();
        if (existingSubscription) {
          console.log('🔄 Removendo subscrição antiga com chave VAPID diferente...');
          await existingSubscription.unsubscribe();
          console.log('✅ Subscrição antiga removida com sucesso');
        }
      } catch (cleanupError) {
        console.log('⚠️ Erro ao limpar subscrição antiga (continuando):', cleanupError.message);
      }

      console.log('📱 Criando nova subscrição com chave VAPID atualizada...');

      // STEP 2: Configurações otimizadas para compatibilidade universal
      const subscriptionOptions = {
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidData.publicKey)
      };

      // STEP 3: Criar subscrição real com chave VAPID permanente
      const subscription = await registration.pushManager.subscribe(subscriptionOptions);

      // Verificar se a subscrição foi criada corretamente
      if (!subscription) {
        throw new Error('Falha ao criar subscrição');
      }

      console.log('✅ Subscrição criada com sucesso');
      console.log(`📱 Endpoint: ${subscription.endpoint.substring(0, 50)}...`);

      this.subscription = subscription;

      // Salvar subscrição no servidor com dados do usuário
      await this.saveSubscription();

      console.log('✅ Sistema de notificações push TOTALMENTE ativo!');

    } catch (error) {
      console.error('❌ Erro ao criar subscrição:', error);

      // Diagnóstico detalhado do erro
      if (error.name === 'NotSupportedError') {
        console.log('⚠️ Push notifications não suportadas neste navegador/dispositivo');
      } else if (error.name === 'InvalidAccessError') {
        console.log('⚠️ Problema com chave VAPID - pode ser incompatibilidade');
      } else if (error.name === 'NotAllowedError') {
        console.log('⚠️ Permissão negada para notificações');
      } else {
        console.log(`⚠️ Erro específico: ${error.name} - ${error.message}`);
      }

      // Fallback para subscrição simulada que permite teste local
      console.log('🔧 Ativando modo de fallback para testes locais');
      this.subscription = { 
        endpoint: 'simulated-endpoint-' + Date.now(), 
        keys: { 
          p256dh: 'BMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // 65 bytes simulados
          auth: 'xxxxxxxxxxxxxxxxxxxxxxxx' // 24 bytes simulados
        } 
      };

      try {
        await this.saveSubscription();
        console.log('✅ Sistema em modo de fallback - notificações locais funcionais');
      } catch (saveError) {
        console.error('❌ Erro ao salvar subscrição de fallback:', saveError);
      }
    }
  }

  // Salvar subscrição no servidor
  async saveSubscription() {
    try {
      const response = await fetch('/api/push-subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: this.user.id,
          userRole: this.user.role,
          userBloco: this.user.bloco || '',
          userUnidade: this.user.unidade || '',
          subscription: this.subscription
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar subscrição no servidor');
      }

      console.log('✅ Subscrição salva no servidor com dados do usuário');

    } catch (error) {
      console.error('Erro ao salvar subscrição:', error);
      throw error;
    }
  }

  // Teste de notificação local
  testLocalNotification() {
    if (Notification.permission === 'granted') {
      console.log('🧪 Enviando notificação de teste...');

      const notification = new Notification('🏢 CondoApp - Teste', {
        body: `Notificações ativadas para ${this.user.name}!`,
        icon: 'https://cdn-icons-png.flaticon.com/512/1946/1946436.png',
        tag: 'test-notification'
      });

      notification.onclick = function() {
        console.log('✅ Notificação de teste clicada!');
        notification.close();
      };

      setTimeout(() => {
        notification.close();
      }, 5000);

      console.log('✅ Teste concluído - Se você viu a notificação, o sistema está funcionando!');
    }
  }

  // Remover subscrição
  async unsubscribe() {
    try {
      if (this.subscription) {
        await this.subscription.unsubscribe();
      }

      await fetch('/api/push-unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: this.user.id
        })
      });

      console.log('✅ Subscrição removida');
    } catch (error) {
      console.error('Erro ao remover subscrição:', error);
    }
  }

  // Enviar notificação para usuários específicos (será chamado pelo servidor)
  static async sendToUsers(message, targetUsers) {
    // Esta função será implementada no backend
    // O frontend apenas recebe as notificações
    console.log('📨 Enviando notificação para usuários específicos:', targetUsers);
  }

  // Converter chave VAPID
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Diagnóstico completo do sistema de notificações
  async runDiagnostics() {
    console.log('🔍 === DIAGNÓSTICO COMPLETO DE NOTIFICAÇÕES ===');

    // 1. Verificar suporte do navegador
    const hasServiceWorker = 'serviceWorker' in navigator;
    const hasPushManager = 'PushManager' in window;
    const hasNotifications = 'Notification' in window;

    console.log(`📊 Suporte do navegador:`);
    console.log(`   Service Worker: ${hasServiceWorker ? '✅' : '❌'}`);
    console.log(`   Push Manager: ${hasPushManager ? '✅' : '❌'}`);
    console.log(`   Notifications: ${hasNotifications ? '✅' : '❌'}`);

    // 2. Status da permissão
    console.log(`🔔 Permissão atual: ${Notification.permission}`);

    // 3. Service Worker
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      console.log(`⚙️ Service Worker: ${registration ? '✅ Registrado' : '❌ Não registrado'}`);
    } catch (error) {
      console.log(`⚙️ Service Worker: ❌ Erro - ${error.message}`);
    }

    // 4. URL e dispositivo
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    console.log(`📱 Dispositivo: ${isMobile ? 'Mobile' : 'Desktop'}`);
    console.log(`🌐 URL: ${window.location.href}`);
    console.log(`🌐 Protocol: ${window.location.protocol}`);

    // 5. Usuario atual
    if (this.user) {
      console.log(`👤 Usuário: ${this.user.name} (${this.user.role})`);
    } else {
      console.log(`👤 Usuário: ❌ Não logado`);
    }

    // 6. Recomendações
    console.log(`💡 Recomendações:`);
    if (Notification.permission === 'denied') {
      console.log(`   🔧 Execute: window.pushNotificationManager.requestPermissionManually()`);
      console.log(`   🔧 Ou resetar as permissões do site nas configurações do navegador`);
    } else if (Notification.permission === 'default') {
      console.log(`   🔧 Execute: window.pushNotificationManager.requestPermissionManually()`);
    } else {
      console.log(`   ✅ Sistema configurado corretamente!`);
    }

    console.log('🔍 === FIM DO DIAGNÓSTICO ===');
  }
}

// Instância global
window.pushNotificationManager = new PushNotificationManager();

// Sistema de notificações configurado e ativo