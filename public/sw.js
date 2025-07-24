/**
 * Service Worker para Sistema de Badge e Push Notifications (SISTEMA B)
 * Gerencia notificações push, badge do ícone e comunicação com o app principal
 * Funciona mesmo com o app fechado para receber notificações
 */

self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker instalado');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker ativado');
  event.waitUntil(self.clients.claim());
});

// Escutar mensagens da página para limpar badge e notificações
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_BADGE') {
    console.log('🎯 [SW] Recebido comando para limpar badge');
    
    if (navigator.setAppBadge) {
      navigator.clearAppBadge()
        .then(() => {
          console.log('✅ [SW] Badge limpo com sucesso');
        })
        .catch((error) => {
          console.log('⚠️ [SW] Erro ao limpar badge:', error);
        });
    }
  }
  
  if (event.data && event.data.type === 'DISMISS_ALL_NOTIFICATIONS') {
    console.log('🎯 [SW] Removendo todas as notificações do painel Android');
    
    self.registration.getNotifications()
      .then(notifications => {
        console.log(`📱 [SW] ${notifications.length} notificações encontradas`);
        notifications.forEach(notification => {
          notification.close();
        });
        console.log('✅ [SW] Todas as notificações removidas do painel');
      })
      .catch(error => {
        console.log('⚠️ [SW] Erro ao remover notificações:', error);
      });
  }
});

// Interceptar push para aplicar badge automaticamente (SISTEMA B SIMPLIFICADO)
self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }

  const data = event.data.json();

  // Configurações da notificação
  const notificationOptions = {
    body: data.body || 'Nova mensagem do condomínio',
    icon: data.icon || 'https://cdn-icons-png.flaticon.com/512/1946/1946436.png',
    badge: data.badge || 'https://cdn-icons-png.flaticon.com/512/1946/1946436.png',
    data: data.data || {},
    requireInteraction: false,
    silent: false,
    tag: `condo-message-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  };

  event.waitUntil(
    (async () => {
      // 🎯 SISTEMA B: Aplicar badge direto do push (já calculado no servidor)
      if (data.data && typeof data.data.realBadge !== 'undefined') {
        const badgeCount = data.data.realBadge;

        if (navigator.setAppBadge) {
          if (badgeCount > 0) {
            await navigator.setAppBadge(badgeCount);
          } else {
            await navigator.clearAppBadge();
          }
        }
      }
      else {

        // Buscar badge atual via API se não veio no push
        try {
          const clients = await self.clients.matchAll({ type: 'window' });
          let userId = null;

          // Tentar obter userId da página ativa
          for (const client of clients) {
            try {
              const response = await new Promise((resolve, reject) => {
                const messageChannel = new MessageChannel();

                messageChannel.port1.onmessage = (event) => {
                  resolve(event.data);
                };

                setTimeout(() => reject(new Error('Timeout')), 1000);

                client.postMessage({ type: 'GET_USER_ID' }, [messageChannel.port2]);
              });

              if (response && response.userId) {
                userId = response.userId;
                break;
              }
            } catch (error) {
              // Continua tentando outros clientes
            }
          }

          if (userId) {
            const response = await fetch(`/api/unread-count?userId=${userId}`);
            const data = await response.json();

            if (data.success) {
              const currentBadge = data.unreadCount;
              console.log(`📊 Badge atual: ${currentBadge}`);

              if (navigator.setAppBadge) {
                if (currentBadge > 0) {
                  await navigator.setAppBadge(currentBadge);
                  console.log(`✅ Badge ${currentBadge} aplicado via fallback`);
                } else {
                  await navigator.clearAppBadge();
                  console.log(`✅ Badge removido via fallback`);
                }
              }
            }
          }
        } catch (fallbackError) {
          console.log(`⚠️ Fallback falhou: ${fallbackError.message}`);
        }
      }

      // Exibir notificação
      await self.registration.showNotification(data.title || '🏢 CondoApp', notificationOptions);
      console.log('📱 Notificação exibida');
      console.log('📨 ============================');
    })()
  );
});

// Lidar com clique na notificação
self.addEventListener('notificationclick', (event) => {
  console.log('👆 Notificação clicada');

  event.notification.close();

  event.waitUntil(
    self.clients.openWindow(event.notification.data.url || '/dashboard.html')
  );
});