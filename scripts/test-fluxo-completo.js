/**
 * Script de Teste QA - Fluxo Completo
 * Testa: Criar cliente -> Criar atendimento -> Avaliação -> Sincronização
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Cores para console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
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

async function testFluxoCompleto() {
  let testePassed = true;
  const resultados = {
    cliente: null,
    profissional: null,
    atendimento: null,
    avaliacao: null,
  };

  try {
    logSection('🧪 TESTE QA - FLUXO COMPLETO');

    // ============================================
    // TESTE 1: Verificar Profissionais
    // ============================================
    logSection('1️⃣ VERIFICAR PROFISSIONAIS NO SUPABASE');
    
    const { data: profissionais, error: profError } = await supabase
      .from('staff_users')
      .select('*')
      .in('role', ['profissional', 'medico'])
      .eq('is_active', true);

    if (profError) {
      log(`❌ Erro ao buscar profissionais: ${profError.message}`, 'red');
      testePassed = false;
    } else if (!profissionais || profissionais.length === 0) {
      log('⚠️  Nenhum profissional cadastrado', 'yellow');
      log('ℹ️  Cadastre profissionais no Admin Dashboard primeiro', 'blue');
      testePassed = false;
    } else {
      log(`✅ ${profissionais.length} profissional(is) encontrado(s)`, 'green');
      profissionais.forEach((p, i) => {
        log(`   ${i + 1}. ${p.name} (${p.role}) - ${p.specialty || 'Sem especialidade'}`, 'blue');
      });
      resultados.profissional = profissionais[0];
    }

    if (!resultados.profissional) {
      log('\n❌ TESTE ABORTADO: Cadastre profissionais antes de continuar', 'red');
      return;
    }

    // ============================================
    // TESTE 2: Criar Cliente de Teste
    // ============================================
    logSection('2️⃣ CRIAR CLIENTE DE TESTE');

    const clienteTeste = {
      name: 'Cliente Teste QA',
      phone: '11999888777',
      email: 'teste.qa@bedeschi.com',
      pin: '9999',
      points_balance: 0,
      total_spent: 0,
      total_appointments: 0,
    };

    // Verificar se cliente já existe
    const { data: clienteExistente } = await supabase
      .from('customers')
      .select('*')
      .eq('phone', clienteTeste.phone)
      .single();

    if (clienteExistente) {
      log(`ℹ️  Cliente já existe: ${clienteExistente.name}`, 'blue');
      resultados.cliente = clienteExistente;
    } else {
      const { data: novoCliente, error: clienteError } = await supabase
        .from('customers')
        .insert([clienteTeste])
        .select()
        .single();

      if (clienteError) {
        log(`❌ Erro ao criar cliente: ${clienteError.message}`, 'red');
        testePassed = false;
        return;
      }

      log(`✅ Cliente criado: ${novoCliente.name}`, 'green');
      log(`   📱 Telefone: ${novoCliente.phone}`, 'blue');
      log(`   🔑 PIN: ${novoCliente.pin}`, 'blue');
      resultados.cliente = novoCliente;
    }

    // ============================================
    // TESTE 3: Criar Atendimento
    // ============================================
    logSection('3️⃣ CRIAR ATENDIMENTO DE TESTE');

    const atendimentoTeste = {
      client_id: resultados.cliente.id,
      client_name: resultados.cliente.name,
      professional_id: resultados.profissional.id,
      professional_name: resultados.profissional.name,
      date: new Date().toISOString().split('T')[0],
      time: '14:00',
      status: 'completed',
      total: 350.00,
      points_earned: 350,
      has_review: false,
      services: [
        { service_name: 'Massagem Relaxante 60min', price: 180.00 },
        { service_name: 'Limpeza de Pele', price: 170.00 }
      ],
    };

    const { data: novoAtendimento, error: atendError } = await supabase
      .from('appointments')
      .insert([atendimentoTeste])
      .select()
      .single();

    if (atendError) {
      log(`❌ Erro ao criar atendimento: ${atendError.message}`, 'red');
      testePassed = false;
      return;
    }

    log(`✅ Atendimento criado com sucesso!`, 'green');
    log(`   👤 Cliente: ${novoAtendimento.client_name}`, 'blue');
    log(`   👨‍⚕️ Profissional: ${novoAtendimento.professional_name}`, 'blue');
    log(`   💰 Total: R$ ${novoAtendimento.total.toFixed(2)}`, 'blue');
    log(`   ⭐ Pontos: ${novoAtendimento.points_earned}`, 'blue');
    resultados.atendimento = novoAtendimento;

    // Atualizar cliente com pontos
    const { error: updateError } = await supabase
      .from('customers')
      .update({
        points_balance: resultados.cliente.points_balance + novoAtendimento.points_earned,
        total_spent: resultados.cliente.total_spent + novoAtendimento.total,
        total_appointments: resultados.cliente.total_appointments + 1,
      })
      .eq('id', resultados.cliente.id);

    if (updateError) {
      log(`⚠️  Erro ao atualizar cliente: ${updateError.message}`, 'yellow');
    } else {
      log(`✅ Pontos e gastos do cliente atualizados`, 'green');
    }

    // ============================================
    // TESTE 4: Criar Avaliação
    // ============================================
    logSection('4️⃣ CRIAR AVALIAÇÃO DO ATENDIMENTO');

    const avaliacaoTeste = {
      customer_id: resultados.cliente.id,
      appointment_id: resultados.atendimento.id,
      staff_id: resultados.profissional.id,
      rating: 5,
      comment: 'Atendimento excelente! Profissional muito atencioso e cuidadoso. Recomendo!',
    };

    const { data: novaAvaliacao, error: avalError } = await supabase
      .from('reviews')
      .insert([avaliacaoTeste])
      .select()
      .single();

    if (avalError) {
      log(`❌ Erro ao criar avaliação: ${avalError.message}`, 'red');
      testePassed = false;
    } else {
      log(`✅ Avaliação criada com sucesso!`, 'green');
      log(`   ⭐ Nota: ${novaAvaliacao.rating}/5`, 'blue');
      log(`   💬 Comentário: ${novaAvaliacao.comment}`, 'blue');
      resultados.avaliacao = novaAvaliacao;

      // Marcar atendimento como avaliado
      const { error: markError } = await supabase
        .from('appointments')
        .update({
          has_review: true,
          review_rating: novaAvaliacao.rating,
          review_comment: novaAvaliacao.comment,
        })
        .eq('id', resultados.atendimento.id);

      if (markError) {
        log(`⚠️  Erro ao marcar atendimento como avaliado: ${markError.message}`, 'yellow');
      } else {
        log(`✅ Atendimento marcado como avaliado`, 'green');
      }
    }

    // ============================================
    // TESTE 5: Verificar Sincronização
    // ============================================
    logSection('5️⃣ VERIFICAR SINCRONIZAÇÃO DOS DADOS');

    // Verificar cliente atualizado
    const { data: clienteAtualizado } = await supabase
      .from('customers')
      .select('*')
      .eq('id', resultados.cliente.id)
      .single();

    log('📊 Cliente atualizado:', 'cyan');
    log(`   💰 Gasto total: R$ ${clienteAtualizado.total_spent.toFixed(2)}`, 'blue');
    log(`   ⭐ Pontos: ${clienteAtualizado.points_balance}`, 'blue');
    log(`   📅 Total de atendimentos: ${clienteAtualizado.total_appointments}`, 'blue');

    if (clienteAtualizado.total_spent !== 350.00) {
      log(`⚠️  ATENÇÃO: Gasto esperado R$ 350.00, mas está R$ ${clienteAtualizado.total_spent}`, 'yellow');
      testePassed = false;
    }

    if (clienteAtualizado.points_balance !== 350) {
      log(`⚠️  ATENÇÃO: Pontos esperados 350, mas está ${clienteAtualizado.points_balance}`, 'yellow');
      testePassed = false;
    }

    // Verificar atendimento
    const { data: atendimentoAtualizado } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', resultados.atendimento.id)
      .single();

    log('\n📊 Atendimento verificado:', 'cyan');
    log(`   ✅ Status: ${atendimentoAtualizado.status}`, 'blue');
    log(`   ${atendimentoAtualizado.has_review ? '✅' : '❌'} Avaliado: ${atendimentoAtualizado.has_review}`, atendimentoAtualizado.has_review ? 'green' : 'red');
    
    if (!atendimentoAtualizado.has_review) {
      log(`⚠️  ATENÇÃO: Atendimento deveria estar marcado como avaliado`, 'yellow');
      testePassed = false;
    }

    // Verificar avaliação
    const { data: avaliacaoVerificada } = await supabase
      .from('reviews')
      .select('*')
      .eq('appointment_id', resultados.atendimento.id)
      .single();

    if (avaliacaoVerificada) {
      log('\n📊 Avaliação verificada:', 'cyan');
      log(`   ⭐ Nota: ${avaliacaoVerificada.rating}/5`, 'blue');
      log(`   💬 Comentário presente: ${avaliacaoVerificada.comment ? 'Sim' : 'Não'}`, 'blue');
    } else {
      log(`⚠️  ATENÇÃO: Avaliação não encontrada no banco`, 'yellow');
      testePassed = false;
    }

    // ============================================
    // TESTE 6: Estatísticas do Profissional
    // ============================================
    logSection('6️⃣ ESTATÍSTICAS DO PROFISSIONAL');

    const { data: avaliacoesProfissional } = await supabase
      .from('reviews')
      .select('rating')
      .eq('staff_id', resultados.profissional.id);

    if (avaliacoesProfissional && avaliacoesProfissional.length > 0) {
      const totalAvaliacoes = avaliacoesProfissional.length;
      const somaNotas = avaliacoesProfissional.reduce((sum, r) => sum + r.rating, 0);
      const mediaNotas = somaNotas / totalAvaliacoes;

      log(`📊 Profissional: ${resultados.profissional.name}`, 'cyan');
      log(`   📈 Total de avaliações: ${totalAvaliacoes}`, 'blue');
      log(`   ⭐ Média de notas: ${mediaNotas.toFixed(1)}/5`, 'blue');
      log(`   ${mediaNotas >= 4.5 ? '🏆 EXCELENTE!' : mediaNotas >= 4.0 ? '👍 BOM' : '⚠️  PRECISA MELHORAR'}`, mediaNotas >= 4.5 ? 'green' : mediaNotas >= 4.0 ? 'yellow' : 'red');
    } else {
      log(`ℹ️  Nenhuma avaliação encontrada para ${resultados.profissional.name}`, 'blue');
    }

    // ============================================
    // RESULTADO FINAL
    // ============================================
    logSection('📋 RESULTADO FINAL DO TESTE');

    if (testePassed) {
      log('✅ TODOS OS TESTES PASSARAM!', 'green');
      log('\n🎉 Sistema 100% funcional e sincronizado!', 'green');
      log('\n📝 Dados de teste criados:', 'cyan');
      log(`   📱 Cliente: ${clienteTeste.phone} / PIN: ${clienteTeste.pin}`, 'blue');
      log(`   👤 Nome: ${resultados.cliente.name}`, 'blue');
      log(`   🆔 ID: ${resultados.cliente.id}`, 'blue');
      log('\n🔗 URLs para teste manual:', 'cyan');
      log(`   Admin: http://localhost:3005/admin/dashboard`, 'blue');
      log(`   Recepção: http://localhost:3005/recepcao`, 'blue');
      log(`   Cliente: http://localhost:3005/c/bedeschi`, 'blue');
    } else {
      log('❌ ALGUNS TESTES FALHARAM', 'red');
      log('⚠️  Revise os erros acima e corrija os problemas', 'yellow');
    }

  } catch (error) {
    log(`\n❌ ERRO FATAL NO TESTE: ${error.message}`, 'red');
    console.error(error);
    testePassed = false;
  }

  process.exit(testePassed ? 0 : 1);
}

// Executar teste
testFluxoCompleto();
