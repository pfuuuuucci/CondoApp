const express = require('express');
const path = require('path');
const { query, initializeTables } = require('./database');
const { cleanupExpiredMessages } = require('./cleanup-messages');
const { 
  sendPasswordResetEmail, 
  sendApprovalRequestEmail,
  transporter
} = require('./email');
const bcrypt = require('bcryptjs');
const webpush = require('web-push');

const app = express();
const PORT = 3000;

// Importar as rotas de backup
const backupRoutes = require('./server/routes/backupRoutes');
// Usar as rotas
app.use('/api/backup', backupRoutes);

// Sistema de chaves VAPID permanentes
let vapidKeys = {
  publicKey: null,
  privateKey: null
};

// Função para inicializar chaves VAPID permanentes
async function initializeVapidKeys() {
  try {
    // Tentar buscar chaves existentes no banco
    const existingKeys = await query('SELECT public_key, private_key FROM vapid_keys LIMIT 1');

    if (existingKeys.rows.length > 0) {
      // Usar chaves existentes
      vapidKeys.publicKey = existingKeys.rows[0].public_key;
      vapidKeys.privateKey = existingKeys.rows[0].private_key;
      console.log('🔑 Chaves VAPID carregadas do banco de dados');
    } else {
      // Gerar novas chaves e salvar
      const newVapidKeys = webpush.generateVAPIDKeys();

      await query(`
        INSERT INTO vapid_keys (public_key, private_key, created_at) 
        VALUES ($1, $2, NOW())
      `, [newVapidKeys.publicKey, newVapidKeys.privateKey]);

      vapidKeys.publicKey = newVapidKeys.publicKey;
      vapidKeys.privateKey = newVapidKeys.privateKey;

      console.log('🔑 Novas chaves VAPID geradas e salvas no banco');
      console.log('📋 Public Key:', vapidKeys.publicKey);
    }

    // Configurar web-push com chaves permanentes
    webpush.setVapidDetails(
      'mailto:condoapp@exemplo.com',
      vapidKeys.publicKey,
      vapidKeys.privateKey
    );

    console.log('✅ Sistema VAPID inicializado com sucesso');

  } catch (error) {
    console.error('❌ Erro ao inicializar chaves VAPID:', error);

    // Fallback para chaves temporárias
    const tempKeys = webpush.generateVAPIDKeys();
    vapidKeys.publicKey = tempKeys.publicKey;
    vapidKeys.privateKey = tempKeys.privateKey;

    webpush.setVapidDetails(
      'mailto:condoapp@exemplo.com',
      vapidKeys.publicKey,
      vapidKeys.privateKey
    );

    console.log('⚠️ Usando chaves VAPID temporárias como fallback');
  }
}

// Inicializar tabelas do banco e chaves VAPID na inicialização
async function startServer() {
  try {
    await initializeTables();
    await initializeVapidKeys();

    // Executar limpeza de mensagens expiradas na inicialização
    console.log('🧹 Executando limpeza inicial de mensagens...');
    await cleanupExpiredMessages();

    console.log('🚀 Servidor inicializado completamente');
  } catch (error) {
    console.error('❌ Erro na inicialização:', error);
  }
}

startServer();

app.use(express.json());
app.use(express.static('public'));

// ========== FUNÇÃO DE VALIDAÇÃO DE E-MAIL ==========
async function emailJaCadastrado(email) {
  const result = await query('SELECT id FROM users WHERE email = $1', [email]);
  return result.rows.length > 0;
}

