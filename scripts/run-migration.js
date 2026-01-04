/**
 * Script para executar migração no Supabase
 * Uso: node scripts/run-migration.js
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Erro: Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function runMigration() {
  console.log('🚀 Iniciando migração do banco de dados...\n')
  console.log(`📡 URL: ${supabaseUrl}`)

  // 1. Criar tabela roles
  console.log('\n📦 Criando tabela roles...')
  const { error: rolesError } = await supabase.rpc('exec_sql', {
    sql_query: `
      create table if not exists public.roles (
        id uuid primary key default gen_random_uuid(),
        code text not null unique,
        name text not null,
        description text,
        permissions jsonb default '[]'::jsonb,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );
    `
  })

  if (rolesError) {
    // Tentar executar via query direta
    console.log('⚠️  RPC não disponível, tentando via REST...')
  }

  // Verificar se tabela roles existe
  const { data: rolesCheck, error: checkError } = await supabase
    .from('roles')
    .select('count')
    .limit(1)

  if (checkError && checkError.code === '42P01') {
    console.log('❌ Tabela roles não existe. Execute o SQL manualmente no dashboard.')
    console.log('\n📋 Copie o conteúdo de: supabase/migrations/000_full_migration.sql')
    console.log('   Cole em: https://supabase.com/dashboard/project/lvqcualqeevdenghexjm/sql/new')
    return false
  }

  console.log('✅ Tabela roles OK')

  // Verificar se tabela staff_profiles existe
  const { error: staffCheckError } = await supabase
    .from('staff_profiles')
    .select('count')
    .limit(1)

  if (staffCheckError && staffCheckError.code === '42P01') {
    console.log('❌ Tabela staff_profiles não existe.')
    return false
  }

  console.log('✅ Tabela staff_profiles OK')
  return true
}

async function seedRoles() {
  console.log('\n📦 Inserindo papéis padrão...')

  const roles = [
    {
      code: 'ADMIN',
      name: 'Administrador',
      description: 'Acesso total ao sistema',
      permissions: ['users:read', 'users:write', 'users:delete', 'roles:manage', 'settings:manage', 'all:access']
    },
    {
      code: 'RECEPCAO',
      name: 'Recepção',
      description: 'Perfil de recepção - atendimento',
      permissions: ['clients:read', 'clients:write', 'appointments:read', 'appointments:write']
    },
    {
      code: 'QA',
      name: 'QA / Teste',
      description: 'Usuário de teste',
      permissions: ['test:access', 'reports:view']
    }
  ]

  for (const role of roles) {
    const { error } = await supabase
      .from('roles')
      .upsert(role, { onConflict: 'code' })

    if (error) {
      console.error(`❌ Erro ao inserir ${role.code}:`, error.message)
    } else {
      console.log(`✅ Papel ${role.code} inserido/atualizado`)
    }
  }
}

async function createUsers() {
  console.log('\n👥 Criando usuários de teste...')

  const users = [
    { email: 'raul@bedeschi.com.br', password: 'Admin@123456', name: 'Raul', role: 'ADMIN' },
    { email: 'recepcao@bedeschi.com.br', password: 'Recepcao@123', name: 'Recepção', role: 'RECEPCAO' },
    { email: 'qa@bedeschi.com.br', password: 'QaTeste@123', name: 'Usuário QA', role: 'QA' }
  ]

  for (const user of users) {
    // Busca role_id
    const { data: roleData } = await supabase
      .from('roles')
      .select('id')
      .eq('code', user.role)
      .single()

    if (!roleData) {
      console.error(`❌ Role ${user.role} não encontrado`)
      continue
    }

    // Verifica se usuário já existe
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === user.email)

    let userId
    if (existingUser) {
      console.log(`⚠️  Usuário ${user.email} já existe`)
      userId = existingUser.id
    } else {
      // Cria usuário no Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true
      })

      if (authError) {
        console.error(`❌ Erro ao criar ${user.email}:`, authError.message)
        continue
      }
      userId = authData.user.id
      console.log(`✅ Usuário ${user.email} criado no Auth`)
    }

    // Verifica se perfil já existe
    const { data: existingProfile } = await supabase
      .from('staff_profiles')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (existingProfile) {
      console.log(`⚠️  Perfil de ${user.name} já existe`)
      continue
    }

    // Cria perfil
    const { error: profileError } = await supabase
      .from('staff_profiles')
      .insert({
        user_id: userId,
        full_name: user.name,
        email: user.email,
        role_id: roleData.id,
        active: true
      })

    if (profileError) {
      console.error(`❌ Erro ao criar perfil de ${user.name}:`, profileError.message)
    } else {
      console.log(`✅ Perfil de ${user.name} (${user.role}) criado`)
    }
  }
}

async function validate() {
  console.log('\n🔍 Validando configuração...')

  // Lista roles
  const { data: roles, error: rolesError } = await supabase
    .from('roles')
    .select('*')
    .order('code')

  if (rolesError) {
    console.error('❌ Erro ao buscar roles:', rolesError.message)
    return
  }

  console.log('\n📋 Papéis cadastrados:')
  roles.forEach(r => {
    console.log(`   ✅ ${r.code}: ${r.name}`)
  })

  // Lista perfis
  const { data: profiles, error: profilesError } = await supabase
    .from('staff_profiles')
    .select(`
      full_name,
      email,
      active,
      role_id
    `)

  if (profilesError) {
    console.error('❌ Erro ao buscar perfis:', profilesError.message)
    return
  }

  console.log('\n👥 Perfis cadastrados:')
  for (const p of profiles) {
    const role = roles.find(r => r.id === p.role_id)
    const status = p.active ? '✅' : '❌'
    console.log(`   ${status} ${p.full_name} (${p.email}) - ${role?.name || 'N/A'}`)
  }

  console.log('\n✅ Validação concluída!')
  console.log('\n📝 Credenciais de teste:')
  console.log('   🔑 Admin (Raul):  raul@bedeschi.com.br / Admin@123456')
  console.log('   🔑 Recepção:      recepcao@bedeschi.com.br / Recepcao@123')
  console.log('   🔑 QA:            qa@bedeschi.com.br / QaTeste@123')
}

async function main() {
  try {
    const tablesExist = await runMigration()
    
    if (!tablesExist) {
      console.log('\n⚠️  As tabelas precisam ser criadas primeiro.')
      console.log('   Execute o SQL no dashboard do Supabase.')
      return
    }

    await seedRoles()
    await createUsers()
    await validate()

    console.log('\n🎉 Setup concluído com sucesso!')
  } catch (error) {
    console.error('\n❌ Erro:', error.message)
  }
}

main()
