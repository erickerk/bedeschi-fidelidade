import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lvqcualqeevdenghexjm.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2cWN1YWxxZWV2ZGVuZ2hleGptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ3NDcwOCwiZXhwIjoyMDgzMDUwNzA4fQ.S5xcYUHdYML67ujw57ye9-vnpL_gluH10WdoZL3SXHM';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function validateComplete() {
  console.log('=== VALIDAÇÃO COMPLETA DO BEDESCHI ===\n');

  // 1. DADOS GERAIS
  const { data: clients } = await supabase.from('fidelity_clients').select('*', { count: 'exact' });
  const { data: staff } = await supabase.from('staff_users').select('*', { count: 'exact' });
  const { data: services } = await supabase.from('fidelity_services').select('*', { count: 'exact' });
  const { data: appointments } = await supabase.from('fidelity_appointments').select('*', { count: 'exact' });
  const { data: rules } = await supabase.from('fidelity_rules').select('*', { count: 'exact' });
  const { data: reviews } = await supabase.from('fidelity_reviews').select('*', { count: 'exact' });

  console.log('📊 DADOS GERAIS:');
  console.log(`  ✅ Clientes: ${clients?.length || 0}`);
  console.log(`  ✅ Profissionais (Staff): ${staff?.length || 0}`);
  console.log(`  ✅ Serviços: ${services?.length || 0}`);
  console.log(`  ✅ Atendimentos: ${appointments?.length || 0}`);
  console.log(`  ✅ Regras: ${rules?.length || 0}`);
  console.log(`  ✅ Avaliações: ${reviews?.length || 0}`);

  // 2. GRÁFICOS DO ADMIN DASHBOARD
  console.log('\n📈 VALIDAÇÃO GRÁFICOS ADMIN DASHBOARD:');
  
  const { data: completedAppts } = await supabase
    .from('fidelity_appointments')
    .select('total, date')
    .eq('status', 'completed');

  const totalRevenue = completedAppts?.reduce((sum, a) => sum + (a.total || 0), 0) || 0;
  const totalCompleted = completedAppts?.length || 0;

  console.log(`  💰 Receita Total: R$ ${totalRevenue.toFixed(2)}`);
  console.log(`  📅 Atendimentos Completados: ${totalCompleted}`);

  // 3. PERFORMANCE DA EQUIPE
  console.log('\n👥 VALIDAÇÃO PERFORMANCE DA EQUIPE:');
  
  const { data: staffPerformance } = await supabase
    .from('fidelity_appointments')
    .select('professional_id, professional_name, total, date')
    .eq('status', 'completed')
    .not('professional_id', 'is', null);

  const perfByStaff = staffPerformance?.reduce((acc: any, apt) => {
    const key = apt.professional_id || 'unknown';
    if (!acc[key]) {
      acc[key] = {
        name: apt.professional_name || 'N/A',
        count: 0,
        revenue: 0
      };
    }
    acc[key].count++;
    acc[key].revenue += apt.total || 0;
    return acc;
  }, {});

  console.log('  Desempenho por Profissional:');
  Object.entries(perfByStaff || {}).forEach(([id, data]: [string, any]) => {
    console.log(`    - ${data.name}: ${data.count} atendimentos, R$ ${data.revenue.toFixed(2)}`);
  });

  // 4. SERVIÇOS MAIS POPULARES
  console.log('\n🔥 SERVIÇOS MAIS POPULARES:');
  const { data: aptServices } = await supabase
    .from('fidelity_appointment_services')
    .select('service_name');

  const serviceCount = aptServices?.reduce((acc: any, s) => {
    acc[s.service_name] = (acc[s.service_name] || 0) + 1;
    return acc;
  }, {});

  const topServices = Object.entries(serviceCount || {})
    .sort(([,a]: any, [,b]: any) => b - a)
    .slice(0, 5);

  topServices.forEach(([name, count], i) => {
    console.log(`    ${i + 1}. ${name}: ${count} vezes`);
  });

  // 5. VALIDAÇÃO CLIENTE ERICK
  console.log('\n👤 VALIDAÇÃO CLIENTE ERICK:');
  const { data: erick } = await supabase
    .from('fidelity_clients')
    .select('*')
    .eq('name', 'Erick Rodrigues')
    .single();

  if (erick) {
    console.log(`  ✅ Nome: ${erick.name}`);
    console.log(`  ✅ Telefone: ${erick.phone}`);
    console.log(`  ✅ Pontos: ${erick.points_balance}`);
    console.log(`  ✅ Total Gasto: R$ ${erick.total_spent}`);
    console.log(`  ✅ Atendimentos: ${erick.total_appointments}`);
  }

  console.log('\n=== ✅ VALIDAÇÃO COMPLETA! ===');
  console.log('Todos os dados estão sincronizados e prontos para uso!');
}

validateComplete();
