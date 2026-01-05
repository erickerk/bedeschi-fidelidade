/**
 * Script para resetar e popular dados consistentes no Supabase
 * Projeto: Bedeschi Fidelidade
 */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function cleanTables() {
  console.log('🧹 Limpando tabelas de dados fake (preservando usuários criados)...\n');
  
  // IMPORTANTE: NÃO deletar:
  // - auth.users (usuários do Supabase Auth)
  // - staff_users (usuários criados via Admin - PERSISTENTES)
  const tables = [
    'fidelity_reviews',
    'fidelity_appointment_services',
    'fidelity_appointments',
    'fidelity_rewards',
    'fidelity_clients'
  ];
  
  for (const table of tables) {
    const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) {
      console.log(`   ⚠️ ${table}: ${error.message}`);
    } else {
      console.log(`   ✅ ${table} limpa`);
    }
  }
  
  console.log('   ℹ️  Usuários do sistema preservados:');
  console.log('      - auth.users (Supabase Auth)');
  console.log('      - staff_users (Criados pelo Admin) ⭐');
}

async function seedClients() {
  console.log('\n👥 Inserindo clientes...\n');
  
  const clients = [
    { name: 'Maria Silva', phone: '11999887766', pin: '7766', email: 'maria.silva@email.com', points_balance: 0, total_spent: 0, total_appointments: 0 },
    { name: 'Ana Santos', phone: '11988776655', pin: '6655', email: 'ana.santos@email.com', points_balance: 0, total_spent: 0, total_appointments: 0 },
    { name: 'Carla Oliveira', phone: '11977665544', pin: '5544', email: 'carla.oliveira@email.com', points_balance: 0, total_spent: 0, total_appointments: 0 },
    { name: 'Juliana Costa', phone: '11966554433', pin: '4433', email: 'juliana.costa@email.com', points_balance: 0, total_spent: 0, total_appointments: 0 },
    { name: 'Patricia Lima', phone: '11955443322', pin: '3322', email: 'patricia.lima@email.com', points_balance: 0, total_spent: 0, total_appointments: 0 },
    { name: 'Fernanda Souza', phone: '11944332211', pin: '2211', email: 'fernanda.souza@email.com', points_balance: 0, total_spent: 0, total_appointments: 0 },
    { name: 'Beatriz Martins', phone: '11933221100', pin: '1100', email: 'beatriz.martins@email.com', points_balance: 0, total_spent: 0, total_appointments: 0 },
    { name: 'Renata Almeida', phone: '11922110099', pin: '0099', email: 'renata.almeida@email.com', points_balance: 0, total_spent: 0, total_appointments: 0 }
  ];
  
  const inserted = [];
  for (const client of clients) {
    const { data, error } = await supabase.from('fidelity_clients').insert(client).select().single();
    if (error) {
      console.log(`   ❌ ${client.name}: ${error.message}`);
    } else {
      console.log(`   ✅ ${client.name} (ID: ${data.id.slice(0, 8)}...)`);
      inserted.push(data);
    }
  }
  return inserted;
}

