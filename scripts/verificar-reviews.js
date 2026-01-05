/**
 * Verificar Tabela Reviews e Fluxo de Avaliação
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
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

async function verificarReviews() {
  try {
    logSection('🔍 VERIFICAÇÃO DE AVALIAÇÕES');

    // ============================================
    // 1. VERIFICAR TABELA REVIEWS
    // ============================================
    logSection('1️⃣ VERIFICAR TABELA REVIEWS');

    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('*')
      .limit(5);

    if (reviewsError) {
      log(`❌ TABELA REVIEWS NÃO EXISTE!`, 'red');
      log(`   Erro: ${reviewsError.message}`, 'red');
      log(`\n⚠️  É NECESSÁRIO CRIAR A TABELA!`, 'yellow');
      return { needsTable: true };
    } else {
      log(`✅ Tabela reviews existe`, 'green');
      log(`   Total de avaliações: ${reviews.length}`, 'cyan');
    }

    // ============================================
    // 2. VERIFICAR ATENDIMENTOS SEM AVALIAÇÃO
    // ============================================
    logSection('2️⃣ ATENDIMENTOS PENDENTES DE AVALIAÇÃO');

    const { data: pendingAppts } = await supabase
      .from('appointments')
      .select('id, client_name, date, status, has_review')
      .eq('status', 'completed')
      .eq('has_review', false)
      .order('date', { ascending: false })
      .limit(10);

    if (pendingAppts && pendingAppts.length > 0) {
      log(`⚠️  ${pendingAppts.length} atendimento(s) sem avaliação:`, 'yellow');
      pendingAppts.forEach(a => {
        log(`   • ${a.client_name} - ${a.date} (ID: ${a.id.slice(0, 8)}...)`, 'cyan');
      });
    } else {
      log(`✅ Nenhum atendimento pendente de avaliação`, 'green');
    }

    // ============================================
    // 3. VERIFICAR ATENDIMENTOS COM AVALIAÇÃO
    // ============================================
    logSection('3️⃣ ATENDIMENTOS JÁ AVALIADOS');

    const { data: reviewedAppts } = await supabase
      .from('appointments')
      .select('id, client_name, date, has_review, review_rating')
      .eq('has_review', true)
      .order('date', { ascending: false })
      .limit(5);

    if (reviewedAppts && reviewedAppts.length > 0) {
      log(`✅ ${reviewedAppts.length} atendimento(s) avaliado(s):`, 'green');
      reviewedAppts.forEach(a => {
        log(`   • ${a.client_name} - Nota: ${a.review_rating || 'N/A'} ⭐`, 'cyan');
      });
    } else {
      log(`⚠️  Nenhum atendimento avaliado ainda`, 'yellow');
    }

    // ============================================
    // 4. VERIFICAR ESTRUTURA DA TABELA REVIEWS
    // ============================================
    logSection('4️⃣ ESTRUTURA DA TABELA REVIEWS');

    const { data: columns, error: structureError } = await supabase
      .rpc('get_table_columns', { table_name: 'reviews' })
      .catch(() => null);

    // Se não conseguir via RPC, tenta query direta
    const { data: sampleReview } = await supabase
      .from('reviews')
      .select('*')
      .limit(1)
      .single();

    if (sampleReview) {
      log(`✅ Estrutura da tabela:`, 'green');
      Object.keys(sampleReview).forEach(col => {
        log(`   • ${col}: ${typeof sampleReview[col]}`, 'cyan');
      });
    } else {
      log(`⚠️  Tabela vazia - sem dados para verificar estrutura`, 'yellow');
    }

    // ============================================
    // 5. TESTAR CLIENTE "NOVO TESTE"
    // ============================================
    logSection('5️⃣ VERIFICAR CLIENTE "NOVO TESTE"');

    const { data: novoTeste } = await supabase
      .from('customers')
      .select('*')
      .ilike('name', '%novo teste%')
      .single();

    if (novoTeste) {
      log(`✅ Cliente encontrado: ${novoTeste.name}`, 'green');
      log(`   Telefone: ${novoTeste.phone}`, 'cyan');
      log(`   PIN: ${novoTeste.pin}`, 'cyan');
      log(`   Pontos: ${novoTeste.points_balance}`, 'cyan');
      log(`   Gasto: R$ ${novoTeste.total_spent}`, 'cyan');

      // Verificar atendimentos
      const { data: appts } = await supabase
        .from('appointments')
        .select('id, date, total, has_review, services')
        .eq('client_id', novoTeste.id)
        .order('date', { ascending: false });

      if (appts && appts.length > 0) {
        log(`\n   📋 Atendimentos (${appts.length}):`, 'cyan');
        appts.forEach((a, i) => {
          const services = a.services.map(s => s.service_name).join(', ');
          log(`     ${i + 1}. ${a.date} - R$ ${a.total} - Avaliado: ${a.has_review ? 'Sim' : 'NÃO'}`, a.has_review ? 'green' : 'yellow');
          log(`        Serviços: ${services}`, 'cyan');
        });
      }

      // Verificar bônus
      const { data: bonuses } = await supabase
        .from('rewards')
        .select('title, status, expires_at')
        .eq('client_id', novoTeste.id);

      if (bonuses && bonuses.length > 0) {
        log(`\n   🎁 Bônus (${bonuses.length}):`, 'cyan');
        bonuses.forEach(b => {
          log(`     • ${b.title} - ${b.status}`, b.status === 'available' ? 'green' : 'yellow');
        });
      }
    } else {
      log(`⚠️  Cliente "Novo Teste" não encontrado`, 'yellow');
    }

    return { needsTable: false, pendingCount: pendingAppts?.length || 0 };

  } catch (error) {
    log(`\n❌ ERRO: ${error.message}`, 'red');
    console.error(error);
    return { needsTable: true, error: error.message };
  }
}

verificarReviews().then(result => {
  if (result.needsTable) {
    logSection('⚠️  AÇÃO NECESSÁRIA');
    log(`\n📋 É necessário criar a tabela reviews no Supabase!`, 'yellow');
    log(`   Execute o SQL fornecido pelo assistente.`, 'cyan');
  }
});
