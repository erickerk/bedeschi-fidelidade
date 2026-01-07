import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lvqcualqeevdenghexjm.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2cWN1YWxxZWV2ZGVuZ2hleGptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ3NDcwOCwiZXhwIjoyMDgzMDUwNzA4fQ.S5xcYUHdYML67ujw57ye9-vnpL_gluH10WdoZL3SXHM';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function debugReviews() {
  console.log('=== DEBUG AVALIAÇÕES ===\n');

  // 1. Verificar estrutura da tabela reviews
  const { data: reviews, error: reviewsError } = await supabase
    .from('fidelity_reviews')
    .select('*')
    .limit(5);

  console.log('📋 ESTRUTURA DA TABELA fidelity_reviews:');
  if (reviewsError) {
    console.error('❌ Erro:', reviewsError);
  } else {
    console.log('Total de avaliações:', reviews?.length || 0);
    if (reviews && reviews.length > 0) {
      console.log('\nExemplo de registro:');
      console.log(JSON.stringify(reviews[0], null, 2));
      console.log('\nCampos disponíveis:');
      console.log(Object.keys(reviews[0]));
    }
  }

  // 2. Verificar appointments com professional_id
  console.log('\n📋 ATENDIMENTOS COM PROFISSIONAIS:');
  const { data: appointments, error: aptError } = await supabase
    .from('fidelity_appointments')
    .select('id, professional_id, professional_name, client_id, client_name, date')
    .not('professional_id', 'is', null)
    .limit(5);

  if (aptError) {
    console.error('❌ Erro:', aptError);
  } else {
    console.log(`Total com profissional: ${appointments?.length || 0}`);
    if (appointments && appointments.length > 0) {
      console.log('\nExemplo:');
      console.log(appointments[0]);
    }
  }

  // 3. Calcular média de avaliações
  console.log('\n📊 CÁLCULO DE MÉDIA:');
  const { data: allReviews } = await supabase
    .from('fidelity_reviews')
    .select('rating');

  if (allReviews && allReviews.length > 0) {
    const total = allReviews.reduce((sum, r) => sum + (r.rating || 0), 0);
    const avg = total / allReviews.length;
    console.log(`Total de avaliações: ${allReviews.length}`);
    console.log(`Soma das notas: ${total}`);
    console.log(`Média calculada: ${avg.toFixed(1)}`);
  } else {
    console.log('❌ Nenhuma avaliação encontrada');
  }

  // 4. Verificar reviews com join de appointments
  console.log('\n🔗 REVIEWS COM DADOS DOS ATENDIMENTOS:');
  const { data: reviewsWithApt } = await supabase
    .from('fidelity_reviews')
    .select(`
      *,
      appointment:fidelity_appointments(professional_id, professional_name)
    `)
    .limit(3);

  if (reviewsWithApt && reviewsWithApt.length > 0) {
    console.log('Exemplo com join:');
    console.log(JSON.stringify(reviewsWithApt[0], null, 2));
  }

  // 5. Ranking por profissional
  console.log('\n⭐ RANKING DE PROFISSIONAIS:');
  const { data: reviewsByProf } = await supabase
    .from('fidelity_reviews')
    .select(`
      rating,
      appointment:fidelity_appointments!inner(professional_name, professional_id)
    `);

  if (reviewsByProf) {
    const profStats: any = {};
    reviewsByProf.forEach((r: any) => {
      const profName = r.appointment?.professional_name || 'N/A';
      if (!profStats[profName]) {
        profStats[profName] = { total: 0, count: 0 };
      }
      profStats[profName].total += r.rating || 0;
      profStats[profName].count++;
    });

    Object.entries(profStats)
      .map(([name, stats]: [string, any]) => ({
        name,
        avg: stats.total / stats.count,
        count: stats.count
      }))
      .sort((a, b) => b.avg - a.avg)
      .forEach(prof => {
        console.log(`  ${prof.name}: ${prof.avg.toFixed(1)} ⭐ (${prof.count} avaliações)`);
      });
  }
}

debugReviews();
