
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Carregar variáveis de ambiente
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Usar Service Role Key para garantir permissões totais no teste (simulando backend)
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas! Verifique NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFlow() {
  console.log('🚀 Iniciando Teste de Fluxo Completo (Sincronização)...');

  // 1. Criar Cliente de Teste
  const testClient = {
    name: 'Cliente Teste Flow',
    phone: '11999998888',
    pin: '1234',
    email: 'teste.flow@example.com',
    points_balance: 0,
    total_spent: 0,
    total_appointments: 0
  };

  console.log('1️⃣ Criando cliente...');
  // Limpar cliente anterior se existir
  const { data: existing } = await supabase.from('fidelity_clients').select('id').eq('phone', '11999998888').single();
  if (existing) {
    await supabase.from('fidelity_appointments').delete().eq('client_id', existing.id);
    await supabase.from('fidelity_rewards').delete().eq('client_id', existing.id);
    await supabase.from('fidelity_clients').delete().eq('id', existing.id);
    console.log('   🧹 Cliente anterior limpo.');
  }

  const { data: client, error: clientError } = await supabase
    .from('fidelity_clients')
    .insert(testClient)
    .select()
    .single();

  if (clientError || !client) {
    console.error('❌ Erro ao criar cliente:', clientError);
    return;
  }
  console.log(`   ✅ Cliente criado: ${client.name} (ID: ${client.id})`);

  // 2. Criar Atendimento
  console.log('2️⃣ Registrando atendimento...');
  const appointmentData = {
    client_id: client.id,
    // client_name: client.name, // Coluna não existe no banco
    professional_id: 'd0a33e38-163e-4075-aeb7-a46ce76e0331', // Usar um ID fictício ou buscar um existente
    // professional_name: 'Dra. Teste', // Coluna não existe no banco
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    status: 'completed',
    total: 200,
    points_earned: 200,
    has_review: false
  };

  const { data: appointment, error: aptError } = await supabase
    .from('fidelity_appointments')
    .insert(appointmentData)
    .select()
    .single();

  if (aptError || !appointment) {
    console.error('❌ Erro ao criar atendimento:', aptError);
    return;
  }
  console.log(`   ✅ Atendimento registrado (ID: ${appointment.id})`);

  // 3. Atualizar Estatísticas do Cliente (Simulando o AppContext)
  console.log('3️⃣ Atualizando estatísticas do cliente...');
  const { data: updatedClient, error: updateError } = await supabase
    .from('fidelity_clients')
    .update({
      points_balance: client.points_balance + appointment.points_earned,
      total_spent: client.total_spent + appointment.total,
      total_appointments: client.total_appointments + 1,
      last_visit: appointment.date
    })
    .eq('id', client.id)
    .select()
    .single();

  if (updateError || !updatedClient) {
    console.error('❌ Erro ao atualizar cliente:', updateError);
    return;
  }
  
  if (updatedClient.points_balance === 200 && updatedClient.total_appointments === 1) {
    console.log(`   ✅ Estatísticas atualizadas corretamente: ${updatedClient.points_balance} pontos, ${updatedClient.total_appointments} visitas.`);
  } else {
    console.error(`   ❌ Estatísticas incorretas!`, updatedClient);
  }

  // 4. Verificar Avaliação Pendente
  console.log('4️⃣ Verificando avaliação pendente...');
  const { data: pendingReview } = await supabase
    .from('fidelity_appointments')
    .select('*')
    .eq('client_id', client.id)
    .eq('status', 'completed')
    .eq('has_review', false)
    .single();

  if (pendingReview && pendingReview.id === appointment.id) {
    console.log('   ✅ Avaliação pendente encontrada corretamente.');
  } else {
    console.error('   ❌ Avaliação pendente NÃO encontrada.');
  }

  // 5. Simular Avaliação
  console.log('5️⃣ Registrando avaliação...');
  const { error: reviewError } = await supabase
    .from('fidelity_reviews')
    .insert({
      client_id: client.id,
      appointment_id: appointment.id,
      rating: 5,
      comment: 'Ótimo atendimento!'
    });
  
  if (reviewError) {
    console.error('❌ Erro ao salvar review:', reviewError);
  } else {
    // Atualizar flag no agendamento
    await supabase
      .from('fidelity_appointments')
      .update({ has_review: true })
      .eq('id', appointment.id);
    console.log('   ✅ Avaliação registrada e agendamento atualizado.');
  }

  console.log('🏁 Teste finalizado com sucesso!');
}

testFlow();
