
/**
 * Módulo de Autenticação Biométrica para CondoApp
 * Utiliza WebAuthn API para impressão digital, Face ID, Touch ID
 */

class BiometricAuth {
  constructor() {
    this.isSupported = this.checkSupport();
    this.userId = null;
    this.deviceFingerprint = this.generateDeviceFingerprint();
  }

  // Verificar suporte à WebAuthn
  checkSupport() {
    return !!(window.PublicKeyCredential && 
              navigator.credentials && 
              navigator.credentials.create && 
              navigator.credentials.get);
  }

  // Gerar fingerprint único do dispositivo
  generateDeviceFingerprint() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device fingerprint', 2, 2);
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|');
    
    return btoa(fingerprint).substring(0, 32);
  }

  // Verificar status da biometria no servidor
  async checkBiometricStatus(userId) {
    try {
      console.log('🔍 Verificando status biométrico para usuário:', userId);
      
      const response = await fetch(`/api/biometric-status/${userId}`);
      const data = await response.json();
      
      if (!data.success) {
        return 'not_configured';
      }

      // Verificar localStorage (cache local)
      const localPref = localStorage.getItem('biometric_enabled');
      
      if (data.enabled && !localPref) {
        // Servidor diz que tem biometria, mas localStorage não tem
        return 'reactivation_needed';
      }
      
      if (data.enabled && localPref === 'true') {
        return 'active';
      }
      
      return 'not_configured';
      
    } catch (error) {
      console.error('❌ Erro ao verificar status biométrico:', error);
      return 'error';
    }
  }

  // Registrar biometria pela primeira vez
  async registerBiometric(userId, userName) {
    if (!this.isSupported) {
      throw new Error('Biometria não suportada neste dispositivo');
    }

    try {
      console.log('📱 Iniciando registro biométrico...');

      // Gerar challenge único
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      // Configurações do WebAuthn
      const publicKeyCredentialCreationOptions = {
        challenge: challenge,
        rp: {
          name: "CondoApp",
          id: window.location.hostname,
        },
        user: {
          id: new TextEncoder().encode(userId.toString()),
          name: userName,
          displayName: userName,
        },
        pubKeyCredParams: [
          { alg: -7, type: "public-key" },  // ES256
          { alg: -257, type: "public-key" } // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform", // Biometria local
          userVerification: "required",
          requireResidentKey: false,
        },
        timeout: 60000,
        attestation: "direct"
      };

      console.log('🔐 Solicitando criação de credencial biométrica...');
      
      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions
      });

      if (!credential) {
        throw new Error('Falha na criação da credencial');
      }

      // Preparar dados para envio ao servidor
      const credentialData = {
        id: credential.id,
        rawId: this.arrayBufferToBase64(credential.rawId),
        type: credential.type,
        response: {
          attestationObject: this.arrayBufferToBase64(credential.response.attestationObject),
          clientDataJSON: this.arrayBufferToBase64(credential.response.clientDataJSON),
        },
        deviceFingerprint: this.deviceFingerprint
      };

      // Salvar no servidor
      const saveResponse = await fetch('/api/biometric-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          credentialData: credentialData,
          deviceFingerprint: this.deviceFingerprint
        })
      });

      const saveResult = await saveResponse.json();

      if (saveResult.success) {
        // Salvar preferência local
        localStorage.setItem('biometric_enabled', 'true');
        localStorage.setItem('biometric_credential_id', credential.id);
        
        console.log('✅ Biometria registrada com sucesso');
        return true;
      } else {
        throw new Error(saveResult.error || 'Erro ao salvar biometria');
      }

    } catch (error) {
      console.error('❌ Erro no registro biométrico:', error);
      
      if (error.name === 'NotAllowedError') {
        throw new Error('Usuário cancelou ou dispositivo bloqueado');
      } else if (error.name === 'NotSupportedError') {
        throw new Error('Biometria não suportada neste dispositivo');
      } else {
        throw new Error('Erro ao configurar biometria: ' + error.message);
      }
    }
  }

  // Autenticar com biometria
  async authenticateWithBiometric(userId) {
    if (!this.isSupported) {
      throw new Error('Biometria não suportada');
    }

    try {
      console.log('🔓 Iniciando autenticação biométrica...');

      // Buscar credenciais do usuário no servidor
      const credResponse = await fetch(`/api/biometric-credentials/${userId}`);
      const credData = await credResponse.json();

      if (!credData.success || !credData.credentials.length) {
        throw new Error('Nenhuma credencial biométrica encontrada');
      }

      // Gerar challenge
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      // Configurações de autenticação
      const allowCredentials = credData.credentials
        .filter(cred => cred.credential_id && typeof cred.credential_id === 'string')
        .map(cred => {
          try {
            return {
              id: this.base64ToArrayBuffer(cred.credential_id),
              type: 'public-key'
            };
          } catch (error) {
            console.warn('⚠️ Credencial inválida ignorada:', cred.credential_id);
            return null;
          }
        })
        .filter(cred => cred !== null);

      if (allowCredentials.length === 0) {
        throw new Error('Nenhuma credencial válida encontrada');
      }

      const publicKeyCredentialRequestOptions = {
        challenge: challenge,
        allowCredentials: allowCredentials,
        userVerification: 'required',
        timeout: 60000,
      };

      console.log('🔐 Solicitando autenticação biométrica...');
      
      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions
      });

      if (!assertion) {
        throw new Error('Falha na autenticação');
      }

      // Verificar autenticação no servidor
      const verifyResponse = await fetch('/api/biometric-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          credentialId: assertion.id,
          signature: this.arrayBufferToBase64(assertion.response.signature),
          authenticatorData: this.arrayBufferToBase64(assertion.response.authenticatorData),
          clientDataJSON: this.arrayBufferToBase64(assertion.response.clientDataJSON),
          deviceFingerprint: this.deviceFingerprint
        })
      });

      const verifyResult = await verifyResponse.json();

      if (verifyResult.success) {
        console.log('✅ Autenticação biométrica bem-sucedida');
        return true;
      } else {
        throw new Error(verifyResult.error || 'Falha na verificação');
      }

    } catch (error) {
      console.error('❌ Erro na autenticação biométrica:', error);
      
      if (error.name === 'NotAllowedError') {
        throw new Error('Autenticação cancelada ou falhou');
      } else {
        throw new Error('Erro na autenticação: ' + error.message);
      }
    }
  }

  // Desabilitar biometria
  async disableBiometric(userId) {
    try {
      const response = await fetch('/api/biometric-disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: userId,
          deviceFingerprint: this.deviceFingerprint
        })
      });

      const result = await response.json();

      if (result.success) {
        localStorage.removeItem('biometric_enabled');
        localStorage.removeItem('biometric_credential_id');
        console.log('✅ Biometria desabilitada');
        return true;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ Erro ao desabilitar biometria:', error);
      throw error;
    }
  }

  // Utilitários de conversão (versão corrigida)
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    const binaryArray = Array.from(bytes);
    const binaryString = binaryArray.map(byte => String.fromCharCode(byte)).join('');
    return btoa(binaryString);
  }

  base64ToArrayBuffer(base64) {
    try {
      // Limpar caracteres inválidos
      const cleanBase64 = base64.replace(/[^A-Za-z0-9+/=]/g, '');
      const binaryString = atob(cleanBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes.buffer;
    } catch (error) {
      console.error('❌ Erro na conversão base64:', error);
      throw new Error('Erro na decodificação dos dados biométricos');
    }
  }

  // Interface para mostrar opções de biometria
  async showBiometricOptions(userId, userName) {
    const status = await this.checkBiometricStatus(userId);
    
    switch (status) {
      case 'not_configured':
        return this.showSetupDialog(userId, userName);
      case 'reactivation_needed':
        return this.showReactivationDialog(userId, userName);
      case 'active':
        return this.showManageDialog(userId);
      default:
        console.log('Status biométrico:', status);
        return false;
    }
  }

  // Diálogo de configuração inicial
  showSetupDialog(userId, userName) {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'modal fade';
      modal.innerHTML = `
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">🔐 Configurar Biometria</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <p>Deseja ativar a autenticação biométrica para acesso mais rápido e seguro?</p>
              <ul class="list-unstyled">
                <li>✅ Impressão digital</li>
                <li>✅ Face ID / Touch ID</li>
                <li>✅ Windows Hello</li>
              </ul>
              <small class="text-muted">Seus dados biométricos ficam apenas no seu dispositivo.</small>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Agora não</button>
              <button type="button" class="btn btn-primary" id="setupBiometric">Ativar Biometria</button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      const bsModal = new bootstrap.Modal(modal);
      bsModal.show();

      modal.querySelector('#setupBiometric').onclick = async () => {
        try {
          const success = await this.registerBiometric(userId, userName);
          bsModal.hide();
          resolve(success);
        } catch (error) {
          alert('Erro ao configurar biometria: ' + error.message);
          resolve(false);
        }
      };

      modal.addEventListener('hidden.bs.modal', () => {
        document.body.removeChild(modal);
        resolve(false);
      });
    });
  }

  // Diálogo de reativação
  showReactivationDialog(userId, userName) {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'modal fade';
      modal.innerHTML = `
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">🔄 Reativar Biometria</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <p>Você já tinha biometria configurada. Deseja reativar neste dispositivo?</p>
              <small class="text-muted">Será necessário configurar novamente por segurança.</small>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="button" class="btn btn-primary" id="reactivateBiometric">Reativar</button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      const bsModal = new bootstrap.Modal(modal);
      bsModal.show();

      modal.querySelector('#reactivateBiometric').onclick = async () => {
        try {
          const success = await this.registerBiometric(userId, userName);
          bsModal.hide();
          resolve(success);
        } catch (error) {
          alert('Erro ao reativar biometria: ' + error.message);
          resolve(false);
        }
      };

      modal.addEventListener('hidden.bs.modal', () => {
        document.body.removeChild(modal);
        resolve(false);
      });
    });
  }

  // Diálogo de gerenciamento
  showManageDialog(userId) {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'modal fade';
      modal.innerHTML = `
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">⚙️ Gerenciar Biometria</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <p>✅ Biometria ativa neste dispositivo</p>
              <p>Você pode desabilitar a qualquer momento.</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
              <button type="button" class="btn btn-danger" id="disableBiometric">Desabilitar</button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      const bsModal = new bootstrap.Modal(modal);
      bsModal.show();

      modal.querySelector('#disableBiometric').onclick = async () => {
        try {
          await this.disableBiometric(userId);
          bsModal.hide();
          resolve(true);
        } catch (error) {
          alert('Erro ao desabilitar biometria: ' + error.message);
          resolve(false);
        }
      };

      modal.addEventListener('hidden.bs.modal', () => {
        document.body.removeChild(modal);
        resolve(false);
      });
    });
  }
}

// Instância global
window.biometricAuth = new BiometricAuth();
