
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente faltando.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testPermissions() {
  console.log('🕵️ Testando permissões com chave ANÔNIMA...');

  // 1. Ler Clientes
  const { data: clients, error: clientError } = await supabase
    .from('fidelity_clients')
    .select('id, name')
    .limit(1);
  
  if (clientError) {
    console.error('❌ Falha ao ler fidelity_clients:', clientError.message);
  } else {
    console.log('✅ Leitura de fidelity_clients OK');
  }

  // 2. Ler Atendimentos
  const { data: appointments, error: aptError } = await supabase
    .from('fidelity_appointments')
    .select('id')
    .limit(1);

  if (aptError) {
    console.error('❌ Falha ao ler fidelity_appointments:', aptError.message);
  } else {
    console.log('✅ Leitura de fidelity_appointments OK');
  }

  // 3. Ler Reviews
  const { data: reviews, error: revError } = await supabase
    .from('fidelity_reviews')
    .select('id')
    .limit(1);

  if (revError) {
    console.error('❌ Falha ao ler fidelity_reviews:', revError.message);
  } else {
    console.log('✅ Leitura de fidelity_reviews OK');
  }

  // 4. Inserir Review (Simulação)
  const { error: insertError } = await supabase
    .from('fidelity_reviews')
    .insert({
      client_id: '00000000-0000-0000-0000-000000000000', // ID falso, deve falhar por FK mas não por RLS se permitido
      appointment_id: '00000000-0000-0000-0000-000000000000',
      rating: 5
    });

  if (insertError) {
    if (insertError.code === '42501') {
      console.error('❌ Inserção em fidelity_reviews BLOQUEADA por RLS (Permissão negada)');
    } else {
      console.log('✅ RLS de inserção parece OK (erro esperado de FK ou outro):', insertError.code, insertError.message);
    }
  } else {
    console.log('✅ Inserção em fidelity_reviews OK');
  }
}

testPermissions();
