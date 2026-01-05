/**
 * Validação Final Completa
 * Valida TODOS os dados: clientes, atendimentos, bônus, avaliações
 * Garante que tudo está sincronizado e correto
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

async function validacaoFinalCompleta() {
  const erros = [];
  const avisos = [];

  try {
    logSection('🔍 VALIDAÇÃO FINAL COMPLETA');

    // ============================================
    // 1. BUSCAR TODOS OS CLIENTES DE TESTE
    // ============================================
    logSection('1️⃣ CLIENTES DE TESTE');

    const { data: clientes } = await supabase
      .from('customers')
      .select('*')
      .or('name.ilike.%teste%,name.ilike.%test%')
      .order('name');

    if (!clientes || clientes.length === 0) {
      erros.push('Nenhum cliente de teste encontrado!');
      log(`❌ Nenhum cliente de teste encontrado!`, 'red');
      return;
    }

    log(`✅ ${clientes.length} cliente(s) de teste encontrado(s)`, 'green');

    // ============================================
    // 2. VALIDAR CADA CLIENTE
    // ============================================
    logSection('2️⃣ VALIDAÇÃO DETALHADA POR CLIENTE');

    for (const cliente of clientes) {
      log(`\n${'─'.repeat(70)}`, 'blue');
      log(`📋 ${cliente.name} (${cliente.phone})`, 'cyan');
      log(`${'─'.repeat(70)}`, 'blue');

      // BUSCAR ATENDIMENTOS
      const { data: atendimentos } = await supabase
        .from('appointments')
        .select('*')
        .eq('client_id', cliente.id)
        .order('date', { ascending: false });

      const totalAtendimentos = atendimentos?.length || 0;

      log(`\n🏥 ATENDIMENTOS:`, 'cyan');
      log(`   Registrados no cliente: ${cliente.total_appointments}`, 'blue');
      log(`   Encontrados no banco: ${totalAtendimentos}`, 'blue');

      // VALIDAÇÃO 1: Total de atendimentos bate?
      if (cliente.total_appointments !== totalAtendimentos) {
        const erro = `${cliente.name}: total_appointments (${cliente.total_appointments}) ≠ atendimentos reais (${totalAtendimentos})`;
        erros.push(erro);
        log(`   ❌ ${erro}`, 'red');
      } else {
        log(`   ✅ Total de atendimentos CORRETO`, 'green');
      }

      // Exibir cada atendimento
      if (atendimentos && atendimentos.length > 0) {
        atendimentos.forEach((apt, idx) => {
          log(`\n   ${idx + 1}. Atendimento ${apt.id.substring(0, 8)}...`, 'blue');
          log(`      Data: ${apt.date} ${apt.time}`, 'blue');
          log(`      Total: R$ ${apt.total}`, 'blue');
          log(`      Pontos: ${apt.points_earned}`, 'blue');
          log(`      Status: ${apt.status}`, 'blue');
          log(`      Avaliado: ${apt.has_review ? 'SIM ✅' : 'NÃO ⚠️'}`, apt.has_review ? 'green' : 'yellow');
        });
      }

      // BUSCAR AVALIAÇÕES
      const { data: avaliacoes } = await supabase
        .from('reviews')
        .select('*')
        .eq('customer_id', cliente.id);

      const totalAvaliacoes = avaliacoes?.length || 0;
      const atendimentosAvaliados = atendimentos?.filter(a => a.has_review).length || 0;

      log(`\n⭐ AVALIAÇÕES:`, 'cyan');
      log(`   Atendimentos marcados como avaliados: ${atendimentosAvaliados}`, 'blue');
      log(`   Avaliações encontradas: ${totalAvaliacoes}`, 'blue');

      // VALIDAÇÃO 2: Avaliações batem com atendimentos?
      if (atendimentosAvaliados !== totalAvaliacoes) {
        const erro = `${cliente.name}: Atendimentos avaliados (${atendimentosAvaliados}) ≠ avaliações (${totalAvaliacoes})`;
        erros.push(erro);
        log(`   ❌ ${erro}`, 'red');
      } else {
        log(`   ✅ Avaliações CORRETAS`, 'green');
      }

      // Exibir cada avaliação
      if (avaliacoes && avaliacoes.length > 0) {
        avaliacoes.forEach((rev, idx) => {
          log(`\n   ${idx + 1}. Avaliação:`, 'blue');
          log(`      Nota: ${rev.rating} ⭐`, 'blue');
          log(`      Profissional: ${rev.staff_id ? 'ID ' + rev.staff_id.substring(0, 8) + '... ✅' : 'NÃO INFORMADO ❌'}`, rev.staff_id ? 'green' : 'red');
          log(`      Comentário: "${rev.comment?.substring(0, 40) || 'Sem comentário'}..."`, 'blue');
        });

        // VALIDAÇÃO 3: Todas as avaliações têm staff_id?
        const semStaffId = avaliacoes.filter(r => !r.staff_id).length;
        if (semStaffId > 0) {
          const erro = `${cliente.name}: ${semStaffId} avaliação(ões) sem staff_id`;
          erros.push(erro);
          log(`\n   ❌ ${erro}`, 'red');
        } else {
          log(`\n   ✅ Todas as avaliações têm staff_id`, 'green');
        }
      }

      // BUSCAR BÔNUS
      const { data: bonus } = await supabase
        .from('rewards')
        .select('*')
        .eq('client_id', cliente.id);

      const bonusDisponiveis = bonus?.filter(b => b.status === 'available').length || 0;
      const bonusResgatados = bonus?.filter(b => b.status === 'redeemed').length || 0;

      log(`\n🎁 BÔNUS:`, 'cyan');
      log(`   Total: ${bonus?.length || 0}`, 'blue');
      log(`   Disponíveis: ${bonusDisponiveis}`, bonusDisponiveis > 0 ? 'green' : 'blue');
      log(`   Resgatados: ${bonusResgatados}`, bonusResgatados > 0 ? 'green' : 'blue');

      // Exibir cada bônus
      if (bonus && bonus.length > 0) {
        bonus.forEach((b, idx) => {
          log(`\n   ${idx + 1}. ${b.title}:`, 'blue');
          log(`      Status: ${b.status}`, b.status === 'available' ? 'green' : 'blue');
          log(`      Tipo: ${b.type} | Valor: ${b.value || 'N/A'}`, 'blue');
          log(`      Expira: ${b.expires_at}`, 'blue');
        });
      }

      // VALIDAÇÃO 4: Lógica de bônus
      const gastoTotal = parseFloat(cliente.total_spent);
      const progressoAtual = gastoTotal % 300;
      const faltaParaProximo = 300 - progressoAtual;
      const percentual = (progressoAtual / 300) * 100;

      log(`\n💰 FINANCEIRO:`, 'cyan');
      log(`   Total Gasto: R$ ${gastoTotal.toFixed(2)}`, 'blue');
      log(`   Pontos: ${cliente.points_balance}`, 'blue');
      log(`   Progresso para bônus: ${percentual.toFixed(1)}% (falta R$ ${faltaParaProximo.toFixed(2)})`, 'blue');

      // VALIDAÇÃO 5: Atendimento pendente de avaliação não deve ter bônus visível
      if (atendimentosAvaliados < totalAtendimentos && bonusDisponiveis > 0) {
        const aviso = `${cliente.name}: Tem atendimento sem avaliar mas já tem bônus disponível`;
        avisos.push(aviso);
        log(`\n   ⚠️  ${aviso}`, 'yellow');
        log(`      → Cliente deve avaliar primeiro antes de ver bônus!`, 'yellow');
      }

      // VALIDAÇÃO 6: Cálculo de pontos
      const somaAtendimentos = atendimentos?.reduce((sum, a) => sum + (a.total || 0), 0) || 0;
      if (Math.abs(gastoTotal - somaAtendimentos) > 0.01) {
        const erro = `${cliente.name}: total_spent (${gastoTotal}) ≠ soma atendimentos (${somaAtendimentos})`;
        erros.push(erro);
        log(`\n   ❌ ${erro}`, 'red');
      } else {
        log(`\n   ✅ Total gasto CORRETO`, 'green');
      }
    }

    // ============================================
    // 3. ESTATÍSTICAS GERAIS
    // ============================================
    logSection('3️⃣ ESTATÍSTICAS GERAIS');

    const { count: totalClientes } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });

    const { count: totalAtendimentos } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true });

    const { count: totalRewards } = await supabase
      .from('rewards')
      .select('*', { count: 'exact', head: true });

    const { count: totalReviews } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true });

    log(`\n📊 TOTAIS NO SUPABASE:`, 'cyan');
    log(`   Clientes: ${totalClientes}`, 'blue');
    log(`   Atendimentos: ${totalAtendimentos}`, 'blue');
    log(`   Bônus/Rewards: ${totalRewards}`, 'blue');
    log(`   Avaliações: ${totalReviews}`, 'blue');

    // ============================================
    // 4. TESTES ESPECÍFICOS
    // ============================================
    logSection('4️⃣ TESTES ESPECÍFICOS');

    // Teste Cliente 03 - Deve estar PENDENTE de avaliação
    const cliente03 = clientes.find(c => c.name === 'Cliente Teste 03');
    if (cliente03) {
      log(`\n🔍 Teste especial: Cliente Teste 03`, 'cyan');

      const { data: apt03 } = await supabase
        .from('appointments')
        .select('*')
        .eq('client_id', cliente03.id);

      const { data: rev03 } = await supabase
        .from('reviews')
        .select('*')
        .eq('customer_id', cliente03.id);

      const temAtendimentoPendente = apt03?.some(a => a.status === 'completed' && !a.has_review);

      log(`   Atendimentos: ${apt03?.length || 0}`, 'blue');
      log(`   Avaliações: ${rev03?.length || 0}`, 'blue');
      log(`   Tem pendente: ${temAtendimentoPendente ? 'SIM ⚠️' : 'NÃO'}`, temAtendimentoPendente ? 'yellow' : 'green');

      if (temAtendimentoPendente) {
        log(`   ✅ Cliente 03 está PENDENTE de avaliação (correto!)`, 'green');
        log(`   → No login, deve forçar avaliação antes de ver dashboard`, 'yellow');
      } else {
        const erro = 'Cliente Teste 03 deveria estar pendente de avaliação!';
        erros.push(erro);
        log(`   ❌ ${erro}`, 'red');
      }
    }

    // ============================================
    // RESULTADO FINAL
    // ============================================
    logSection('📋 RESULTADO DA VALIDAÇÃO');

    if (erros.length === 0 && avisos.length === 0) {
      log(`\n🎉 VALIDAÇÃO 100% APROVADA!`, 'green');
      log(`\n✅ Todos os dados estão corretos e sincronizados!`, 'green');
    } else {
      if (erros.length > 0) {
        log(`\n❌ ${erros.length} ERRO(S) ENCONTRADO(S):`, 'red');
        erros.forEach((e, i) => {
          log(`   ${i + 1}. ${e}`, 'red');
        });
      }

      if (avisos.length > 0) {
        log(`\n⚠️  ${avisos.length} AVISO(S):`, 'yellow');
        avisos.forEach((a, i) => {
          log(`   ${i + 1}. ${a}`, 'yellow');
        });
      }
    }

    log(`\n📝 CHECKLIST:`, 'cyan');
    log(`   ${erros.length === 0 ? '✅' : '❌'} Atendimentos sincronizados`, erros.length === 0 ? 'green' : 'red');
    log(`   ${erros.length === 0 ? '✅' : '❌'} Avaliações completas com staff_id`, erros.length === 0 ? 'green' : 'red');
    log(`   ${erros.length === 0 ? '✅' : '❌'} Totais financeiros corretos`, erros.length === 0 ? 'green' : 'red');
    log(`   ${avisos.length === 0 ? '✅' : '⚠️ '} Regras de negócio`, avisos.length === 0 ? 'green' : 'yellow');

    log(`\n🔗 TESTE MANUAL AGORA:`, 'cyan');
    log(`\n   1. RECEPÇÃO - Filtro de Bônus:`, 'blue');
    log(`      → http://localhost:3005/recepcao`, 'blue');
    log(`      → Login: julia.atendente@bedeschi.com | teste123`, 'blue');
    log(`      → Aba "Bônus" → Selecionar cliente`, 'blue');
    log(`      → Verificar: atendimentos, bônus, progresso`, 'blue');

    log(`\n   2. CLIENTE 03 - Avaliação Obrigatória:`, 'blue');
    log(`      → http://localhost:3005/c/bedeschi`, 'blue');
    log(`      → Login: 11998003333 | PIN: 3333`, 'blue');
    log(`      → DEVE forçar avaliação primeiro`, 'blue');
    log(`      → Só depois mostra dashboard`, 'blue');

    log(`\n   3. CLIENTE 02 - Com Bônus:`, 'blue');
    log(`      → Login: 11998002222 | PIN: 2222`, 'blue');
    log(`      → Já avaliou tudo, pode ver bônus direto`, 'blue');

  } catch (error) {
    log(`\n❌ ERRO: ${error.message}`, 'red');
    console.error(error);
  }
}

validacaoFinalCompleta();
