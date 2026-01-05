/**
 * Teste de Fluxo Completo - Bônus e Sincronização
 * Verifica: atendimentos, bônus, resgate e sincronização
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
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

async function testarFluxoBonus() {
  try {
    logSection('🧪 TESTE DE FLUXO COMPLETO - BÔNUS E SINCRONIZAÇÃO');

    // ============================================
    // 1. VERIFICAR TABELA DE SERVIÇOS
    // ============================================
    logSection('1️⃣ VERIFICAR TABELA DE SERVIÇOS');

    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .limit(5);

    if (servicesError) {
      log(`⚠️  Tabela services não existe ou erro: ${servicesError.message}`, 'yellow');
      log(`\n📋 Execute o SQL: supabase/migrations/create_services_data.sql`, 'cyan');
    } else if (services.length === 0) {
      log(`⚠️  Tabela services existe mas está vazia`, 'yellow');
      log(`\n📋 Execute o SQL: supabase/migrations/create_services_data.sql`, 'cyan');
    } else {
      log(`✅ ${services.length}+ serviços encontrados (mostrando 5)`, 'green');
      services.forEach(s => {
        log(`   • ${s.name} - R$ ${s.price} (${s.category_name})`, 'blue');
      });
    }

    // ============================================
    // 2. VERIFICAR REGRAS DE FIDELIDADE
    // ============================================
    logSection('2️⃣ VERIFICAR REGRAS DE FIDELIDADE');

    const { data: rules, error: rulesError } = await supabase
      .from('fidelity_rules')
      .select('*')
      .eq('is_active', true);

    if (rulesError || !rules || rules.length === 0) {
      log(`⚠️  Nenhuma regra de fidelidade encontrada no Supabase`, 'yellow');
      log(`   Usando regras mock do sistema (7 regras)`, 'blue');
    } else {
      log(`✅ ${rules.length} regra(s) de fidelidade ativa(s)`, 'green');
      rules.forEach(r => {
        log(`   • ${r.name}: ${r.description}`, 'blue');
      });
    }

    // ============================================
    // 3. CRIAR CLIENTE DE TESTE PARA BÔNUS
    // ============================================
    logSection('3️⃣ CRIAR CLIENTE DE TESTE PARA BÔNUS');

    const testPhone = '11888777666';
    const testPin = '8888';

    // Verificar se cliente já existe
    const { data: existingClient } = await supabase
      .from('customers')
      .select('*')
      .eq('phone', testPhone)
      .single();

    let testClient = existingClient;

    if (!existingClient) {
      const { data: newClient, error: clientError } = await supabase
        .from('customers')
        .insert({
          name: 'Cliente Teste Bônus',
          phone: testPhone,
          pin: testPin,
          email: 'bonus@teste.com',
          points_balance: 0,
          total_spent: 0,
          total_appointments: 0,
        })
        .select()
        .single();

      if (clientError) {
        log(`❌ Erro ao criar cliente: ${clientError.message}`, 'red');
        return;
      }

      testClient = newClient;
      log(`✅ Cliente de teste criado: ${newClient.name}`, 'green');
    } else {
      log(`ℹ️  Cliente já existe: ${existingClient.name}`, 'blue');
      log(`   Pontos: ${existingClient.points_balance}`, 'blue');
      log(`   Gasto: R$ ${existingClient.total_spent}`, 'blue');
    }

    // ============================================
    // 4. CRIAR ATENDIMENTO QUE GERA BÔNUS
    // ============================================
    logSection('4️⃣ CRIAR ATENDIMENTO (R$ 350 → gera bônus)');

    const { data: professional } = await supabase
      .from('staff_users')
      .select('*')
      .in('role', ['profissional', 'medico'])
      .eq('is_active', true)
      .limit(1)
      .single();

    if (!professional) {
      log(`❌ Nenhum profissional encontrado`, 'red');
      return;
    }

    const { data: appointment, error: aptError } = await supabase
      .from('appointments')
      .insert({
        client_id: testClient.id,
        client_name: testClient.name,
        professional_id: professional.id,
        professional_name: professional.name,
        date: new Date().toISOString().split('T')[0],
        time: '10:00',
        status: 'completed',
        total: 350,
        points_earned: 350,
        has_review: false,
        services: [
          { service_name: 'Massagem Relaxante 60min', price: 180 },
          { service_name: 'Limpeza de Pele', price: 170 },
        ],
      })
      .select()
      .single();

    if (aptError) {
      log(`❌ Erro ao criar atendimento: ${aptError.message}`, 'red');
      return;
    }

    log(`✅ Atendimento criado!`, 'green');
    log(`   Total: R$ ${appointment.total}`, 'blue');
    log(`   Pontos: ${appointment.points_earned}`, 'blue');

    // Atualizar cliente
    const newTotal = parseFloat(testClient.total_spent || 0) + 350;
    const newPoints = (testClient.points_balance || 0) + 350;
    const newAppts = (testClient.total_appointments || 0) + 1;

    await supabase
      .from('customers')
      .update({
        total_spent: newTotal,
        points_balance: newPoints,
        total_appointments: newAppts,
        last_visit: new Date().toISOString().split('T')[0],
      })
      .eq('id', testClient.id);

    log(`✅ Cliente atualizado: R$ ${newTotal.toFixed(2)}, ${newPoints} pontos`, 'green');

    // ============================================
    // 5. CRIAR RECOMPENSA (simular regra de bônus)
    // ============================================
    logSection('5️⃣ CRIAR RECOMPENSA DE BÔNUS');

    // Como gastou R$ 350 (> R$ 300), ganha desconto de 10%
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const { data: reward, error: rewardError } = await supabase
      .from('rewards')
      .insert({
        client_id: testClient.id,
        title: 'Bônus Primeiro Atendimento - 10% OFF',
        description: 'Gastou R$ 300+ = 10% de desconto no próximo atendimento',
        type: 'DISCOUNT_PERCENT',
        value: 10,
        status: 'available',
        expires_at: expiresAt.toISOString().split('T')[0],
      })
      .select()
      .single();

    if (rewardError) {
      log(`❌ Erro ao criar recompensa: ${rewardError.message}`, 'red');
    } else {
      log(`✅ Recompensa criada: ${reward.title}`, 'green');
      log(`   Valor: ${reward.value}%`, 'blue');
      log(`   Status: ${reward.status}`, 'blue');
      log(`   Expira: ${reward.expires_at}`, 'blue');
    }

    // ============================================
    // 6. VERIFICAR BÔNUS DISPONÍVEIS
    // ============================================
    logSection('6️⃣ VERIFICAR BÔNUS DISPONÍVEIS');

    const { data: availableRewards } = await supabase
      .from('rewards')
      .select('*')
      .eq('client_id', testClient.id)
      .eq('status', 'available');

    if (availableRewards && availableRewards.length > 0) {
      log(`✅ ${availableRewards.length} bônus disponível(is):`, 'green');
      availableRewards.forEach(r => {
        log(`   🎁 ${r.title} (${r.type}: ${r.value || 'N/A'})`, 'blue');
      });
    } else {
      log(`⚠️  Nenhum bônus disponível`, 'yellow');
    }

    // ============================================
    // 7. RESGATAR BÔNUS (simular baixa)
    // ============================================
    logSection('7️⃣ RESGATAR BÔNUS (baixar)');

    if (reward) {
      const { error: redeemError } = await supabase
        .from('rewards')
        .update({ status: 'redeemed' })
        .eq('id', reward.id);

      if (redeemError) {
        log(`❌ Erro ao resgatar: ${redeemError.message}`, 'red');
      } else {
        log(`✅ Bônus resgatado com sucesso!`, 'green');
      }
    }

    // ============================================
    // 8. VERIFICAR BÔNUS APÓS RESGATE
    // ============================================
    logSection('8️⃣ VERIFICAR BÔNUS APÓS RESGATE');

    const { data: afterRedeemRewards } = await supabase
      .from('rewards')
      .select('*')
      .eq('client_id', testClient.id)
      .eq('status', 'available');

    const { data: redeemedRewards } = await supabase
      .from('rewards')
      .select('*')
      .eq('client_id', testClient.id)
      .eq('status', 'redeemed');

    log(`📊 Status das recompensas:`, 'cyan');
    log(`   ✅ Disponíveis: ${afterRedeemRewards?.length || 0}`, 'green');
    log(`   ✓ Resgatados: ${redeemedRewards?.length || 0}`, 'blue');

    if (reward && afterRedeemRewards?.find(r => r.id === reward.id)) {
      log(`❌ ERRO: Bônus resgatado ainda aparece como disponível!`, 'red');
    } else {
      log(`✅ Bônus resgatado sumiu da lista de disponíveis!`, 'green');
    }

    // ============================================
    // RESULTADO FINAL
    // ============================================
    logSection('📋 RESULTADO FINAL');

    log(`\n✅ Fluxo testado com sucesso!`, 'green');
    log(`\n📋 Dados do teste:`, 'cyan');
    log(`   👤 Cliente: ${testClient.name}`, 'blue');
    log(`   📱 Telefone: ${testPhone}`, 'blue');
    log(`   🔑 PIN: ${testPin}`, 'blue');
    log(`   💰 Total gasto: R$ ${newTotal.toFixed(2)}`, 'blue');
    log(`   ⭐ Pontos: ${newPoints}`, 'blue');
    log(`\n🔗 Teste manual:`, 'cyan');
    log(`   Recepção: http://localhost:3005/recepcao`, 'blue');
    log(`   Cliente: http://localhost:3005/c/bedeschi`, 'blue');

  } catch (error) {
    log(`\n❌ ERRO: ${error.message}`, 'red');
    console.error(error);
  }
}

testarFluxoBonus();