async function seedAppointments(clients) {
  console.log('\n📅 Inserindo atendimentos...\n');
  
  const professionals = [
    { id: 'prof-1', name: 'Juliana Lima' },
    { id: 'prof-2', name: 'Carla Santos' },
    { id: 'prof-3', name: 'Patricia Alves' },
    { id: 'prof-4', name: 'Dra. Amanda Costa' }
  ];
  
  const servicesData = [
    { name: 'Massagem Relaxante 60min', price: 180, category: 'Massagens' },
    { name: 'Limpeza de Pele', price: 150, category: 'Facial' },
    { name: 'Depilação Perna Completa', price: 120, category: 'Depilação' },
    { name: 'Design de Sobrancelhas', price: 65, category: 'Sobrancelhas' },
    { name: 'Alongamento de Cílios', price: 280, category: 'Cílios' },
    { name: 'Manicure Completa', price: 45, category: 'Manicure' },
    { name: 'Pedicure Completa', price: 55, category: 'Pedicure' },
    { name: 'Hidratação Capilar', price: 120, category: 'Tratamentos' }
  ];
  
  // Gerar atendimentos nos últimos 90 dias (mais dados)
  const appointments = [];
  const today = new Date();
  
  for (let i = 0; i < 50; i++) {
    const daysAgo = Math.floor(Math.random() * 90);
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    
    const client = clients[Math.floor(Math.random() * clients.length)];
    const professional = professionals[Math.floor(Math.random() * professionals.length)];
    
    // Selecionar 1-3 serviços aleatórios
    const numServices = Math.floor(Math.random() * 3) + 1;
    const selectedServices = [];
    for (let j = 0; j < numServices; j++) {
      const svc = servicesData[Math.floor(Math.random() * servicesData.length)];
      if (!selectedServices.find(s => s.name === svc.name)) {
        selectedServices.push(svc);
      }
    }
    
    const total = selectedServices.reduce((sum, s) => sum + s.price, 0);
    const hasReview = Math.random() > 0.2; // 80% com avaliação
    
    // Variar avaliações: 10% ruins (1-2), 20% médias (3), 70% boas (4-5)
    let rating = 5;
    if (hasReview) {
      const rand = Math.random();
      if (rand < 0.10) rating = Math.random() < 0.5 ? 1 : 2; // 10% ruins
      else if (rand < 0.30) rating = 3; // 20% médias
      else rating = Math.random() < 0.6 ? 4 : 5; // 70% boas
    }
    
    appointments.push({
      client_id: client.id,
      professional_id: professional.id,
      professional_name: professional.name,
      date: date.toISOString().split('T')[0],
      time: `${9 + Math.floor(Math.random() * 9)}:00`,
      status: 'completed',
      total,
      points_earned: total,
      has_review: hasReview,
      review_rating: hasReview ? rating : null,
      review_comment: hasReview ? 'Ótimo atendimento!' : null,
      services: selectedServices
    });
  }
  
  // Ordenar por data
  appointments.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  const inserted = [];
  for (const apt of appointments) {
    const services = apt.services;
    delete apt.services;
    
    const { data, error } = await supabase.from('fidelity_appointments').insert(apt).select().single();
    if (error) {
      console.log(`   ❌ ${apt.date}: ${error.message}`);
    } else {
      // Inserir serviços
      for (const svc of services) {
        await supabase.from('fidelity_appointment_services').insert({
          appointment_id: data.id,
          service_name: svc.name,
          price: svc.price
        });
      }
      console.log(`   ✅ ${apt.date} - ${services.map(s => s.name).join(', ')} (R$ ${apt.total})`);
      inserted.push({ ...data, services });
    }
  }
  
  return inserted;
}

async function updateClientStats(clients, appointments) {
  console.log('\n📊 Atualizando estatísticas dos clientes...\n');
  
  for (const client of clients) {
    const clientAppts = appointments.filter(a => a.client_id === client.id);
    const totalSpent = clientAppts.reduce((sum, a) => sum + a.total, 0);
    const pointsBalance = clientAppts.reduce((sum, a) => sum + a.points_earned, 0);
    const totalAppointments = clientAppts.length;
    const lastVisit = clientAppts.length > 0 ? clientAppts[0].date : null;
    
    const { error } = await supabase.from('fidelity_clients').update({
      points_balance: pointsBalance,
      total_spent: totalSpent,
      total_appointments: totalAppointments,
      last_visit: lastVisit
    }).eq('id', client.id);
    
    if (error) {
      console.log(`   ❌ ${client.name}: ${error.message}`);
    } else {
      console.log(`   ✅ ${client.name}: ${totalAppointments} atendimentos, R$ ${totalSpent}, ${pointsBalance} pts`);
    }
  }
}

async function seedReviews(appointments) {
  console.log('\n⭐ Inserindo avaliações...\n');
  
  // Avaliar 80% dos atendimentos
  const toReview = appointments.filter(a => a.has_review);
  
  for (const apt of toReview) {
    const rating = apt.review_rating || 5;
    
    // Comentários baseados na nota
    const commentsByRating = {
      1: [
        'Péssimo atendimento, muito insatisfeita.',
        'Não gostei do resultado, não volto mais.',
        'Profissional despreparada, experiência terrível.'
      ],
      2: [
        'Deixou a desejar, esperava mais.',
        'Atendimento fraco, não recomendo.',
        'Resultado abaixo das expectativas.'
      ],
      3: [
        'Atendimento ok, nada de especial.',
        'Esperava um pouco mais pela qualidade.',
        'Razoável, mas já vi melhor.'
      ],
      4: [
        'Bom atendimento, satisfeita com o resultado.',
        'Gostei, profissional competente.',
        'Atendimento agradável e bom resultado.',
        'Muito bom, voltarei mais vezes.'
      ],
      5: [
        'Excelente atendimento! Profissional muito atenciosa.',
        'Adorei o resultado, voltarei com certeza!',
        'Ambiente agradável e equipe muito educada.',
        'Serviço impecável, recomendo!',
        'Muito satisfeita com o procedimento.',
        'Ótima experiência, profissional muito competente.',
        'Atendimento maravilhoso, superou expectativas!',
        'Ambiente aconchegante e resultado perfeito.',
        'Profissional dedicada e cuidadosa.',
        'Adorei! Com certeza voltarei mais vezes.',
        'Perfeito! Melhor experiência que já tive.',
        'Impecável do início ao fim!'
      ]
    };
    
    const comments = commentsByRating[rating] || commentsByRating[5];
    
    const { error } = await supabase.from('fidelity_reviews').insert({
      appointment_id: apt.id,
      client_id: apt.client_id,
      rating,
      comment: comments[Math.floor(Math.random() * comments.length)],
      created_at: apt.date
    });
    
    if (error) {
      console.log(`   ❌ Avaliação ${apt.date}: ${error.message}`);
    } else {
      console.log(`   ✅ Avaliação ${apt.date}: ${rating}⭐`);
    }
  }
}

