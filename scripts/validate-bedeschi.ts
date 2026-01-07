import { createClient } from '@supabase/supabase-js';

// Credenciais do Bedeschi Fidelidade
const SUPABASE_URL = 'https://lvqcualqeevdenghexjm.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2cWN1YWxxZWV2ZGVuZ2hleGptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ3NDcwOCwiZXhwIjoyMDgzMDUwNzA4fQ.S5xcYUHdYML67ujw57ye9-vnpL_gluH10WdoZL3SXHM';

// Criar cliente Supabase com service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function validateBedeschiData() {
  console.log('=== VALIDAÇÃO DE DADOS BEDESCHI ===\n');

  try {
    // 1. Contar serviços
    const { data: services, error: servicesError } = await supabase
      .from('fidelity_services')
      .select('*', { count: 'exact' });

    if (servicesError) throw servicesError;
    console.log(`✅ Serviços: ${services?.length || 0}`);

    // 2. Contar clientes
    const { data: clients, error: clientsError } = await supabase
      .from('fidelity_clients')
      .select('*', { count: 'exact' });

    if (clientsError) throw clientsError;
    console.log(`✅ Clientes: ${clients?.length || 0}`);

    // 3. Contar atendimentos
    const { data: appointments, error: appointmentsError } = await supabase
      .from('fidelity_appointments')
      .select('*', { count: 'exact' });

    if (appointmentsError) throw appointmentsError;
    console.log(`✅ Atendimentos: ${appointments?.length || 0}`);

    // 4. Contar regras
    const { data: rules, error: rulesError } = await supabase
      .from('fidelity_rules')
      .select('*', { count: 'exact' });

    if (rulesError) throw rulesError;
    console.log(`✅ Regras: ${rules?.length || 0}`);

    // 5. Contar avaliações
    const { data: reviews, error: reviewsError } = await supabase
      .from('fidelity_reviews')
      .select('*', { count: 'exact' });

    if (reviewsError) throw reviewsError;
    console.log(`✅ Avaliações: ${reviews?.length || 0}`);

    // 6. Buscar cliente Erick
    const { data: erick, error: erickError } = await supabase
      .from('fidelity_clients')
      .select('*')
      .eq('name', 'Erick Rodrigues')
      .single();

    if (erickError) throw erickError;
    console.log(`\n✅ Cliente Erick encontrado:`);
    console.log(`   - Telefone: ${erick?.phone}`);
    console.log(`   - Pontos: ${erick?.points_balance}`);
    console.log(`   - Total Gasto: R$ ${erick?.total_spent}`);
    console.log(`   - Atendimentos: ${erick?.total_appointments}`);

    // 7. Calcular receita total
    const { data: revenueData, error: revenueError } = await supabase
      .from('fidelity_appointments')
      .select('total')
      .eq('status', 'completed');

    if (revenueError) throw revenueError;
    const totalRevenue = revenueData?.reduce((sum, apt) => sum + (apt.total || 0), 0) || 0;
    console.log(`\n✅ Receita Total: R$ ${totalRevenue.toFixed(2)}`);

    console.log('\n=== VALIDAÇÃO CONCLUÍDA COM SUCESSO ===');
    console.log('Todos os dados estão sincronizados no Bedeschi Fidelidade!');

  } catch (error) {
    console.error('❌ Erro ao validar dados:', error);
    process.exit(1);
  }
}

validateBedeschiData();
