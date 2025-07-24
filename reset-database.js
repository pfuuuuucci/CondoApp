
const { query } = require('./database');

async function resetDatabase() {
  try {
    console.log('🧹 Iniciando limpeza do banco de dados...');

    // 1. Limpar tabelas que dependem de outras (ordem importante)
    await query('DELETE FROM push_subscriptions');
    console.log('✅ Tabela push_subscriptions limpa');

    await query('DELETE FROM messages');
    console.log('✅ Tabela messages limpa');

    await query('DELETE FROM grupos');
    console.log('✅ Tabela grupos limpa');

    await query('DELETE FROM msg_rapidas');
    console.log('✅ Tabela msg_rapidas limpa');

    await query('DELETE FROM tipos_msg_rapidas');
    console.log('✅ Tabela tipos_msg_rapidas limpa');

    await query('DELETE FROM agrupadores');
    console.log('✅ Tabela agrupadores limpa');

    await query('DELETE FROM blocos');
    console.log('✅ Tabela blocos limpa');

    await query('DELETE FROM unidades');
    console.log('✅ Tabela unidades limpa');

    await query('DELETE FROM vapid_keys');
    console.log('✅ Tabela vapid_keys limpa');

    // 2. Limpar usuários, mantendo apenas admin-app
    const result = await query("DELETE FROM users WHERE role != 'admin-app'");
    console.log(`✅ Removidos ${result.rowCount} usuários (mantido apenas admin-app)`);

    // 3. Verificar se admin-app ainda existe
    const adminCheck = await query("SELECT COUNT(*) FROM users WHERE role = 'admin-app'");
    const adminCount = parseInt(adminCheck.rows[0].count);

    if (adminCount === 0) {
      console.log('⚠️ AVISO: Nenhum admin-app encontrado! Você precisará recriar um administrador.');
    } else if (adminCount === 1) {
      console.log('✅ Admin-app preservado com sucesso');
    } else {
      console.log(`⚠️ AVISO: ${adminCount} admin-app encontrados! Considere manter apenas um.`);
    }

    console.log('');
    console.log('🎉 Limpeza concluída com sucesso!');
    console.log('📋 Status final:');
    console.log(`   • Admin-app: ${adminCount} registro(s)`);
    console.log('   • Todas as outras tabelas foram zeradas');
    console.log('');
    console.log('🚀 O banco está pronto para novos testes!');

  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Executar o reset
resetDatabase();
