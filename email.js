require('dotenv').config();
const nodemailer = require('nodemailer');

// ========== CONFIGURAÇÃO SEGURA DO TRANSPORTER ==========
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verificação de conexão ao iniciar
transporter.verify((error) => {
  if (error) {
    console.error('Erro na conexão SMTP:', error);
  } else {
    console.log('Conexão SMTP estabelecida com sucesso');
  }
});

// ========== FUNÇÕES CORRIGIDAS ==========
async function sendPasswordResetEmail(toEmail, token) {
  if (!toEmail || !toEmail.includes('@')) {
    console.error('E-mail do destinatário inválido:', toEmail);
    return false;
  }

  try {
    await transporter.sendMail({
      from: `"Sistema CondoTorre" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: 'Token de Recuperação de Senha',
      html: `<b>Seu token de acesso é: ${token}</b>`
    });
    return true;
  } catch (error) {
    console.error('Erro ao enviar token:', error);
    return false;
  }
}

async function sendApprovalRequestEmail(userData) {
  const { query } = require('./database');
  
  try {
    // Buscar email do admin-app no banco de dados
    const adminResult = await query('SELECT email FROM users WHERE role = $1 LIMIT 1', ['admin-app']);
    
    if (adminResult.rows.length === 0) {
      console.error('Nenhum usuário admin-app encontrado no banco de dados');
      return false;
    }

    const adminEmail = adminResult.rows[0].email;
    console.log(`📧 Enviando notificação para admin-app: ${adminEmail}`);

    await transporter.sendMail({
      from: `"Sistema CondoTorre" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject: 'Aprovação de Síndico Pendente',
      html: `
        <h2>Novo cadastro de síndico aguardando aprovação</h2>
        <p><strong>Nome:</strong> ${userData.name}</p>
        <p><strong>Login:</strong> ${userData.login}</p>
        <p><strong>E-mail:</strong> ${userData.email}</p>
        <p><strong>Telefone:</strong> ${userData.telefone}</p>
        <p><strong>Bloco:</strong> ${userData.bloco}</p>
        <p><strong>Unidade:</strong> ${userData.unidade}</p>
      `
    });
    return true;
  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
    return false;
  }
}

async function sendBackupEmail(email, backupFilePath) {
  const fs = require('fs');
  const path = require('path');

  // Verificar se o arquivo existe
  if (!fs.existsSync(backupFilePath)) {
    throw new Error('Arquivo de backup não encontrado');
  }

  const fileName = path.basename(backupFilePath);
  const stats = fs.statSync(backupFilePath);
  const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);
  const now = new Date();
  const dateFormatted = now.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  try {
    await transporter.sendMail({
      from: `"Sistema CondoTorre" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `CondoTorre - Backup Automático - ${dateFormatted}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
         <div style="background: linear-gradient(135deg, #4169E1 0%, #1E3A8A 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">CondoTorre</h1>
            <p style="color: white; margin: 10px 0 0 0;">Sistema de Gestão</p>
          </div>

          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #2C3E50;">🔒 Backup Automático</h2>
            <p style="color: #7F8C8D; line-height: 1.6;">
              Backup da base de dados gerado automaticamente em <strong>${dateFormatted}</strong>.
            </p>

            <div style="background: #e9ecef; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <h3 style="color: #2C3E50; margin: 0 0 10px 0;">📊 Detalhes do Backup:</h3>
              <p style="margin: 5px 0; color: #7F8C8D;"><strong>Arquivo:</strong> ${fileName}</p>
              <p style="margin: 5px 0; color: #7F8C8D;"><strong>Tamanho:</strong> ${fileSizeMB} MB</p>
              <p style="margin: 5px 0; color: #7F8C8D;"><strong>Data/Hora:</strong> ${dateFormatted}</p>
            </div>

            <p style="color: #7F8C8D; line-height: 1.6;">
              O arquivo de backup está anexado a este e-mail. Mantenha-o em local seguro.
            </p>
          </div>

          <div style="padding: 20px; text-align: center; background: #e9ecef; color: #7F8C8D; font-size: 12px;">
            Este é um e-mail automático do sistema de backup.
          </div>
        </div>
      `,
      attachments: [
        {
          filename: fileName,
          path: backupFilePath,
          contentType: 'application/sql'
        }
      ]
    });
    return true;
  } catch (error) {
    console.error('Erro ao enviar backup por e-mail:', error);
    return false;
  }
}

module.exports = {
  sendPasswordResetEmail,
  sendApprovalRequestEmail,
  sendBackupEmail, 
  transporter
};