async function seedRewards(clients) {
  console.log('\n🎁 Inserindo recompensas...\n');
  
  const rewardTypes = [
    { title: 'Bônus de Boas-Vindas', description: 'R$ 30 de crédito para sua primeira visita', type: 'DISCOUNT_VALUE', value: 30 },
    { title: 'Massagem Grátis', description: 'Uma massagem relaxante de 30 minutos', type: 'FREE_SERVICE', value: 0, service_name: 'Massagem Relaxante 30min' },
    { title: '20% de Desconto', description: 'Desconto de 20% no próximo serviço', type: 'DISCOUNT_PERCENT', value: 20 }
  ];
  
  // Dar uma recompensa para os 2 primeiros clientes
  for (let i = 0; i < Math.min(2, clients.length); i++) {
    const client = clients[i];
    const reward = rewardTypes[i % rewardTypes.length];
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 60);
    
    const { error } = await supabase.from('fidelity_rewards').insert({
      client_id: client.id,
      title: reward.title,
      description: reward.description,
      type: reward.type,
      value: reward.value,
      service_name: reward.service_name || null,
      status: 'available',
      expires_at: expiresAt.toISOString().split('T')[0]
    });
    
    if (error) {
      console.log(`   ❌ ${client.name}: ${error.message}`);
    } else {
      console.log(`   ✅ ${client.name}: ${reward.title}`);
    }
  }
}

async function verifyData() {
  console.log('\n' + '═'.repeat(50));
  console.log('🔍 VERIFICAÇÃO FINAL\n');
  
  const checks = [
    { name: 'Clientes', table: 'fidelity_clients' },
    { name: 'Atendimentos', table: 'fidelity_appointments' },
    { name: 'Serviços de Atend.', table: 'fidelity_appointment_services' },
    { name: 'Recompensas', table: 'fidelity_rewards' },
    { name: 'Avaliações', table: 'fidelity_reviews' },
    { name: 'Regras', table: 'fidelity_rules' }
  ];
  
  for (const check of checks) {
    const { data, error } = await supabase.from(check.table).select('id');
    if (error) {
      console.log(`   ❌ ${check.name}: ${error.message}`);
    } else {
      console.log(`   ✅ ${check.name}: ${data?.length || 0} registros`);
    }
  }
  
  // Estatísticas
  console.log('\n📈 ESTATÍSTICAS:');
  
  const { data: appts } = await supabase.from('fidelity_appointments').select('total, date');
  if (appts && appts.length > 0) {
    const totalRevenue = appts.reduce((sum, a) => sum + (a.total || 0), 0);
    const last30 = appts.filter(a => {
      const date = new Date(a.date);
      const now = new Date();
      return (now - date) / (1000 * 60 * 60 * 24) <= 30;
    });
    const last7 = appts.filter(a => {
      const date = new Date(a.date);
      const now = new Date();
      return (now - date) / (1000 * 60 * 60 * 24) <= 7;
    });
    
    console.log(`   💰 Receita total: R$ ${totalRevenue.toFixed(2)}`);
    console.log(`   📅 Atendimentos (30 dias): ${last30.length}`);
    console.log(`   📅 Atendimentos (7 dias): ${last7.length}`);
  }
}

async function main() {
  console.log('🚀 RESET E SEED DO BANCO DE DADOS\n');
  console.log('Projeto: Bedeschi Fidelidade');
  console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('═'.repeat(50) + '\n');
  
  await cleanTables();
  const clients = await seedClients();
  const appointments = await seedAppointments(clients);
  await updateClientStats(clients, appointments);
  await seedReviews(appointments);
  await seedRewards(clients);
  await verifyData();
  
  console.log('\n' + '═'.repeat(50));
  console.log('✅ BANCO DE DADOS POPULADO COM SUCESSO!');
  console.log('═'.repeat(50) + '\n');
}

main().catch(console.error);
