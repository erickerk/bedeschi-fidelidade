require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function fixReviewsRLS() {
  console.log('\n🔧 Aplicando políticas RLS para fidelity_reviews...\n');
  
  // Drop existing policies
  const dropPolicies = [
    `DROP POLICY IF EXISTS "fidelity_reviews_select" ON public.fidelity_reviews;`,
    `DROP POLICY IF EXISTS "reviews_read_all" ON public.fidelity_reviews;`,
    `DROP POLICY IF EXISTS "reviews_write_all" ON public.fidelity_reviews;`,
  ];
  
  for (const sql of dropPolicies) {
    const { error } = await supabase.rpc('exec_sql', { query: sql });
    if (error) console.log(`   ⚠️ ${error.message}`);
  }
  
  // Create new permissive policies
  const createPolicies = [
    {
      name: 'reviews_read_all',
      sql: `CREATE POLICY "reviews_read_all" ON public.fidelity_reviews FOR SELECT USING (true);`
    },
    {
      name: 'reviews_write_all', 
      sql: `CREATE POLICY "reviews_write_all" ON public.fidelity_reviews FOR ALL USING (true) WITH CHECK (true);`
    }
  ];
  
  for (const policy of createPolicies) {
    const { error } = await supabase.rpc('exec_sql', { query: policy.sql });
    if (error) {
      console.log(`   ❌ ${policy.name}: ${error.message}`);
    } else {
      console.log(`   ✅ ${policy.name} criada`);
    }
  }
  
  // Verify reviews exist
  const { data, error } = await supabase.from('fidelity_reviews').select('id');
  if (error) {
    console.log(`\n   ❌ Erro ao verificar reviews: ${error.message}`);
  } else {
    console.log(`\n   ✅ ${data?.length || 0} avaliações encontradas no banco`);
  }
  
  console.log('\n✅ Políticas RLS aplicadas!\n');
}

fixReviewsRLS().catch(console.error);
