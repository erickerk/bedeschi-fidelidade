/**
 * Script para testar login dos usuários criados
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, anonKey)

async function testLogin(email, password, expectedRole) {
  console.log(`\n🔐 Testando login: ${email}`)
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    console.log(`   ❌ Erro: ${error.message}`)
    return false
  }

  console.log(`   ✅ Login OK`)

  // Buscar perfil do usuário
  const { data: profile, error: profileError } = await supabase
    .from('staff_profiles')
    .select(`
      full_name,
      email,
      active,
      roles (code, name, permissions)
    `)
    .eq('user_id', data.user.id)
    .single()

  if (profileError) {
    console.log(`   ⚠️  Erro ao buscar perfil: ${profileError.message}`)
  } else {
    console.log(`   👤 Perfil: ${profile.full_name}`)
    console.log(`   🎭 Papel: ${profile.roles?.name} (${profile.roles?.code})`)
    console.log(`   🔑 Permissões: ${profile.roles?.permissions?.join(', ')}`)
    
    if (profile.roles?.code !== expectedRole) {
      console.log(`   ⚠️  Papel esperado: ${expectedRole}, obtido: ${profile.roles?.code}`)
    }
  }

  // Fazer logout
  await supabase.auth.signOut()
  return true
}

async function testAdminAccess() {
  console.log('\n\n📊 Testando acesso ADMIN (deve ver todos os perfis)...')
  
  const { data } = await supabase.auth.signInWithPassword({
    email: 'raul@bedeschi.com.br',
    password: 'Admin@123456'
  })

  if (!data.user) {
    console.log('   ❌ Não conseguiu fazer login como admin')
    return
  }

  const { data: allProfiles, error } = await supabase
    .from('staff_profiles')
    .select('full_name, email')

  if (error) {
    console.log(`   ❌ Erro ao listar perfis: ${error.message}`)
  } else {
    console.log(`   ✅ Admin consegue ver ${allProfiles.length} perfis:`)
    allProfiles.forEach(p => console.log(`      - ${p.full_name} (${p.email})`))
  }

  await supabase.auth.signOut()
}

async function testQAAccess() {
  console.log('\n\n📊 Testando acesso QA (deve ver apenas próprio perfil)...')
  
  const { data } = await supabase.auth.signInWithPassword({
    email: 'qa@bedeschi.com.br',
    password: 'QaTeste@123'
  })

  if (!data.user) {
    console.log('   ❌ Não conseguiu fazer login como QA')
    return
  }

  const { data: profiles, error } = await supabase
    .from('staff_profiles')
    .select('full_name, email')

  if (error) {
    console.log(`   ❌ Erro ao listar perfis: ${error.message}`)
  } else {
    console.log(`   ✅ QA consegue ver ${profiles.length} perfil(s):`)
    profiles.forEach(p => console.log(`      - ${p.full_name} (${p.email})`))
    
    if (profiles.length === 1) {
      console.log('   ✅ RLS funcionando! QA só vê o próprio perfil.')
    } else {
      console.log('   ⚠️  RLS pode não estar funcionando corretamente.')
    }
  }

  await supabase.auth.signOut()
}

async function main() {
  console.log('🧪 Iniciando testes de autenticação e autorização\n')
  console.log(`📡 URL: ${supabaseUrl}`)

  // Testar login de cada usuário
  await testLogin('raul@bedeschi.com.br', 'Admin@123456', 'ADMIN')
  await testLogin('recepcao@bedeschi.com.br', 'Recepcao@123', 'RECEPCAO')
  await testLogin('qa@bedeschi.com.br', 'QaTeste@123', 'QA')

  // Testar RLS
  await testAdminAccess()
  await testQAAccess()

  console.log('\n\n✅ Todos os testes concluídos!')
}

main()
