
const { query } = require('./database');

async function cleanupExpiredMessages() {
  try {
    console.log('🧹 Iniciando limpeza de mensagens expiradas...');
    
    const result = await query(`
      DELETE FROM messages 
      WHERE fim_vigencia < (NOW() - INTERVAL '3 hours')
    `);
    
    console.log(`✅ Limpeza concluída! ${result.rowCount} mensagens expiradas foram removidas.`);
    
    // Mostra estatísticas atuais
    const statsResult = await query(`
      SELECT 
        COUNT(*) as total_ativas,
        COUNT(CASE WHEN tipo = 'rapida' THEN 1 END) as rapidas_ativas,
        COUNT(CASE WHEN tipo = 'convencional' THEN 1 END) as convencionais_ativas
      FROM messages 
      WHERE fim_vigencia > (NOW() - INTERVAL '3 hours')
    `);
    
    const stats = statsResult.rows[0];
    console.log(`📊 Mensagens ativas restantes: ${stats.total_ativas} (${stats.rapidas_ativas} rápidas, ${stats.convencionais_ativas} convencionais)`);
    
  } catch (error) {
    console.error('❌ Erro na limpeza de mensagens:', error);
  } finally {
    // Só encerra o processo se executado diretamente
    if (require.main === module) {
      process.exit(0);
    }
  }
}

// Se executado diretamente
if (require.main === module) {
  cleanupExpiredMessages();
}

module.exports = { cleanupExpiredMessages };
