
const express = require('express');
const bcrypt = require('bcryptjs');
const { query } = require('../database');
const { sendPasswordResetEmail, sendApprovalRequestEmail } = require('../email');

const router = express.Router();

/**
 * Módulo de Autenticação
 * Responsável por todas as rotas relacionadas ao sistema de autenticação
 */

// ========== ROTA DE LOGIN ==========
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await query('SELECT * FROM users WHERE username = $1', [username]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Usuário não encontrado' });
    }

    const user = result.rows[0];
    
    if (!user.aprovado) {
      return res.status(401).json({ success: false, error: 'Usuário aguardando aprovação' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch) {
      return res.status(401).json({ success: false, error: 'Senha incorreta' });
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      bloco: user.bloco,
      unidade: user.unidade
    };

    res.json({ 
      success: true, 
      user: req.session.user,
      primeiro_acesso: user.primeiro_acesso
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== ROTA DE CADASTRO ==========
router.post('/cadastro', async (req, res) => {
  const { username, password, name, email, telefone, bloco, unidade, role } = req.body;

  try {
    // Verificar se usuário já existe
    const existingUser = await query('SELECT id FROM users WHERE username = $1 OR email = $2', [username, email]);
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'Usuário ou email já existe' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await query(
      'INSERT INTO users (username, password, name, email, telefone, bloco, unidade, role, aprovado) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
      [username, hashedPassword, name, email, telefone, bloco, unidade, role, role === 'sindico']
    );

    // Enviar email de aprovação se necessário
    if (role !== 'sindico') {
      await sendApprovalRequestEmail({ name, username, email, bloco, unidade, role });
    }

    res.json({ success: true, userId: result.rows[0].id });

  } catch (error) {
    console.error('Erro no cadastro:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== ROTA DE LOGOUT ==========
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, error: 'Erro ao fazer logout' });
    }
    res.json({ success: true });
  });
});

// ========== ROTA DE RECUPERAÇÃO DE SENHA ==========
router.post('/esqueci-senha', async (req, res) => {
  const { email } = req.body;

  try {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Email não encontrado' });
    }

    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const expira = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    await query(
      'UPDATE users SET token_recuperacao = $1, token_expira = $2 WHERE email = $3',
      [token, expira, email]
    );

    const emailEnviado = await sendPasswordResetEmail(email, token);
    
    if (emailEnviado) {
      res.json({ success: true, message: 'Token enviado por email' });
    } else {
      res.status(500).json({ success: false, error: 'Erro ao enviar email' });
    }

  } catch (error) {
    console.error('Erro na recuperação de senha:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== ROTA DE VALIDAÇÃO DE TOKEN ==========
router.post('/validar-token', async (req, res) => {
  const { email, token } = req.body;

  try {
    const result = await query(
      'SELECT * FROM users WHERE email = $1 AND token_recuperacao = $2 AND token_expira > NOW()',
      [email, token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, error: 'Token inválido ou expirado' });
    }

    res.json({ success: true });

  } catch (error) {
    console.error('Erro na validação do token:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== ROTA DE REDEFINIÇÃO DE SENHA ==========
router.post('/nova-senha', async (req, res) => {
  const { email, token, novaSenha } = req.body;

  try {
    const result = await query(
      'SELECT * FROM users WHERE email = $1 AND token_recuperacao = $2 AND token_expira > NOW()',
      [email, token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, error: 'Token inválido ou expirado' });
    }

    const hashedPassword = await bcrypt.hash(novaSenha, 10);
    
    await query(
      'UPDATE users SET password = $1, token_recuperacao = NULL, token_expira = NULL, primeiro_acesso = false WHERE email = $2',
      [hashedPassword, email]
    );

    res.json({ success: true });

  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
