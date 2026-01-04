/**
 * Teste rápido de conexão e dados do Supabase
 */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function testAll() {
  console.log('🔍 Testando dados no Supabase...\n');

  // Clientes
  const { data: clients, error: clientsErr } = await supabase
    .from('fidelity_clients')
    .select('*');
  
  console.log('👥 CLIENTES:', clientsErr ? clientsErr.message : `${clients?.length} registros`);
  if (clients?.length > 0) {
    clients.forEach(c => console.log(`   - ${c.name} | Tel: ${c.phone} | PIN: ${c.pin} | Pontos: ${c.points_balance}`));
  }

  // Regras
  const { data: rules, error: rulesErr } = await supabase
    .from('fidelity_rules')
    .select('*');
  
  console.log('\n📋 REGRAS:', rulesErr ? rulesErr.message : `${rules?.length} registros`);
  if (rules?.length > 0) {
    rules.forEach(r => console.log(`   - ${r.name} | Tipo: ${r.type} | Ativo: ${r.is_active}`));
  }

  // Recompensas
  const { data: rewards, error: rewardsErr } = await supabase
    .from('fidelity_rewards')
    .select('*');
  
  console.log('\n🎁 RECOMPENSAS:', rewardsErr ? rewardsErr.message : `${rewards?.length} registros`);

  // Agendamentos
  const { data: appointments, error: aptErr } = await supabase
    .from('fidelity_appointments')
    .select('*');
  
  console.log('\n📅 AGENDAMENTOS:', aptErr ? aptErr.message : `${appointments?.length} registros`);

  console.log('\n✅ Teste concluído!');
}

testAll();
