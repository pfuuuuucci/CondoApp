
const { query } = require('./database');

async function criarUnidades() {
  try {
    console.log('🏢 Iniciando criação de unidades de apartamentos...');
    
    let totalCriadas = 0;
    let totalExistentes = 0;

    // Loop para cada andar (1 a 17)
    for (let andar = 1; andar <= 17; andar++) {
      console.log(`📍 Processando ${andar}º andar...`);
      
      // Loop para cada apartamento do andar (01 a 08)
      for (let apto = 1; apto <= 8; apto++) {
        const numeroApto = apto.toString().padStart(2, '0'); // Converte 1 para "01", 2 para "02", etc.
        const nomeUnidade = `Apto. ${andar}${numeroApto}`;
        
        try {
          // Verifica se a unidade já existe
          const existeResult = await query('SELECT id FROM unidades WHERE nome = $1', [nomeUnidade]);
          
          if (existeResult.rows.length > 0) {
            console.log(`⚠️ Unidade ${nomeUnidade} já existe, pulando...`);
            totalExistentes++;
          } else {
            // Cria a unidade
            await query('INSERT INTO unidades (nome) VALUES ($1)', [nomeUnidade]);
            console.log(`✅ Unidade ${nomeUnidade} criada com sucesso`);
            totalCriadas++;
          }
        } catch (error) {
          console.error(`❌ Erro ao criar unidade ${nomeUnidade}:`, error.message);
        }
      }
    }

    console.log('');
    console.log('🎉 Processo concluído!');
    console.log('📊 Resumo:');
    console.log(`   • Unidades criadas: ${totalCriadas}`);
    console.log(`   • Unidades já existentes: ${totalExistentes}`);
    console.log(`   • Total processado: ${totalCriadas + totalExistentes}`);
    console.log('');
    console.log('🏠 Estrutura criada:');
    console.log('   • 17 andares (1º ao 17º)');
    console.log('   • 8 apartamentos por andar (01 a 08)');
    console.log('   • Total esperado: 136 unidades');

  } catch (error) {
    console.error('❌ Erro durante a criação das unidades:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Executar o script
criarUnidades();