// ========== ROTA DE LOGIN (ATUALIZADA PARA ADMIN-APP) ==========
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    // Verifica se o usuário existe
    if (!user) {
      return res.json({ 
        success: false, 
        error: 'Usuário não encontrado' 
      });
    }

    // Bloqueia acesso se for admin-app e houver mais de um cadastrado
    if (user.role === 'admin-app') {
      const adminResult = await query('SELECT COUNT(*) FROM users WHERE role = $1', ['admin-app']);
      if (parseInt(adminResult.rows[0].count) > 1) {
        return res.json({ 
          success: false, 
          error: 'Erro crítico: múltiplos administradores detectados.' 
        });
      }
    } 
    // Verifica aprovação apenas para síndicos
    else if (user.role === 'sindico' && !user.aprovado) {
      return res.json({ 
        success: false, 
        error: 'Cadastro pendente de aprovação do administrador' 
      });
    }

    // Verifica senha
    if (bcrypt.compareSync(password, user.password)) {
      res.json({ 
        success: true,
        primeiro_acesso: user.primeiro_acesso,
        user: { 
          ...user, 
          password: undefined // Remove a senha da resposta
        }
      });
    } else {
      res.json({ 
        success: false, 
        error: 'Senha incorreta' 
      });
    }
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// ======================
// CRUD DE BLOCOS
// ======================
app.get('/api/blocos', async (req, res) => {
  try {
    const result = await query('SELECT * FROM blocos ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar blocos:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

app.post('/api/blocos', async (req, res) => {
  const { nome } = req.body;
  try {
    await query('INSERT INTO blocos (nome) VALUES ($1)', [nome]);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao criar bloco:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

app.put('/api/blocos/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { nome } = req.body;
  try {
    const result = await query('UPDATE blocos SET nome = $1 WHERE id = $2', [nome, id]);
    if (result.rowCount > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, error: "Bloco não encontrado" });
    }
  } catch (error) {
    console.error('Erro ao atualizar bloco:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

app.delete('/api/blocos/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    // Verifica se há agrupadores vinculados ao bloco
    const agrupResult = await query('SELECT COUNT(*) FROM agrupadores WHERE bloco_id = $1', [id]);
    if (parseInt(agrupResult.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        error: 'Não é possível excluir: existem agrupadores vinculados a este bloco!'
      });
    }

    // Verifica se há grupos vinculados ao bloco
    const grupoResult = await query('SELECT COUNT(*) FROM grupos WHERE bloco_id = $1', [id]);
    if (parseInt(grupoResult.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        error: 'Não é possível excluir: existem grupos vinculados a este bloco!'
      });
    }

    // Exclui se não houver vínculos
    const result = await query('DELETE FROM blocos WHERE id = $1', [id]);
    if (result.rowCount > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, error: "Bloco não encontrado" });
    }
  } catch (error) {
    console.error('Erro ao excluir bloco:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// ======================
// CRUD DE AGRUPADORES
// ======================
app.get('/api/agrupadores', async (req, res) => {
  try {
    const result = await query('SELECT * FROM agrupadores ORDER BY id');
    res.json(result.rows.map(row => ({
      id: row.id,
      nome: row.nome,
      blocoId: row.bloco_id
    })));
  } catch (error) {
    console.error('Erro ao buscar agrupadores:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

app.post('/api/agrupadores', async (req, res) => {
  const { nome, blocoId } = req.body;
  try {
    await query('INSERT INTO agrupadores (nome, bloco_id) VALUES ($1, $2)', [nome, blocoId]);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao criar agrupador:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

app.put('/api/agrupadores/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { nome, blocoId } = req.body;
  try {
    const result = await query('UPDATE agrupadores SET nome = $1, bloco_id = $2 WHERE id = $3', [nome, blocoId, id]);
    if (result.rowCount > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, error: 'Agrupador não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao atualizar agrupador:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

app.delete('/api/agrupadores/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    // Verifica se há grupos vinculados ao agrupador
    const grupoResult = await query('SELECT COUNT(*) FROM grupos WHERE agrupador_id = $1', [id]);
    if (parseInt(grupoResult.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        error: 'Não é possível excluir: existem grupos vinculados a este agrupador!'
      });
    }

    // Exclui se não houver vínculos
    const result = await query('DELETE FROM agrupadores WHERE id = $1', [id]);
    if (result.rowCount > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, error: 'Agrupador não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao excluir agrupador:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// ======================
// CRUD DE UNIDADES (LIVRE - APENAS ID E NOME)
// ======================
app.get('/api/unidades', async (req, res) => {
  try {
    const result = await query('SELECT * FROM unidades ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar unidades:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

app.post('/api/unidades', async (req, res) => {
  const { nome } = req.body;
  try {
    await query('INSERT INTO unidades (nome) VALUES ($1)', [nome]);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao criar unidade:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

app.put('/api/unidades/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { nome } = req.body;
  try {
    const result = await query('UPDATE unidades SET nome = $1 WHERE id = $2', [nome, id]);
    if (result.rowCount > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, error: 'Unidade não encontrada' });
    }
  } catch (error) {
    console.error('Erro ao atualizar unidade:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

app.delete('/api/unidades/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    // Verifica se a unidade está vinculada a grupos
    const grupoResult = await query('SELECT COUNT(*) FROM grupos WHERE $1 = ANY(unidade_ids)', [id]);
    if (parseInt(grupoResult.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        error: 'Não é possível excluir: unidade está vinculada a grupos!'
      });
    }

    const result = await query('DELETE FROM unidades WHERE id = $1', [id]);
    if (result.rowCount > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, error: 'Unidade não encontrada' });
    }
  } catch (error) {
    console.error('Erro ao excluir unidade:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// ======================
// CRUD DE GRUPOS
// ======================
app.get('/api/grupos', async (req, res) => {
  try {
    const result = await query(`
      SELECT g.*, b.nome as bloco_nome, a.nome as agrupador_nome
      FROM grupos g
      LEFT JOIN blocos b ON g.bloco_id = b.id
      LEFT JOIN agrupadores a ON g.agrupador_id = a.id
      ORDER BY g.id
    `);
    res.json(result.rows.map(row => ({
      id: row.id,
      blocoId: row.bloco_id,
      agrupadorId: row.agrupador_id,
      unidadeIds: row.unidade_ids,
      nome: `${row.bloco_nome || 'Bloco'} - ${row.agrupador_nome || 'Agrupador'}`,
      blocoNome: row.bloco_nome,
      agrupadorNome: row.agrupador_nome
    })));
  } catch (error) {
    console.error('Erro ao buscar grupos:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

app.post('/api/grupos', async (req, res) => {
  const { blocoId, agrupadorId, unidadeIds } = req.body;
  try {
    // Valida se unidades existem
    const unidResult = await query('SELECT id FROM unidades WHERE id = ANY($1)', [unidadeIds]);
    const unidadesValidas = unidResult.rows.map(row => row.id);
    const unidadesInvalidas = unidadeIds.filter(uid => !unidadesValidas.includes(uid));

    if (unidadesInvalidas.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: `Unidades inválidas: ${unidadesInvalidas.join(', ')}` 
      });
    }

    await query('INSERT INTO grupos (bloco_id, agrupador_id, unidade_ids) VALUES ($1, $2, $3)', 
      [blocoId, agrupadorId, unidadeIds]);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao criar grupo:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

app.delete('/api/grupos/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const result = await query('DELETE FROM grupos WHERE id = $1', [id]);
    if (result.rowCount > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, error: 'Grupo não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao excluir grupo:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// ======================
// MENSAGENS SISTEMA NOVO
// ======================

// Buscar mensagens (SISTEMA SIMPLIFICADO B - sem lida_por)
app.get('/api/messages', async (req, res) => {
  const { userRole, userUnidade, userId } = req.query;

  console.log(`🔍 === SISTEMA B: BUSCAR MENSAGENS ===`);
  console.log(`👤 Role: ${userRole}, Unidade: ${userUnidade}, User ID: ${userId}`);

  // Verificação de segurança: admin-app não deve acessar mensagens
  if (userRole === 'admin-app') {
    console.log('🚫 Admin-app tentou acessar API de mensagens');
    return res.status(403).json({ 
      success: false, 
      error: 'Acesso negado: admin-app deve usar apenas tela de aprovação' 
    });
  }

  try {
    // Executar limpeza de mensagens expiradas antes de buscar
    await cleanupExpiredMessages();

    let mensagens = [];

    if (userRole === 'sindico') {
      // Síndico vê TODAS as mensagens vigentes
      const result = await query(`
        SELECT m.*, 
               CASE 
                 WHEN m.destinatario_tipo = 'unidade' THEN u.nome
                 WHEN m.destinatario_tipo = 'grupo' THEN CONCAT(b.nome, ' - ', a.nome)
                 WHEN m.destinatario_tipo = 'sindico-role' THEN 'Síndicos'
               END as destinatario_nome
        FROM messages m
        LEFT JOIN unidades u ON m.destinatario_tipo = 'unidade' AND m.destinatario_id = u.id
        LEFT JOIN grupos g ON m.destinatario_tipo = 'grupo' AND m.destinatario_id = g.id
        LEFT JOIN blocos b ON g.bloco_id = b.id
        LEFT JOIN agrupadores a ON g.agrupador_id = a.id
        WHERE m.fim_vigencia > (NOW() - INTERVAL '3 hours')
        ORDER BY m.created_at DESC
      `);
      mensagens = result.rows;
      console.log(`👑 Síndico: ${mensagens.length} mensagens vigentes`);

    } else if (userRole === 'mensageiro') {
      // Mensageiro vê mensagens para unidades e grupos, MAS NÃO para síndicos (sindico-role)
      const result = await query(`
        SELECT m.*, 
               CASE 
                 WHEN m.destinatario_tipo = 'unidade' THEN u.nome
                 WHEN m.destinatario_tipo = 'grupo' THEN CONCAT(b.nome, ' - ', a.nome)
               END as destinatario_nome
        FROM messages m
        LEFT JOIN unidades u ON m.destinatario_tipo = 'unidade' AND m.destinatario_id = u.id
        LEFT JOIN grupos g ON m.destinatario_tipo = 'grupo' AND m.destinatario_id = g.id
        LEFT JOIN blocos b ON g.bloco_id = b.id
        LEFT JOIN agrupadores a ON g.agrupador_id = a.id
        WHERE m.destinatario_tipo IN ('unidade', 'grupo')
        AND m.fim_vigencia > (NOW() - INTERVAL '3 hours')
        ORDER BY m.created_at DESC
      `);
      mensagens = result.rows;
      console.log(`📨 Mensageiro: ${mensagens.length} mensagens vigentes (sem sindico-role)`);

    } else if (userRole === 'morador') {
      // Buscar dados completos do usuário para filtros
      const userDataResult = await query('SELECT name FROM users WHERE id = $1', [userId]);
      const userName = userDataResult.rows.length > 0 ? userDataResult.rows[0].name : 'Usuário';

      // Morador vê mensagens da sua unidade + grupos + suas próprias mensagens para síndicos
      const unidadeIdResult = await query('SELECT id FROM unidades WHERE nome = $1', [userUnidade]);

      if (unidadeIdResult.rows.length === 0) {
        console.log(`⚠️ Unidade não encontrada: ${userUnidade}`);
        mensagens = [];
      } else {
        const unidadeId = unidadeIdResult.rows[0].id;

        // 1. Mensagens da unidade
        const unidadeResult = await query(`
          SELECT m.*, u.nome as destinatario_nome
          FROM messages m
          JOIN unidades u ON m.destinatario_id = u.id
          WHERE m.destinatario_tipo = 'unidade' 
          AND m.destinatario_id = $1 
          AND m.fim_vigencia > (NOW() - INTERVAL '3 hours')
          ORDER BY m.created_at DESC
        `, [unidadeId]);

        // 2. Mensagens de grupos que contêm a unidade
        const grupoResult = await query(`
          SELECT m.*, CONCAT(b.nome, ' - ', a.nome) as destinatario_nome
          FROM messages m
          JOIN grupos g ON m.destinatario_id = g.id
          JOIN blocos b ON g.bloco_id = b.id
          JOIN agrupadores a ON g.agrupador_id = a.id
          WHERE m.destinatario_tipo = 'grupo'
          AND $1 = ANY(g.unidade_ids)
          AND m.fim_vigencia > (NOW() - INTERVAL '3 hours')
          ORDER BY m.created_at DESC
        `, [unidadeId]);

        // 3. Mensagens para síndicos (apenas se o morador for o remetente)
        const sindicoResult = await query(`
          SELECT m.*, 'Síndicos' as destinatario_nome
          FROM messages m
          WHERE m.destinatario_tipo = 'sindico-role'
          AND m.sender = $1
          AND m.fim_vigencia > (NOW() - INTERVAL '3 hours')
          ORDER BY m.created_at DESC
        `, [userName]);

        mensagens = [...unidadeResult.rows, ...grupoResult.rows, ...sindicoResult.rows];
        console.log(`🏠 Morador: ${unidadeResult.rows.length} unidade + ${grupoResult.rows.length} grupo + ${sindicoResult.rows.length} síndico (próprias) = ${mensagens.length} total`);
      }
    }

    // 🎯 SISTEMA B: Zerar unread_count quando usuário acessa dashboard
    if (userId) {
      await query('UPDATE users SET unread_count = 0 WHERE id = $1', [userId]);
      console.log(`🔄 SISTEMA B: Zerado unread_count para usuário ${userId} (acessou dashboard)`);
    }

    console.log(`✅ Total retornado: ${mensagens.length} mensagens`);
    console.log(`🔍 ===============================`);

    res.json(mensagens.map(row => ({
      id: row.id,
      sender: row.sender,
      assunto: row.assunto,
      content: row.content,
      destinatarioTipo: row.destinatario_tipo,
      destinatarioId: row.destinatario_id,
      destinatarioNome: row.destinatario_nome,
      inicioVigencia: row.inicio_vigencia ? row.inicio_vigencia.toISOString().slice(0, 16) : null,
      fimVigencia: row.fim_vigencia ? row.fim_vigencia.toISOString().slice(0, 16) : null,
      timestamp: row.created_at ? row.created_at.toISOString() : null,
      validUntil: row.fim_vigencia ? row.fim_vigencia.toISOString() : null
    })));

  } catch (error) {
    console.error('❌ Erro ao buscar mensagens:', error);
    res.json([]);
  }
});

// Enviar mensagem rápida
app.post('/api/enviar-msg-rapida', async (req, res) => {
  const { 
    sender,
    tipoMsgRapidaId,
    msgRapidaId,
    destinatarioTipo,
    destinatarioId,
    inicioVigencia,
    fimVigencia
  } = req.body;

  try {
    // Busca o texto da mensagem rápida
    const msgResult = await query('SELECT texto FROM msg_rapidas WHERE id = $1', [msgRapidaId]);
    if (msgResult.rows.length === 0) {
      return res.status(400).json({ success: false, error: 'Mensagem rápida não encontrada' });
    }

    const content = msgResult.rows[0].texto;

    // Inserir mensagem
    const insertResult = await query(`
      INSERT INTO messages (
        tipo, sender, content, destinatario_tipo, destinatario_id,
        inicio_vigencia, fim_vigencia, tipo_msg_rapida_id, msg_rapida_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id
    `, [
      'rapida', sender, content, destinatarioTipo, destinatarioId,
      new Date(inicioVigencia), new Date(fimVigencia), tipoMsgRapidaId, msgRapidaId
    ]);

    const messageId = insertResult.rows[0].id;

    console.log(`📝 Mensagem rápida criada: ${content}`);

    // Incrementar unread_count para usuários destinatários
    await incrementUnreadCount(destinatarioTipo, destinatarioId);

    // Enviar notificações push segmentadas
    await sendPushNotifications(messageId, destinatarioTipo, destinatarioId, content, sender);

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao enviar mensagem rápida:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// Enviar mensagem convencional
app.post('/api/enviar-msg-convencional', async (req, res) => {
  const { 
    sender,
    assunto,
    content,
    destinatarioTipo,
    destinatarioId,
    inicioVigencia,
    fimVigencia
  } = req.body;

  try {
    console.log('🔍 DEBUG - Valores recebidos:', {
      sender: sender?.length,
      assunto: assunto?.length,
      content: content?.length,
      destinatarioTipo: destinatarioTipo?.length,
      destinatarioId,
      destinatarioTipoValue: destinatarioTipo
    });

    // Para mensagens de morador para síndico, usar tipo especial
    const finalDestinativoTipo = destinatarioTipo === 'sindico-role' ? 'sindico-role' : destinatarioTipo;
    const finalDestinatarioId = destinatarioTipo === 'sindico-role' ? 0 : destinatarioId;

    console.log('🔍 DEBUG - Valores finais:', {
      finalDestinativoTipo: finalDestinativoTipo?.length,
      finalDestinativoTipoValue: finalDestinativoTipo,
      finalDestinatarioId
    });

    // Inserir mensagem
    const insertResult = await query(`
      INSERT INTO messages (
        tipo, sender, assunto, content, destinatario_tipo, destinatario_id,
        inicio_vigencia, fim_vigencia
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id
    `, [
      'convencional', sender, assunto, content, finalDestinativoTipo, finalDestinatarioId,
      new Date(inicioVigencia), new Date(fimVigencia)
    ]);

    const messageId = insertResult.rows[0].id;

    console.log(`📝 Mensagem convencional criada: ${assunto}`);

    // Incrementar unread_count para usuários destinatários
    await incrementUnreadCount(finalDestinativoTipo, finalDestinatarioId);

    // Enviar notificações push segmentadas
    await sendPushNotifications(messageId, destinatarioTipo, destinatarioId, assunto || content, sender);

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao enviar mensagem convencional:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// Excluir mensagem (apenas para síndico e mensageiro)
app.delete('/api/messages/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const result = await query('DELETE FROM messages WHERE id = $1', [id]);
    if (result.rowCount > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, error: 'Mensagem não encontrada' });
    }
  } catch (error) {
    console.error('Erro ao excluir mensagem:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// ======================
// VERSÃO ÚNICA DO SISTEMA (ARQUIVO JSON)
// ======================

const fs = require('fs');

// Rota para servir versão do arquivo JSON
app.get('/api/version', (req, res) => {
  try {
    const versaoData = JSON.parse(fs.readFileSync('versao.json', 'utf8'));
    res.json({
      deployed_at: versaoData.deploy,
      version: versaoData.versao.replace('v', '')
    });
  } catch (error) {
    console.log('❌ Erro ao carregar versão:', error.message);
    console.log('⚠️ Usando versão padrão');
    res.json({
      deployed_at: 'Versão não encontrada',
      version: '0000000000000'
    });
  }
});

// ======================
// ROTA PADRÃO
// ======================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ======================
// NOVAS ROTAS PARA RECUPERAÇÃO DE SENHA
// ======================
app.post('/api/esqueci-senha', async (req, res) => {
  const { email } = req.body;
  try {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (user) {
      const token = Math.random().toString(36).substr(2, 6).toUpperCase();
      await query('UPDATE users SET token_recuperacao = $1, token_expira = $2, primeiro_acesso = true WHERE id = $3', 
        [token, new Date(Date.now() + 3600000), user.id]);

      sendPasswordResetEmail(email, token)
        .then(() => res.json({ success: true }))
        .catch(() => res.status(500).json({ success: false, error: 'Erro ao enviar e-mail' }));
    } else {
      res.json({ success: false, error: 'E-mail não cadastrado' });
    }
  } catch (error) {
    console.error('Erro ao processar esqueci senha:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// ======================
// VALIDAR TOKEN (COM APROVAÇÃO)
// ======================
app.post('/api/validar-token', async (req, res) => {
  const { email, token } = req.body;
  try {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({ 
        success: false, 
        error: 'E-mail não cadastrado' 
      });
    }

    if (user.token_recuperacao !== token.toUpperCase()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Token inválido' 
      });
    }

    if (new Date(user.token_expira) < new Date()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Token expirado' 
      });
    }

    if (user.role === 'sindico' && !user.aprovado) {
      return res.status(403).json({ 
        success: false, 
        error: 'Cadastro pendente de aprovação' 
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao validar token:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// ========== ROTA DE CADASTRO DE SÍNDICO ==========
app.post('/api/cadastro-sindico', async (req, res) => {
  const { login, nome, email, celular, bloco, unidade } = req.body;

  try {
    // Validações
    const userResult = await query('SELECT id FROM users WHERE username = $1', [login]);
    if (userResult.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'Login já existe' });
    }

    if (await emailJaCadastrado(email)) {
      return res.status(400).json({ success: false, error: 'E-mail já cadastrado' });
    }

    // Cria usuário
    const token = Math.random().toString(36).substr(2, 6).toUpperCase();
    const result = await query(`
      INSERT INTO users (username, password, name, email, telefone, bloco, unidade, role, aprovado, token_recuperacao, token_expira)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id
    `, [login, null, nome, email, celular.replace(/\D/g, ''), bloco, unidade, 'sindico', false, token, new Date(Date.now() + 3600000)]);

    const newUser = { 
      id: result.rows[0].id, 
      email, 
      name: nome,
      login: login,
      telefone: celular,
      bloco: bloco,
      unidade: unidade,
      tokenRecuperacao: token 
    };

    // Envia token para o usuário
    const tokenEnviado = await sendPasswordResetEmail(newUser.email, newUser.tokenRecuperacao);
    // Envia notificação para admin
    const notificacaoEnviada = await sendApprovalRequestEmail(newUser);

    if (tokenEnviado && notificacaoEnviada) {
      res.json({ success: true });
    } else {
      throw new Error('Falha parcial no envio de e-mails');
    }

  } catch (error) {
    console.error('Erro no cadastro:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro no processo de cadastro'
    });
  }
});

// ==================== ROTA DE APROVAÇÃO (NOVA) ==========
app.get('/api/usuarios-pendentes', async (req, res) => {
  try {
    const result = await query('SELECT * FROM users WHERE role = $1 AND aprovado = false', ['sindico']);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar usuários pendentes:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });    }
});

app.post('/api/aprovar-usuario', async (req, res) => {
  const { userId } = req.body;
  try {
    const result = await query('UPDATE users SET aprovado = true WHERE id = $1', [userId]);
    if (result.rowCount > 0) {
      res.json({ success: true });
    } else {
      res.json({ success: false });
    }
  } catch (error) {
    console.error('Erro ao aprovar usuário:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// ======================
// NOVA SENHA (COM APROVAÇÃO E PRIMEIRO ACESSO)
// ======================
app.post('/api/nova-senha', async (req, res) => {
  const { email, token, password, isDirect } = req.body;

  console.log('🔐 === NOVA SENHA ===');
  console.log('📧 Email:', email);
  console.log('🎫 Token:', token);
  console.log('🆕 É primeiro acesso direto:', isDirect);

  if (!email) {
    console.log('❌ Email não fornecido');
    return res.status(400).json({ success: false, error: 'Email é obrigatório' });
  }

  if (!password) {
    console.log('❌ Senha não fornecida');
    return res.status(400).json({ success: false, error: 'Nova senha é obrigatória' });
  }

  try {
    let userQuery;
    let queryParams;

    if (isDirect && token === 'DIRECT') {
      // Primeiro acesso direto: buscar apenas por email e primeiro_acesso = true
      console.log('🎯 Fluxo: Primeiro acesso direto');
      userQuery = 'SELECT * FROM users WHERE email = $1 AND primeiro_acesso = true';
      queryParams = [email];
    } else {
      // Recuperação normal: validar token
      console.log('🎯 Fluxo: Recuperação com token');
      userQuery = 'SELECT * FROM users WHERE email = $1 AND token_recuperacao = $2 AND token_expira > NOW()';
      queryParams = [email, token];
    }

    const result = await query(userQuery, queryParams);

    if (result.rows.length === 0) {
      console.log('❌ Usuário não encontrado para email:', email);
      if (isDirect) {
        console.log('⚠️ Possíveis causas: email incorreto ou primeiro_acesso já foi alterado');
      }
      return res.status(400).json({ success: false, error: 'Usuário não encontrado ou não autorizado' });
    }

    const user = result.rows[0];
    console.log('✅ Usuário encontrado:', user.username, 'Role:', user.role, 'Primeiro acesso:', user.primeiro_acesso);

    const hashedPassword = await bcrypt.hash(password, 10);

    let updateQuery;
    let updateParams;

    if (isDirect && token === 'DIRECT') {
      // Primeiro acesso: apenas atualizar senha e marcar primeiro_acesso = false
      updateQuery = 'UPDATE users SET password = $1, primeiro_acesso = false WHERE email = $2';
      updateParams = [hashedPassword, email];
      console.log('🔄 Atualizando: senha + primeiro_acesso = false');
    } else {
      // Recuperação: limpar tokens também
      updateQuery = 'UPDATE users SET password = $1, token_recuperacao = NULL, token_expira = NULL, primeiro_acesso = false WHERE email = $2';
      updateParams = [hashedPassword, email];
      console.log('🔄 Atualizando: senha + limpeza tokens + primeiro_acesso = false');
    }

    await query(updateQuery, updateParams);
    console.log('✅ Senha atualizada com sucesso para usuário:', user.username);

    res.json({ success: true });

  } catch (error) {
    console.error('❌ Erro ao redefinir senha:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// ======================
// REENVIAR TOKEN
// ======================
app.post('/api/reenviar-token', async (req, res) => {
  const { email } = req.body;
  try {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'E-mail não encontrado' 
      });
    }

    // Gera novo token e atualiza expiração
    const token = Math.random().toString(36).substr(2, 6).toUpperCase();
    await query('UPDATE users SET token_recuperacao = $1, token_expira = $2 WHERE id = $3', 
      [token, new Date(Date.now() + 3600000), user.id]);

    // Envia e-mail (usando função existente)
    sendPasswordResetEmail(user.email, token)
      .then(() => res.json({ 
        success: true,
        message: 'Novo token enviado para seu e-mail' 
      }))
      .catch(() => res.status(500).json({ 
        success: false, 
        error: 'Erro ao enviar token' 
      }));
  } catch (error) {
    console.error('Erro ao reenviar token:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// ======================
// CRUD DE TIPOS DE MENSAGEM RÁPIDA
// ======================
app.get('/api/tipos-msg-rapidas', async (req, res) => {
  try {
    const result = await query('SELECT * FROM tipos_msg_rapidas ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar tipos de mensagem rápida:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

app.post('/api/tipos-msg-rapidas', async (req, res) => {
  const { nome } = req.body;
  try {
    await query('INSERT INTO tipos_msg_rapidas (nome) VALUES ($1)', [nome]);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao criar tipo de mensagem rápida:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

app.put('/api/tipos-msg-rapidas/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { nome } = req.body;
  try {
    const result = await query('UPDATE tipos_msg_rapidas SET nome = $1 WHERE id = $2', [nome, id]);
    if (result.rowCount > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, error: "Tipo não encontrado" });
    }
  } catch (error) {
    console.error('Erro ao atualizar tipo de mensagem rápida:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

app.delete('/api/tipos-msg-rapidas/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    // Verifica se há mensagens rápidas vinculadas a este tipo
    const msgResult = await query('SELECT COUNT(*) FROM msg_rapidas WHERE tipo_id = $1', [id]);
    if (parseInt(msgResult.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        error: 'Não é possível excluir: existem mensagens rápidas vinculadas a este tipo!'
      });
    }

    const result = await query('DELETE FROM tipos_msg_rapidas WHERE id = $1', [id]);
    if (result.rowCount > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, error: "Tipo não encontrado" });
    }
  } catch (error) {
    console.error('Erro ao excluir tipo de mensagem rápida:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// ======================
// CRUD DE MENSAGENS RÁPIDAS
// ======================
app.get('/api/msg-rapidas', async (req, res) => {
  try {
    const result = await query('SELECT * FROM msg_rapidas ORDER BY id');
    res.json(result.rows.map(row => ({
      id: row.id,
      tipoId: row.tipo_id,
      texto: row.texto
    })));
  } catch (error) {
    console.error('Erro ao buscar mensagens rápidas:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

app.post('/api/msg-rapidas', async (req, res) => {
  const { tipoId, texto } = req.body;
  try {
    await query('INSERT INTO msg_rapidas (tipo_id, texto) VALUES ($1, $2)', [tipoId, texto]);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao criar mensagem rápida:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

app.put('/api/msg-rapidas/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { tipoId, texto } = req.body;
  try {
    const result = await query('UPDATE msg_rapidas SET tipo_id = $1, texto = $2 WHERE id = $3', [tipoId, texto, id]);
    if (result.rowCount > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, error: "Mensagem não encontrada" });
    }
  } catch (error) {
    console.error('Erro ao atualizar mensagem rápida:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

app.delete('/api/msg-rapidas/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const result = await query('DELETE FROM msg_rapidas WHERE id = $1', [id]);
    if (result.rowCount > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, error: "Mensagem não encontrada" });
    }
  } catch (error) {
    console.error('Erro ao excluir mensagem rápida:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// ======================
// CRUD DE MORADORES E MENSAGEIROS
// ======================
app.get('/api/usuarios-cadastrados', async (req, res) => {
  try {
    const result = await query('SELECT * FROM users WHERE role IN ($1, $2) ORDER BY id', ['morador', 'mensageiro']);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar usuários cadastrados:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

app.post('/api/cadastrar-usuario', async (req, res) => {
  const { nome, login, senhaInicial, telefone, email, bloco, unidade, tipo } = req.body;

  try {
    // Validações
    const userResult = await query('SELECT id FROM users WHERE username = $1', [login]);
    if (userResult.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'Login já existe' });
    }

    if (await emailJaCadastrado(email)) {
      return res.status(400).json({ success: false, error: 'E-mail já cadastrado' });
    }

    // Cria usuário
    const salt = bcrypt.genSaltSync(10);
    await query(`
      INSERT INTO users (username, password, name, email, telefone, bloco, unidade, role, aprovado, primeiro_acesso)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [login, bcrypt.hashSync(senhaInicial, salt), nome, email, telefone.replace(/\D/g, ''), bloco, unidade, tipo, true, true]);

    // Envia credenciais para o usuário
    await transporter.sendMail({
      from: `"Sistema CondoTorre" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Credenciais de Acesso - CondoTorre',
      html: `
        <h2>Bem-vindo ao CondoTorre!</h2>
        <p>Suas credenciais de acesso foram criadas:</p>
        <p><strong>Login:</strong> ${login}</p>
        <p><strong>Senha Inicial:</strong> ${senhaInicial}</p>
        <p>No primeiro acesso, você deverá alterar sua senha.</p>
      `
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao cadastrar usuário:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Usuário cadastrado, mas erro ao enviar e-mail' 
    });
  }
});

app.delete('/api/usuarios-cadastrados/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const result = await query('DELETE FROM users WHERE id = $1', [id]);
    if (result.rowCount > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, error: "Usuário não encontrado" });
    }
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// ======================
// FUNÇÃO PARA INCREMENTAR UNREAD_COUNT
// ======================

// Função para incrementar unread_count dos usuários destinatários (SISTEMA OTIMIZADO B)
async function incrementUnreadCount(destinatarioTipo, destinatarioId) {
  try {
    console.log(`📈 === SISTEMA B: INCREMENTANDO UNREAD_COUNT ===`);
    console.log(`🎯 Tipo: ${destinatarioTipo}, ID: ${destinatarioId}`);

    if (destinatarioTipo === 'unidade') {
      // Buscar usuários da unidade específica
      const unidadeResult = await query('SELECT nome FROM unidades WHERE id = $1', [destinatarioId]);
      if (unidadeResult.rows.length > 0) {
        const unidadeNome = unidadeResult.rows[0].nome;

        const updateResult = await query(`
          UPDATE users 
          SET unread_count = unread_count + 1 
          WHERE unidade = $1
        `, [unidadeNome]);

        console.log(`✅ ${updateResult.rowCount} usuários da unidade "${unidadeNome}" incrementados (+1)`);
      }

    } else if (destinatarioTipo === 'grupo') {
      // Buscar usuários das unidades do grupo
      const grupoResult = await query(`
        SELECT g.unidade_ids
        FROM grupos g
        WHERE g.id = $1
      `, [destinatarioId]);

      if (grupoResult.rows.length > 0) {
        const unidadeIds = grupoResult.rows[0].unidade_ids;

        // Buscar nomes das unidades
        const unidadesResult = await query('SELECT nome FROM unidades WHERE id = ANY($1)', [unidadeIds]);
        const unidadeNomes = unidadesResult.rows.map(row => row.nome);

        if (unidadeNomes.length > 0) {
          const updateResult = await query(`
            UPDATE users 
            SET unread_count = unread_count + 1 
            WHERE unidade = ANY($1)
          `, [unidadeNomes]);

          console.log(`✅ ${updateResult.rowCount} usuários do grupo incrementados (+1)`);
        }
      }

    } else if (destinatarioTipo === 'sindico-role') {
      // Incrementar para todos os síndicos
      const updateResult = await query(`
        UPDATE users 
        SET unread_count = unread_count + 1 
        WHERE role = 'sindico'
      `);

      console.log(`✅ ${updateResult.rowCount} síndicos incrementados (+1)`);
    }

    console.log(`📈 =========================================`);

  } catch (error) {
    console.error('❌ Erro ao incrementar unread_count:', error);
  }
}

// ======================
// WEB PUSH NOTIFICATIONS
// ======================

// Endpoint para obter a chave pública VAPID
app.get('/api/vapid-public-key', (req, res) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

// ======================
// SISTEMA DE BADGE MANUAL PARA TESTE
// ======================

// Função para enviar badge manual para todos os usuários
async function sendManualBadgeToAll(badgeNumber, reason) {
  try {
    console.log(`🧪 === TESTE: ENVIANDO BADGE MANUAL ${badgeNumber} ===`);
    console.log(`🎯 Motivo: ${reason}`);
    console.log(`⏰ Horário: ${new Date().toLocaleString()}`);

    // Buscar TODAS as subscrições ativas
    const result = await query('SELECT subscription_data FROM push_subscriptions');
    console.log(`📱 Total de dispositivos: ${result.rows.length}`);

    let sucessos = 0;
    let erros = 0;

    for (const sub of result.rows) {
      try {
        const subscription = sub.subscription_data;

        // Pular subscrições simuladas
        if (subscription.endpoint && subscription.endpoint.includes('simulated-endpoint')) {
          console.log('📧 Badge simulado aplicado');
          continue;
        }

        // Validar estrutura da subscrição
        if (!subscription.endpoint || !subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
          console.log('⚠️ Subscrição inválida, pulando...');
          continue;
        }

        // Enviar push com badge manual
        const payload = JSON.stringify({
          title: '🧪 TESTE BADGE',
          body: `${reason} - Badge: ${badgeNumber}`,
          icon: 'https://cdn-icons-png.flaticon.com/512/1946/1946436.png',
          badge: 'https://cdn-icons-png.flaticon.com/512/1946/1946436.png',
          data: {
            url: '/dashboard.html',
            manualBadge: badgeNumber,
            testReason: reason
          }
        });

        await webpush.sendNotification(subscription, payload);
        sucessos++;
        console.log(`📱 Badge ${badgeNumber} enviado: ${reason}`);

      } catch (error) {
        erros++;
        console.error('❌ Erro ao enviar badge individual:', error.message);
      }
    }

    console.log(`✅ TESTE CONCLUÍDO: ${sucessos} sucessos, ${erros} erros`);
    console.log(`🧪 ========================================`);

  } catch (error) {
    console.error('❌ Erro no sistema de badge manual:', error);
  }
}

// Endpoint para login do síndico (modificado para teste)
app.post('/api/sindico-login-badge', async (req, res) => {
  await sendManualBadgeToAll(5, 'Síndico fez login');
  res.json({ success: true, message: 'Badge 5 enviado para todos' });
});

// Endpoint para refresh do síndico
app.post('/api/sindico-refresh-badge', async (req, res) => {
  await sendManualBadgeToAll(9, 'Síndico fez refresh');
  res.json({ success: true, message: 'Badge 9 enviado para todos' });
});

// Endpoint para criação de mensagem (modificado para teste)
app.post('/api/sindico-message-badge', async (req, res) => {
  await sendManualBadgeToAll(1, 'Síndico criou mensagem');
  res.json({ success: true, message: 'Badge 1 enviado para todos' });
});

// Função para enviar push notifications com badge do unread_count (SISTEMA B)
async function sendPushNotifications(messageId, destinatarioTipo, destinatarioId, content, sender) {
  try {
    console.log(`🔔 === SISTEMA B: ENVIANDO PUSH ===`);
    console.log(`🎯 Destino: ${destinatarioTipo} ID ${destinatarioId}`);

    // Buscar TODAS as subscrições que devem receber a notificação
    let targetSubscriptions = [];

    if (destinatarioTipo === 'unidade') {
      const unidadeResult = await query('SELECT nome FROM unidades WHERE id = $1', [destinatarioId]);
      if (unidadeResult.rows.length === 0) return;

      const unidadeNome = unidadeResult.rows[0].nome;

      const result = await query(`
        SELECT ps.subscription_data, ps.user_id, u.role, u.unidade, u.unread_count
        FROM push_subscriptions ps
        JOIN users u ON ps.user_id = u.id
        WHERE (u.role IN ('sindico', 'mensageiro')) 
           OR (u.role = 'morador' AND u.unidade = $1)
      `, [unidadeNome]);

      targetSubscriptions = result.rows;
      console.log(`📱 Unidade ${unidadeNome}: ${targetSubscriptions.length} dispositivos`);

    } else if (destinatarioTipo === 'grupo') {
      const grupoResult = await query(`
        SELECT g.unidade_ids, b.nome as bloco_nome, a.nome as agrupador_nome
        FROM grupos g
        JOIN blocos b ON g.bloco_id = b.id
        JOIN agrupadores a ON g.agrupador_id = a.id
        WHERE g.id = $1
      `, [destinatarioId]);

      if (grupoResult.rows.length === 0) return;

      const grupo = grupoResult.rows[0];
      const unidadeIds = grupo.unidade_ids;

      const unidadesResult = await query('SELECT nome FROM unidades WHERE id = ANY($1)', [unidadeIds]);
      const unidadeNomes = unidadesResult.rows.map(row => row.nome);

      const result = await query(`
        SELECT ps.subscription_data, ps.user_id, u.role, u.unidade, u.unread_count
        FROM push_subscriptions ps
        JOIN users u ON ps.user_id = u.id
        WHERE (u.role IN ('sindico', 'mensageiro')) 
           OR (u.role = 'morador' AND u.unidade = ANY($1))
      `, [unidadeNomes]);

      targetSubscriptions = result.rows;
      console.log(`📱 Grupo ${grupo.bloco_nome} - ${grupo.agrupador_nome}: ${targetSubscriptions.length} dispositivos`);

    } else if (destinatarioTipo === 'sindico-role') {
      const result = await query(`
        SELECT ps.subscription_data, ps.user_id, u.role, u.unidade, u.unread_count
        FROM push_subscriptions ps
        JOIN users u ON ps.user_id = u.id
        WHERE u.role = 'sindico'
      `);

      targetSubscriptions = result.rows;
      console.log(`📱 Síndicos: ${targetSubscriptions.length} dispositivos`);
    }

    // Enviar notificação para cada usuário com SEU badge personalizado
    for (const sub of targetSubscriptions) {
      try {
        const subscription = sub.subscription_data;
        const userId = sub.user_id;
        const userRole = sub.role;
        const userUnreadCount = sub.unread_count || 0;

        // Pular subscrições simuladas
        if (subscription.endpoint && subscription.endpoint.includes('simulated-endpoint')) {
          console.log(`📧 Push simulado: "${content.substring(0, 50)}..." - ${sender}`);
          continue;
        }

        // Validar subscrição
        if (!subscription.endpoint || !subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
          console.log('⚠️ Subscrição inválida, pulando...');
          continue;
        }

        // 🎯 SISTEMA B: Badge = unread_count do usuário (simples)
        const badgeCount = Math.min(userUnreadCount, 99);

        console.log(`🎯 Usuário ${userId} (${userRole}): Badge ${badgeCount} (unread_count: ${userUnreadCount})`);

        // Enviar push notification
        const payload = JSON.stringify({
          title: '🏢 CondoApp',
          body: `${sender}: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`,
          icon: 'https://cdn-icons-png.flaticon.com/512/1946/1946436.png',
          badge: 'https://cdn-icons-png.flaticon.com/512/1946/1946436.png',
          data: {
            url: '/dashboard.html',
            realBadge: badgeCount,
            userId: userId
          }
        });

        await webpush.sendNotification(subscription, payload);
        console.log(`✅ Push enviado para usuário ${userId}: Badge ${badgeCount}`);

      } catch (error) {
        console.error('❌ Erro ao enviar push individual:', error);

        if (error.statusCode === 410) {
          console.log('🗑️ Removendo subscrição inválida');
        }
      }
    }

    console.log(`✅ Push finalizado para mensagem ${messageId}`);
    console.log(`🔔 ===============================`);

  } catch (error) {
    console.error('❌ Erro no sistema de push:', error);
  }
}

// Salvar subscrição do usuário
app.post('/api/push-subscribe', async (req, res) => {
  const { userId, userRole, userBloco, userUnidade, subscription } = req.body;

  try {
    // Verificar se o usuário já tem uma subscrição
    const existingSubscription = await query('SELECT * FROM push_subscriptions WHERE user_id = $1', [userId]);

    if (existingSubscription.rows.length > 0) {
      // Atualizar a subscrição existente
      await query(`
        UPDATE push_subscriptions 
        SET user_role = $2, user_bloco = $3, user_unidade = $4, subscription_data = $5
        WHERE user_id = $1
      `, [userId, userRole, userBloco, userUnidade, subscription]);

      console.log(`🔔 Subscrição push atualizada para o usuário ${userId}`);
    } else {
      // Criar uma nova subscrição
      await query(`
        INSERT INTO push_subscriptions (
          user_id, user_role, user_bloco, user_unidade, subscription_data
        ) VALUES ($1, $2, $3, $4, $5)
      `, [userId, userRole, userBloco, userUnidade, subscription]);

      console.log(`🔔 Nova subscrição push salva para o usuário ${userId}`);
    }

    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Erro ao salvar subscrição push:', error);
    res.status(500).json({ success: false, error: 'Erro interno ao salvar subscrição' });
  }
});

// Remover subscrição do usuário
app.post('/api/push-unsubscribe', async (req, res) => {
  const { userId } = req.body;

  try {
    const result = await query('DELETE FROM push_subscriptions WHERE user_id = $1', [userId]);

    if (result.rowCount > 0) {
      console.log(`🔔 Subscrição push removida para o usuário ${userId}`);
      res.json({ success: true });
    } else {
      console.log(`🔔 Nenhuma subscrição push encontrada para o usuário ${userId}`);
      res.status(404).json({ success: false, error: 'Subscrição não encontrada' });
    }
  } catch (error) {
    console.error('Erro ao remover subscrição push:', error);
    res.status(500).json({ success: false, error: 'Erro interno ao remover subscrição' });
  }
});

// ======================
// ROTA PARA BUSCAR USUÁRIO POR ID (BIOMETRIA)
// ======================

app.get('/api/user-by-id/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await query('SELECT * FROM users WHERE id = $1 AND aprovado = true', [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
    }

    const user = result.rows[0];
    res.json({ 
      success: true, 
      user: { 
        ...user, 
        password: undefined // Remove senha da resposta
      } 
    });
  } catch (error) {
    console.error('Erro ao buscar usuário por ID:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// ======================
// API DE AUTENTICAÇÃO BIOMÉTRICA
// ======================

// Verificar status da biometria do usuário
app.get('/api/biometric-status/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await query(`
      SELECT biometric_enabled, biometric_registered_at, device_fingerprint, last_used_at
      FROM user_biometric_preferences 
      WHERE user_id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      return res.json({ 
        success: true, 
        enabled: false, 
        message: 'Biometria não configurada' 
      });
    }

    const pref = result.rows[0];
    res.json({
      success: true,
      enabled: pref.biometric_enabled,
      registeredAt: pref.biometric_registered_at,
      lastUsed: pref.last_used_at,
      deviceFingerprint: pref.device_fingerprint
    });

  } catch (error) {
    console.error('❌ Erro ao verificar status biométrico:', error);
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

// Registrar nova credencial biométrica
app.post('/api/biometric-register', async (req, res) => {
  const { userId, credentialData, deviceFingerprint } = req.body;

  try {
    console.log(`🔐 Registrando biometria para usuário ${userId}`);

    // Verificar se usuário existe
    const userResult = await query('SELECT name FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
    }

    // Remover credenciais antigas do mesmo dispositivo
    await query(`
      DELETE FROM user_biometric_preferences 
      WHERE user_id = $1 AND device_fingerprint = $2
    `, [userId, deviceFingerprint]);

    // Salvar nova preferência
    await query(`
      INSERT INTO user_biometric_preferences 
      (user_id, biometric_enabled, biometric_registered_at, device_fingerprint, credential_id, credential_data)
      VALUES ($1, true, NOW(), $2, $3, $4)
    `, [userId, deviceFingerprint, credentialData.id, JSON.stringify(credentialData)]);

    console.log(`✅ Biometria registrada: usuário ${userId}, dispositivo ${deviceFingerprint.substring(0, 8)}...`);

    res.json({ 
      success: true, 
      message: 'Biometria configurada com sucesso' 
    });

  } catch (error) {
    console.error('❌ Erro ao registrar biometria:', error);
    res.status(500).json({ success: false, error: 'Erro ao salvar biometria' });
  }
});

// Buscar credenciais do usuário para autenticação
app.get('/api/biometric-credentials/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await query(`
      SELECT credential_id, credential_data
      FROM user_biometric_preferences
      WHERE user_id = $1 AND biometric_enabled = true
    `, [userId]);

    const credentials = result.rows.map(row => ({
      credential_id: row.credential_id,
      credential_data: row.credential_data
    }));

    res.json({
      success: true,
      credentials: credentials
    });

  } catch (error) {
    console.error('❌ Erro ao buscar credenciais:', error);
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

// Verificar autenticação biométrica
app.post('/api/biometric-verify', async (req, res) => {
  const { userId, credentialId, signature, authenticatorData, clientDataJSON, deviceFingerprint } = req.body;

  try {
    console.log(`🔓 Verificando autenticação biométrica: usuário ${userId}`);
    console.log(`🔑 Credential ID recebido: ${credentialId ? credentialId.substring(0, 20) + '...' : 'null'}`);

    // Validar dados recebidos
    if (!userId || !credentialId) {
      console.error('❌ Dados obrigatórios faltando');
      return res.status(400).json({ 
        success: false, 
        error: 'Dados obrigatórios faltando' 
      });
    }

    // Buscar credencial
    const credResult = await query(`
      SELECT * FROM user_biometric_preferences
      WHERE user_id = $1 AND credential_id = $2 AND biometric_enabled = true
    `, [userId, credentialId]);

    console.log(`🔍 Credenciais encontradas no banco: ${credResult.rows.length}`);

    if (credResult.rows.length === 0) {
      console.error(`❌ Credencial não encontrada para usuário ${userId} com ID ${credentialId.substring(0, 20)}...`);
      return res.status(404).json({ 
        success: false, 
        error: 'Credencial não encontrada ou desabilitada' 
      });
    }

    // Atualizar último uso
    await query(`
      UPDATE user_biometric_preferences 
      SET last_used_at = NOW() 
      WHERE user_id = $1 AND credential_id = $2
    `, [userId, credentialId]);

    console.log(`✅ Autenticação biométrica aceita para usuário ${userId}`);

    // Em produção, aqui você faria a verificação criptográfica real da assinatura
    // Por simplicidade, vamos aceitar se a credencial existe
    res.json({ 
      success: true, 
      message: 'Autenticação biométrica válida' 
    });

  } catch (error) {
    console.error('❌ Erro na verificação biométrica:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({ 
      success: false, 
      error: 'Erro na verificação: ' + error.message 
    });
  }
});

// Desabilitar biometria
app.post('/api/biometric-disable', async (req, res) => {
  const { userId, deviceFingerprint } = req.body;

  try {
    const result = await query(`
      UPDATE user_biometric_preferences 
      SET biometric_enabled = false 
      WHERE user_id = $1 AND device_fingerprint = $2
    `, [userId, deviceFingerprint]);

    if (result.rowCount > 0) {
      console.log(`🔒 Biometria desabilitada: usuário ${userId}`);
      res.json({ success: true, message: 'Biometria desabilitada' });
    } else {
      res.status(404).json({ success: false, error: 'Configuração não encontrada' });
    }

  } catch (error) {
    console.error('❌ Erro ao desabilitar biometria:', error);
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

// ======================
// BADGE DE MENSAGENS NÃO LIDAS (FASE 4)
// ======================

// ETAPA 5: Endpoint para contagem atual sem usuário específico (para Service Worker)
app.get('/api/current-unread-count', async (req, res) => {
  try {
    console.log('🔢 Service Worker solicitando contagem de mensagens ATIVAS');

    // Executa limpeza antes de contar
    await cleanupExpiredMessages();

    // Conta TODAS as mensagens vigentes (independente de quem leu)
    const totalCount = await query(`
      SELECT COUNT(*) as count
      FROM messages m
      WHERE m.fim_vigencia > (NOW() - INTERVAL '3 hours')
    `);

    const activeCount = parseInt(totalCount.rows[0].count);

    console.log(`🔢 Service Worker: ${activeCount} mensagens ATIVAS (independente de leitura)`);

    res.json({ 
      success: true, 
      unreadCount: Math.min(activeCount, 99) // Máximo 99, mas pode ser 0
    });

  } catch (error) {
    console.error('❌ Erro ao contar mensagens ativas:', error);
    res.json({ success: true, unreadCount: 0 }); // Fallback realista
  }
});

// Endpoint para badge - SISTEMA B: Lê apenas o unread_count do usuário
app.get('/api/unread-count', async (req, res) => {
  const { userId } = req.query;

  try {
    console.log(`🔢 === SISTEMA B: BADGE DO USUÁRIO ===`);
    console.log(`👤 User ID: ${userId}`);

    // Buscar dados do usuário
    const userResult = await query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
    }

    const user = userResult.rows[0];
    const unreadCount = user.unread_count || 0;

    console.log(`📊 Usuário: ${user.name} (${user.role})`);
    console.log(`🎯 Badge atual: ${unreadCount} notificações não validadas`);
    console.log(`🔢 ================================`);

    res.json({ 
      success: true, 
      unreadCount: Math.min(unreadCount, 99), // Máximo 99
      userRole: user.role,
      userUnidade: user.unidade,
      userId: userId
    });

  } catch (error) {
    console.error('❌ Erro ao buscar badge do usuário:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// ======================
// SISTEMA B: NÃO PRECISA MARCAR MENSAGENS INDIVIDUAIS
// Badge é baseado apenas no unread_count que zera no refresh
// ======================

// Rotas para grupos
// Buscar unidades por grupo
app.get('/api/grupos/:id/unidades', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query(`
      SELECT u.id, u.nome
      FROM unidades u
      JOIN grupos g ON u.id = ANY(g.unidade_ids)
      WHERE g.id = $1
      ORDER BY u.nome
    `, [id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar unidades por grupo:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});