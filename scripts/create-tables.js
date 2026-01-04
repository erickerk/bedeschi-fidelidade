/**
 * Script para criar tabelas via Supabase REST API
 */

require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Erro: Configure as variáveis de ambiente')
  process.exit(1)
}

// Extrair project ref da URL
const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '')

async function executeSql(sql) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`
    },
    body: JSON.stringify({ sql_query: sql })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`SQL Error: ${error}`)
  }

  return response.json()
}

async function executeDirectSql(sql) {
  // Usar a API do Postgres diretamente via pg
  const { Client } = require('pg')
  
  const connectionString = `postgresql://postgres.${projectRef}:${serviceRoleKey}@aws-0-sa-east-1.pooler.supabase.com:6543/postgres`
  
  const client = new Client({ connectionString })
  
  try {
    await client.connect()
    const result = await client.query(sql)
    return result
  } finally {
    await client.end()
  }
}

const migrationSql = `
-- Função para atualizar updated_at
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Tabela roles
create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  permissions jsonb default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tabela staff_profiles
create table if not exists public.staff_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  avatar_url text,
  role_id uuid not null references public.roles (id),
  active boolean not null default true,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint staff_profiles_user_id_unique unique (user_id)
);

-- Índices
create index if not exists roles_code_idx on public.roles (code);
create index if not exists staff_profiles_role_id_idx on public.staff_profiles (role_id);
create index if not exists staff_profiles_active_idx on public.staff_profiles (active);

-- RLS
alter table public.roles enable row level security;
alter table public.staff_profiles enable row level security;

-- Políticas para roles
drop policy if exists "roles_select_authenticated" on public.roles;
create policy "roles_select_authenticated" on public.roles for select to authenticated using (true);

drop policy if exists "roles_admin_manage" on public.roles;
create policy "roles_admin_manage" on public.roles for all to authenticated
using (exists (select 1 from public.staff_profiles sp join public.roles r on r.id = sp.role_id where sp.user_id = auth.uid() and r.code = 'ADMIN'))
with check (exists (select 1 from public.staff_profiles sp join public.roles r on r.id = sp.role_id where sp.user_id = auth.uid() and r.code = 'ADMIN'));

-- Políticas para staff_profiles
drop policy if exists "staff_select_own" on public.staff_profiles;
create policy "staff_select_own" on public.staff_profiles for select to authenticated using (auth.uid() = user_id);

drop policy if exists "staff_update_own" on public.staff_profiles;
create policy "staff_update_own" on public.staff_profiles for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "staff_admin_select_all" on public.staff_profiles;
create policy "staff_admin_select_all" on public.staff_profiles for select to authenticated
using (exists (select 1 from public.staff_profiles sp join public.roles r on r.id = sp.role_id where sp.user_id = auth.uid() and r.code = 'ADMIN'));

drop policy if exists "staff_admin_manage_all" on public.staff_profiles;
create policy "staff_admin_manage_all" on public.staff_profiles for all to authenticated
using (exists (select 1 from public.staff_profiles sp join public.roles r on r.id = sp.role_id where sp.user_id = auth.uid() and r.code = 'ADMIN'))
with check (exists (select 1 from public.staff_profiles sp join public.roles r on r.id = sp.role_id where sp.user_id = auth.uid() and r.code = 'ADMIN'));

-- Seed roles
insert into public.roles (code, name, description, permissions) values
  ('ADMIN', 'Administrador', 'Acesso total ao sistema', '["users:read", "users:write", "users:delete", "roles:manage", "all:access"]'::jsonb),
  ('RECEPCAO', 'Recepção', 'Perfil de recepção', '["clients:read", "clients:write", "appointments:read", "appointments:write"]'::jsonb),
  ('QA', 'QA / Teste', 'Usuário de teste', '["test:access", "reports:view"]'::jsonb)
on conflict (code) do update set name = excluded.name, description = excluded.description, permissions = excluded.permissions;
`

async function main() {
  console.log('🚀 Criando tabelas no Supabase...')
  console.log(`📡 Projeto: ${projectRef}`)

  try {
    // Tentar via RPC primeiro
    await executeSql(migrationSql)
    console.log('✅ Migração executada com sucesso via RPC!')
  } catch (rpcError) {
    console.log('⚠️  RPC não disponível, verificando se pg está instalado...')
    
    try {
      // Verificar se pg está instalado
      require.resolve('pg')
      console.log('📦 Usando conexão direta PostgreSQL...')
      await executeDirectSql(migrationSql)
      console.log('✅ Migração executada com sucesso via PostgreSQL!')
    } catch (pgError) {
      if (pgError.code === 'MODULE_NOT_FOUND') {
        console.log('\n❌ Módulo pg não instalado.')
        console.log('   Execute: npm install pg')
        console.log('\n   Ou execute o SQL manualmente no dashboard:')
        console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql/new`)
      } else {
        console.error('❌ Erro:', pgError.message)
      }
    }
  }
}

main()
