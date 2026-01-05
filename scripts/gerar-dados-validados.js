/**
 * Script para Gerar Dados Validados e Completos
 * Cria clientes, atendimentos, bônus e avaliações sincronizadas
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

async function gerarDadosValidados() {
  try {
    logSection('🎯 GERANDO DADOS VALIDADOS');

    // ============================================
    // 1. BUSCAR PROFISSIONAL E SERVIÇOS
    // ============================================
    logSection('1️⃣ PREPARANDO DADOS BASE');

    const { data: profissional } = await supabase
      .from('staff_users')
      .select('*')
      .in('role', ['profissional', 'medico'])
      .eq('is_active', true)
      .limit(1)
      .single();

    if (!profissional) {
      log(`❌ Nenhum profissional encontrado!`, 'red');
      return;
    }

    log(`✅ Profissional: ${profissional.name}`, 'green');

    const { data: servicos } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .limit(10);

    if (!servicos || servicos.length === 0) {
      log(`❌ Nenhum serviço encontrado!`, 'red');
      return;
    }

    log(`✅ ${servicos.length} serviços disponíveis`, 'green');

    // ============================================
    // 2. CRIAR CLIENTE 1 - COM TUDO COMPLETO
    // ============================================
    logSection('2️⃣ CLIENTE 1 - FLUXO COMPLETO');

    const { data: cliente1 } = await supabase
      .from('customers')
      .insert({
        name: 'Cliente Teste 01',
        phone: '11998001111',
        email: 'teste01@bedeschi.com',
        pin: '1111',
        total_spent: 0,
        points_balance: 0,
        total_appointments: 0,
      })
      .select()
      .single();

    log(`✅ Cliente criado: ${cliente1.name}`, 'green');

    // Criar atendimento 1
    const servico1 = servicos[0];
    const total1 = parseFloat(servico1.price);

    const { data: atendimento1 } = await supabase
      .from('appointments')
      .insert({
        client_id: cliente1.id,
        client_name: cliente1.name,
        professional_id: profissional.id,
        professional_name: profissional.name,
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        status: 'completed',
        total: total1,
        points_earned: Math.floor(total1),
        has_review: true, // JÁ AVALIADO
        services: [{
          service_name: servico1.name,
          price: parseFloat(servico1.price),
        }],
      })
      .select()
      .single();

    log(`✅ Atendimento criado: R$ ${total1}`, 'green');

    // Criar avaliação
    const { data: review1 } = await supabase
      .from('reviews')
      .insert({
        customer_id: cliente1.id,
        appointment_id: atendimento1.id,
        staff_id: profissional.id,
        rating: 5,
        comment: 'Excelente atendimento! Muito profissional.',
      })
      .select()
      .single();

    log(`✅ Avaliação criada: 5 ⭐`, 'green');

    // Atualizar cliente
    await supabase
      .from('customers')
      .update({
        total_spent: total1,
        points_balance: Math.floor(total1),
        total_appointments: 1,
        last_visit: new Date().toISOString().split('T')[0],
      })
      .eq('id', cliente1.id);

    log(`✅ Cliente atualizado: R$ ${total1}, ${Math.floor(total1)} pts, 1 atendimento`, 'green');

    // ============================================
    // 3. CRIAR CLIENTE 2 - COM BÔNUS
    // ============================================
    logSection('3️⃣ CLIENTE 2 - COM BÔNUS DISPONÍVEL');

    const { data: cliente2 } = await supabase
      .from('customers')
      .insert({
        name: 'Cliente Teste 02',
        phone: '11998002222',
        email: 'teste02@bedeschi.com',
        pin: '2222',
        total_spent: 0,
        points_balance: 0,
        total_appointments: 0,
      })
      .select()
      .single();

    log(`✅ Cliente criado: ${cliente2.name}`, 'green');

    // Criar 2 atendimentos
    const servico2 = servicos[1];
    const servico3 = servicos[2];
    const total2 = parseFloat(servico2.price);
    const total3 = parseFloat(servico3.price);
    const totalGeral2 = total2 + total3;

    // Atendimento 1
    const { data: atendimento2a } = await supabase
      .from('appointments')
      .insert({
        client_id: cliente2.id,
        client_name: cliente2.name,
        professional_id: profissional.id,
        professional_name: profissional.name,
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        time: '10:00',
        status: 'completed',
        total: total2,
        points_earned: Math.floor(total2),
        has_review: true,
        services: [{
          service_name: servico2.name,
          price: parseFloat(servico2.price),
        }],
      })
      .select()
      .single();

    log(`✅ Atendimento 1 criado: R$ ${total2}`, 'green');

    // Avaliação 1
    await supabase
      .from('reviews')
      .insert({
        customer_id: cliente2.id,
        appointment_id: atendimento2a.id,
        staff_id: profissional.id,
        rating: 5,
        comment: 'Ótimo serviço!',
      });

    log(`✅ Avaliação 1 criada: 5 ⭐`, 'green');

    // Atendimento 2
    const { data: atendimento2b } = await supabase
      .from('appointments')
      .insert({
        client_id: cliente2.id,
        client_name: cliente2.name,
        professional_id: profissional.id,
        professional_name: profissional.name,
        date: new Date().toISOString().split('T')[0],
        time: '14:00',
        status: 'completed',
        total: total3,
        points_earned: Math.floor(total3),
        has_review: true,
        services: [{
          service_name: servico3.name,
          price: parseFloat(servico3.price),
        }],
      })
      .select()
      .single();

    log(`✅ Atendimento 2 criado: R$ ${total3}`, 'green');

    // Avaliação 2
    await supabase
      .from('reviews')
      .insert({
        customer_id: cliente2.id,
        appointment_id: atendimento2b.id,
        staff_id: profissional.id,
        rating: 4,
        comment: 'Muito bom!',
      });

    log(`✅ Avaliação 2 criada: 4 ⭐`, 'green');

    // Atualizar cliente
    await supabase
      .from('customers')
      .update({
        total_spent: totalGeral2,
        points_balance: Math.floor(totalGeral2),
        total_appointments: 2,
        last_visit: new Date().toISOString().split('T')[0],
      })
      .eq('id', cliente2.id);

    log(`✅ Cliente atualizado: R$ ${totalGeral2}, ${Math.floor(totalGeral2)} pts, 2 atendimentos`, 'green');

    // Gerar bônus se >= 300
    if (totalGeral2 >= 300) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const { data: bonus2 } = await supabase
        .from('rewards')
        .insert({
          client_id: cliente2.id,
          title: '10% de Desconto',
          description: `Gastou R$ ${totalGeral2.toFixed(2)} - Ganhou 10% OFF`,
          type: 'DISCOUNT_PERCENT',
          value: 10,
          status: 'available',
          expires_at: expiresAt.toISOString().split('T')[0],
        })
        .select()
        .single();

      log(`✅ Bônus criado: ${bonus2.title} (disponível)`, 'green');
    } else {
      log(`⏳ Gasto total R$ ${totalGeral2} < R$ 300 - sem bônus`, 'yellow');
    }

    // ============================================
    // 4. CRIAR CLIENTE 3 - PENDENTE DE AVALIAÇÃO
    // ============================================
    logSection('4️⃣ CLIENTE 3 - PENDENTE DE AVALIAÇÃO');

    const { data: cliente3 } = await supabase
      .from('customers')
      .insert({
        name: 'Cliente Teste 03',
        phone: '11998003333',
        email: 'teste03@bedeschi.com',
        pin: '3333',
        total_spent: 0,
        points_balance: 0,
        total_appointments: 0,
      })
      .select()
      .single();

    log(`✅ Cliente criado: ${cliente3.name}`, 'green');

    // Criar atendimento COMPLETO mas SEM AVALIAÇÃO
    const servico4 = servicos[3];
    const total4 = parseFloat(servico4.price);

    const { data: atendimento3 } = await supabase
      .from('appointments')
      .insert({
        client_id: cliente3.id,
        client_name: cliente3.name,
        professional_id: profissional.id,
        professional_name: profissional.name,
        date: new Date().toISOString().split('T')[0],
        time: '16:00',
        status: 'completed',
        total: total4,
        points_earned: Math.floor(total4),
        has_review: false, // PENDENTE DE AVALIAÇÃO
        services: [{
          service_name: servico4.name,
          price: parseFloat(servico4.price),
        }],
      })
      .select()
      .single();

    log(`✅ Atendimento criado: R$ ${total4}`, 'green');
    log(`⚠️  SEM AVALIAÇÃO - cliente deve avaliar no login`, 'yellow');

    // Atualizar cliente
    await supabase
      .from('customers')
      .update({
        total_spent: total4,
        points_balance: Math.floor(total4),
        total_appointments: 1,
        last_visit: new Date().toISOString().split('T')[0],
      })
      .eq('id', cliente3.id);

    log(`✅ Cliente atualizado: R$ ${total4}, ${Math.floor(total4)} pts, 1 atendimento`, 'green');

    // Gerar bônus se >= 300
    if (total4 >= 300) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      await supabase
        .from('rewards')
        .insert({
          client_id: cliente3.id,
          title: '10% de Desconto',
          description: `Gastou R$ ${total4.toFixed(2)} - Ganhou 10% OFF`,
          type: 'DISCOUNT_PERCENT',
          value: 10,
          status: 'available',
          expires_at: expiresAt.toISOString().split('T')[0],
        });

      log(`✅ Bônus criado mas NÃO DEVE APARECER até avaliar`, 'yellow');
    }

    // ============================================
    // 5. VALIDAR DADOS GERADOS
    // ============================================
    logSection('5️⃣ VALIDAÇÃO DOS DADOS');

    const { data: todosClientes } = await supabase
      .from('customers')
      .select('*')
      .or('name.ilike.%teste%,name.ilike.%test%')
      .order('name');

    log(`\n📊 Clientes gerados: ${todosClientes.length}`, 'cyan');
    
    for (const cliente of todosClientes) {
      log(`\n📋 ${cliente.name}:`, 'cyan');
      log(`   📱 ${cliente.phone} | PIN: ${cliente.pin}`, 'blue');
      log(`   💰 Total Gasto: R$ ${cliente.total_spent}`, 'blue');
      log(`   ⭐ Pontos: ${cliente.points_balance}`, 'blue');
      log(`   📊 Atendimentos: ${cliente.total_appointments}`, 'blue');

      // Buscar atendimentos
      const { data: atendimentos } = await supabase
        .from('appointments')
        .select('*')
        .eq('client_id', cliente.id);

      log(`   🏥 Atendimentos cadastrados: ${atendimentos?.length || 0}`, 'blue');

      if (atendimentos) {
        atendimentos.forEach((apt, idx) => {
          log(`      ${idx + 1}. R$ ${apt.total} - ${apt.status} - Avaliado: ${apt.has_review ? 'SIM ✅' : 'NÃO ⚠️'}`, 
            apt.has_review ? 'green' : 'yellow');
        });
      }

      // Buscar bônus
      const { data: bonus } = await supabase
        .from('rewards')
        .select('*')
        .eq('client_id', cliente.id);

      log(`   🎁 Bônus: ${bonus?.length || 0}`, bonus && bonus.length > 0 ? 'green' : 'blue');
      
      if (bonus && bonus.length > 0) {
        bonus.forEach(b => {
          log(`      • ${b.title} - ${b.status}`, b.status === 'available' ? 'green' : 'blue');
        });
      }

      // Buscar avaliações
      const { data: reviews } = await supabase
        .from('reviews')
        .select('*')
        .eq('customer_id', cliente.id);

      log(`   ⭐ Avaliações: ${reviews?.length || 0}`, reviews && reviews.length > 0 ? 'green' : 'yellow');
      
      if (reviews && reviews.length > 0) {
        reviews.forEach(r => {
          log(`      • ${r.rating} ⭐ - "${r.comment?.substring(0, 30) || 'Sem comentário'}..."`, 'green');
        });
      }

      // VALIDAÇÃO: Atendimentos devem bater
      if (cliente.total_appointments !== (atendimentos?.length || 0)) {
        log(`   ❌ ERRO: total_appointments (${cliente.total_appointments}) ≠ atendimentos reais (${atendimentos?.length})`, 'red');
      } else {
        log(`   ✅ Atendimentos conferem`, 'green');
      }

      // VALIDAÇÃO: Avaliações para atendimentos avaliados
      const atendimentosAvaliados = atendimentos?.filter(a => a.has_review).length || 0;
      const avaliacoesReais = reviews?.length || 0;

      if (atendimentosAvaliados !== avaliacoesReais) {
        log(`   ❌ ERRO: Atendimentos avaliados (${atendimentosAvaliados}) ≠ avaliações (${avaliacoesReais})`, 'red');
      } else {
        log(`   ✅ Avaliações conferem`, 'green');
      }
    }

    // ============================================
    // RESULTADO FINAL
    // ============================================
    logSection('✅ DADOS GERADOS E VALIDADOS');

    log(`\n🎉 Todos os dados foram gerados com sucesso!`, 'green');
    log(`\n📋 Resumo:`, 'cyan');
    log(`   ✅ Cliente 1: Completo com avaliação`, 'green');
    log(`   ✅ Cliente 2: 2 atendimentos + bônus disponível`, 'green');
    log(`   ✅ Cliente 3: 1 atendimento PENDENTE de avaliação`, 'green');

    log(`\n🧪 Teste manual:`, 'cyan');
    log(`   1. Recepção: http://localhost:3005/recepcao`, 'blue');
    log(`      → Login: julia.atendente@bedeschi.com | teste123`, 'blue');
    log(`      → Aba Bônus → Selecionar clientes`, 'blue');
    log(`\n   2. Cliente 3 (pendente): http://localhost:3005/c/bedeschi`, 'blue');
    log(`      → Login: 11998003333 | PIN: 3333`, 'blue');
    log(`      → DEVE pedir avaliação primeiro`, 'blue');

  } catch (error) {
    log(`\n❌ ERRO: ${error.message}`, 'red');
    console.error(error);
  }
}

gerarDadosValidados();
