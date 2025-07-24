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
  if (!process.env.ADMIN_EMAIL) {
    console.error('Variável ADMIN_EMAIL não configurada no .env');
    return false;
  }

  try {
    await transporter.sendMail({
      from: `"Sistema CondoTorre" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: 'Aprovação de Síndico Pendente',
      html: `
        <h2>Novo cadastro de síndico aguardando aprovação</h2>
        <p><strong>Nome:</strong> ${userData.name}</p>
        <p><strong>Login:</strong> ${userData.username}</p>
        <p><strong>E-mail:</strong> ${userData.email}</p>
        <p><strong>Telefone:</strong> ${userData.telefone}</p>
      `
    });
    return true;
  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
    return false;
  }
}

module.exports = {
  sendPasswordResetEmail,
  sendApprovalRequestEmail,
  transporter
};
