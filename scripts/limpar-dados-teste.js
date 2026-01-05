/**
 * Script para Limpar Dados de Teste
 * Remove todos os dados de teste para começar limpo
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(70));
  log(title, 'cyan');
  console.log('='.repeat(70));
}

async function limparDadosTeste() {
  try {
    logSection('🧹 LIMPANDO DADOS DE TESTE');

    // ============================================
    // 1. LISTAR DADOS ANTES DE LIMPAR
    // ============================================
    logSection('1️⃣ DADOS ANTES DA LIMPEZA');

    const { count: countClientes } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });

    const { count: countAtendimentos } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true });

    const { count: countRewards } = await supabase
      .from('rewards')
      .select('*', { count: 'exact', head: true });

    const { count: countReviews } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true });

    log(`\n📊 Dados atuais:`, 'cyan');
    log(`   Clientes: ${countClientes}`, 'blue');
    log(`   Atendimentos: ${countAtendimentos}`, 'blue');
    log(`   Bônus/Rewards: ${countRewards}`, 'blue');
    log(`   Avaliações: ${countReviews}`, 'blue');

    // ============================================
    // 2. CONFIRMAR LIMPEZA
    // ============================================
    logSection('2️⃣ IDENTIFICAR DADOS DE TESTE');

    // Buscar clientes de teste (exceto staff)
    const { data: clientesTeste } = await supabase
      .from('customers')
      .select('id, name, phone')
      .or('name.ilike.%teste%,name.ilike.%test%,name.ilike.%qa%')
      .order('name');

    if (clientesTeste && clientesTeste.length > 0) {
      log(`\n⚠️  Clientes de TESTE encontrados (${clientesTeste.length}):`, 'yellow');
      clientesTeste.forEach(c => {
        log(`   • ${c.name} (${c.phone})`, 'yellow');
      });
    } else {
      log(`\n✅ Nenhum cliente de teste encontrado`, 'green');
      return;
    }

    // ============================================
    // 3. DELETAR REVIEWS DOS CLIENTES DE TESTE
    // ============================================
    logSection('3️⃣ DELETANDO AVALIAÇÕES');

    const idsClientesTeste = clientesTeste.map(c => c.id);

    const { error: errReviews, count: deletedReviews } = await supabase
      .from('reviews')
      .delete({ count: 'exact' })
      .in('customer_id', idsClientesTeste);

    if (errReviews) {
      log(`❌ Erro ao deletar reviews: ${errReviews.message}`, 'red');
    } else {
      log(`✅ ${deletedReviews || 0} avaliações deletadas`, 'green');
    }

    // ============================================
    // 4. DELETAR REWARDS DOS CLIENTES DE TESTE
    // ============================================
    logSection('4️⃣ DELETANDO BÔNUS/REWARDS');

    const { error: errRewards, count: deletedRewards } = await supabase
      .from('rewards')
      .delete({ count: 'exact' })
      .in('client_id', idsClientesTeste);

    if (errRewards) {
      log(`❌ Erro ao deletar rewards: ${errRewards.message}`, 'red');
    } else {
      log(`✅ ${deletedRewards || 0} bônus deletados`, 'green');
    }

    // ============================================
    // 5. DELETAR APPOINTMENTS DOS CLIENTES DE TESTE
    // ============================================
    logSection('5️⃣ DELETANDO ATENDIMENTOS');

    const { error: errAppointments, count: deletedAppointments } = await supabase
      .from('appointments')
      .delete({ count: 'exact' })
      .in('client_id', idsClientesTeste);

    if (errAppointments) {
      log(`❌ Erro ao deletar appointments: ${errAppointments.message}`, 'red');
    } else {
      log(`✅ ${deletedAppointments || 0} atendimentos deletados`, 'green');
    }

    // ============================================
    // 6. DELETAR CLIENTES DE TESTE
    // ============================================
    logSection('6️⃣ DELETANDO CLIENTES');

    const { error: errClientes, count: deletedClientes } = await supabase
      .from('customers')
      .delete({ count: 'exact' })
      .in('id', idsClientesTeste);

    if (errClientes) {
      log(`❌ Erro ao deletar clientes: ${errClientes.message}`, 'red');
    } else {
      log(`✅ ${deletedClientes || 0} clientes deletados`, 'green');
    }

    // ============================================
    // 7. VERIFICAR LIMPEZA
    // ============================================
    logSection('7️⃣ VERIFICAÇÃO PÓS-LIMPEZA');

    const { count: countClientesDepois } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });

    const { count: countAtendimentosDepois } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true });

    const { count: countRewardsDepois } = await supabase
      .from('rewards')
      .select('*', { count: 'exact', head: true });

    const { count: countReviewsDepois } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true });

    log(`\n📊 Dados após limpeza:`, 'cyan');
    log(`   Clientes: ${countClientes} → ${countClientesDepois}`, 'blue');
    log(`   Atendimentos: ${countAtendimentos} → ${countAtendimentosDepois}`, 'blue');
    log(`   Bônus/Rewards: ${countRewards} → ${countRewardsDepois}`, 'blue');
    log(`   Avaliações: ${countReviews} → ${countReviewsDepois}`, 'blue');

    // ============================================
    // RESULTADO FINAL
    // ============================================
    logSection('✅ LIMPEZA CONCLUÍDA');

    log(`\n🎉 Dados de teste removidos com sucesso!`, 'green');
    log(`\n📊 Resumo:`, 'cyan');
    log(`   ✅ ${deletedClientes || 0} cliente(s) removido(s)`, 'green');
    log(`   ✅ ${deletedAppointments || 0} atendimento(s) removido(s)`, 'green');
    log(`   ✅ ${deletedRewards || 0} bônus removido(s)`, 'green');
    log(`   ✅ ${deletedReviews || 0} avaliação(ões) removida(s)`, 'green');

    log(`\n🔄 Próximo passo:`, 'cyan');
    log(`   Execute: node scripts/gerar-dados-validados.js`, 'blue');

  } catch (error) {
    log(`\n❌ ERRO: ${error.message}`, 'red');
    console.error(error);
  }
}

limparDadosTeste();
