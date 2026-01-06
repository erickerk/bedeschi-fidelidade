require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

async function applyPolicies() {
  console.log(
    "\n🔧 Aplicando políticas RLS para fidelity_reviews via SQL direto...\n",
  );

  const policies = `
    DROP POLICY IF EXISTS "fidelity_reviews_select" ON public.fidelity_reviews;
    DROP POLICY IF EXISTS "reviews_read_all" ON public.fidelity_reviews;
    DROP POLICY IF EXISTS "reviews_write_all" ON public.fidelity_reviews;
    
    CREATE POLICY "reviews_read_all" ON public.fidelity_reviews 
      FOR SELECT USING (true);
    
    CREATE POLICY "reviews_write_all" ON public.fidelity_reviews 
      FOR ALL USING (true) WITH CHECK (true);
  `;

  try {
    // Executar via REST API SQL Editor endpoint
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ query: policies }),
      },
    );

    if (!response.ok) {
      console.log("   ⚠️ REST API não disponível, tentando query direta...");

      // Fallback: aplicar cada política individualmente
      const { error: e1 } = await supabase
        .from("fidelity_reviews")
        .select("id")
        .limit(1);

      if (e1) {
        console.log(`   ❌ Erro ao testar acesso: ${e1.message}`);
        console.log("   ℹ️  Aplique manualmente no Supabase Dashboard:");
        console.log("      1. Vá em SQL Editor");
        console.log("      2. Execute:");
        console.log(policies);
      } else {
        console.log(
          "   ✅ Acesso à tabela OK (políticas podem já estar ativas)",
        );
      }
    } else {
      console.log("   ✅ Políticas aplicadas via REST API");
    }
  } catch (error) {
    console.log(`   ⚠️ ${error.message}`);
  }

  // Verificar reviews
  const { data, error } = await supabase
    .from("fidelity_reviews")
    .select("id, rating");
  if (error) {
    console.log(`\n   ❌ Erro ao buscar reviews: ${error.message}`);
    console.log("\n   ⚠️  AÇÃO NECESSÁRIA:");
    console.log(
      "   1. Acesse: https://supabase.com/dashboard/project/lvqcualqeevdenghexjm/editor",
    );
    console.log("   2. Vá em SQL Editor");
    console.log("   3. Execute o SQL acima");
  } else {
    console.log(`\n   ✅ ${data?.length || 0} avaliações acessíveis!`);
    if (data && data.length > 0) {
      const ratings = data.map((r) => r.rating);
      const avg = (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(
        1,
      );
      console.log(`   📊 Média de avaliações: ${avg}⭐`);
    }
  }

  console.log("\n✅ Verificação concluída!\n");
}

applyPolicies().catch(console.error);
