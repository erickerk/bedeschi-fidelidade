import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lvqcualqeevdenghexjm.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2cWN1YWxxZWV2ZGVuZ2hleGptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ3NDcwOCwiZXhwIjoyMDgzMDUwNzA4fQ.S5xcYUHdYML67ujw57ye9-vnpL_gluH10WdoZL3SXHM';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testReviewsJoin() {
  console.log('=== TESTE DE JOIN REVIEWS ===\n');

  // 1. Query original (sem join)
  const { data: reviews1, error: error1 } = await supabase
    .from('fidelity_reviews')
    .select('*');

  console.log('Query SEM JOIN:');
  console.log(`  Total: ${reviews1?.length || 0}`);
  console.log(`  Erro: ${error1?.message || 'Nenhum'}`);

  // 2. Query com INNER join (atual)
  const { data: reviews2, error: error2 } = await supabase
    .from('fidelity_reviews')
    .select(`
      *,
      appointment:fidelity_appointments!inner(professional_id, professional_name)
    `);

  console.log('\nQuery COM INNER JOIN:');
  console.log(`  Total: ${reviews2?.length || 0}`);
  console.log(`  Erro: ${error2?.message || 'Nenhum'}`);

  // 3. Query com LEFT join (deve funcionar)
  const { data: reviews3, error: error3 } = await supabase
    .from('fidelity_reviews')
    .select(`
      *,
      appointment:fidelity_appointments(professional_id, professional_name)
    `);

  console.log('\nQuery COM LEFT JOIN:');
  console.log(`  Total: ${reviews3?.length || 0}`);
  console.log(`  Erro: ${error3?.message || 'Nenhum'}`);
  if (reviews3 && reviews3.length > 0) {
    console.log('  Exemplo:', reviews3[0]);
  }
}

testReviewsJoin();
