require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Função formatPhone do utils.ts
function formatPhone(phone) {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 3)} ${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

async function test() {
  console.log('=== TESTE DE FORMATO DE TELEFONE ===\n');
  
  // Teste com números fixos
  console.log('Testes com números fixos:');
  console.log('11999887766 ->', formatPhone('11999887766'));
  console.log('11944332211 ->', formatPhone('11944332211'));
  console.log('1133334444 ->', formatPhone('1133334444'));
  
  console.log('\n=== CLIENTES DO BANCO ===\n');
  
  const { data: clients, error } = await supabase
    .from('clients')
    .select('name, phone')
    .limit(10);
  
  if (error) {
    console.log('Erro ao buscar clientes:', error.message);
    return;
  }
  
  if (clients && clients.length > 0) {
    clients.forEach(c => {
      console.log(`${c.name}: ${c.phone} -> ${formatPhone(c.phone)}`);
    });
  } else {
    console.log('Nenhum cliente encontrado');
  }
}

test();
