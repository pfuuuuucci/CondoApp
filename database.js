const { Pool } = require('pg');

// Configuração do pool de conexões PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Função para executar queries
async function query(text, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

// Função para inicializar as tabelas
async function initializeTables() {
  const client = await pool.connect();
  try {
    // Tabela de usuários
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255),
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        telefone VARCHAR(15),
        bloco VARCHAR(50),
        unidade VARCHAR(50),
        role VARCHAR(20) NOT NULL,
        aprovado BOOLEAN DEFAULT false,
        primeiro_acesso BOOLEAN DEFAULT true,
        token_recuperacao VARCHAR(10),
        token_expira TIMESTAMP,
        unread_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Adicionar campo unread_count em tabelas existentes (se não existir)
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS unread_count INTEGER DEFAULT 0
    `);

    // Tabela de blocos
    await client.query(`
      CREATE TABLE IF NOT EXISTS blocos (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de agrupadores
    await client.query(`
      CREATE TABLE IF NOT EXISTS agrupadores (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        bloco_id INTEGER REFERENCES blocos(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de unidades
    await client.query(`
      CREATE TABLE IF NOT EXISTS unidades (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de grupos
    await client.query(`
      CREATE TABLE IF NOT EXISTS grupos (
        id SERIAL PRIMARY KEY,
        bloco_id INTEGER REFERENCES blocos(id) ON DELETE CASCADE,
        agrupador_id INTEGER REFERENCES agrupadores(id) ON DELETE CASCADE,
        unidade_ids INTEGER[] NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de tipos de mensagens rápidas (deve vir ANTES)
    await client.query(`
      CREATE TABLE IF NOT EXISTS tipos_msg_rapidas (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de mensagens rápidas (deve vir ANTES)
    await client.query(`
      CREATE TABLE IF NOT EXISTS msg_rapidas (
        id SERIAL PRIMARY KEY,
        tipo_id INTEGER REFERENCES tipos_msg_rapidas(id) ON DELETE CASCADE,
        texto TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de mensagens (SISTEMA B - sem lida_por)
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('rapida', 'convencional')),
        sender VARCHAR(100) NOT NULL,
        assunto VARCHAR(200),
        content TEXT NOT NULL,
        destinatario_tipo VARCHAR(15) NOT NULL CHECK (destinatario_tipo IN ('unidade', 'grupo', 'sindico-role')),
        destinatario_id INTEGER NOT NULL,
        inicio_vigencia TIMESTAMP NOT NULL,
        fim_vigencia TIMESTAMP NOT NULL,
        tipo_msg_rapida_id INTEGER REFERENCES tipos_msg_rapidas(id),
        msg_rapida_id INTEGER REFERENCES msg_rapidas(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // SISTEMA B: Manter apenas unread_count (remover lida_por se existir)
    await client.query(`
      ALTER TABLE messages 
      DROP COLUMN IF EXISTS lida_por
    `);

    // Tabela de subscrições push
    await client.query(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        user_role VARCHAR(20) NOT NULL,
        user_bloco VARCHAR(50),
        user_unidade VARCHAR(50),
        subscription_data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id)
      )
    `);

    // Tabela para chaves VAPID permanentes
    await client.query(`
      CREATE TABLE IF NOT EXISTS vapid_keys (
        id SERIAL PRIMARY KEY,
        public_key TEXT NOT NULL,
        private_key TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de preferências biométricas
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_biometric_preferences (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        biometric_enabled BOOLEAN DEFAULT false,
        biometric_registered_at TIMESTAMP,
        device_fingerprint TEXT NOT NULL,
        last_used_at TIMESTAMP,
        credential_id TEXT NOT NULL,
        credential_data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, device_fingerprint)
      )
    `);

    console.log('✅ Tabelas criadas/verificadas com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  query,
  initializeTables,
  pool
};