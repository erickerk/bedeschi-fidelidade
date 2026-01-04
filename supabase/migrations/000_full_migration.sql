-- =============================================
-- MIGRAÇÃO COMPLETA - BEDESCHI FIDELIDADE
-- Execute este arquivo inteiro no SQL Editor do Supabase
-- =============================================

-- =============================================
-- 1. TABELA DE PAPÉIS (ROLES)
-- =============================================

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  permissions jsonb default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists roles_code_idx on public.roles (code);

-- Função para atualizar updated_at
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists roles_updated_at on public.roles;
create trigger roles_updated_at
  before update on public.roles
  for each row
  execute function public.update_updated_at_column();

-- =============================================
-- 2. TABELA DE PERFIS DE FUNCIONÁRIOS
-- =============================================

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

create index if not exists staff_profiles_role_id_idx on public.staff_profiles (role_id);
create index if not exists staff_profiles_active_idx on public.staff_profiles (active);
create index if not exists staff_profiles_email_idx on public.staff_profiles (email);

drop trigger if exists staff_profiles_updated_at on public.staff_profiles;
create trigger staff_profiles_updated_at
  before update on public.staff_profiles
  for each row
  execute function public.update_updated_at_column();

-- =============================================
-- 3. ROW LEVEL SECURITY (RLS)
-- =============================================

alter table public.roles enable row level security;
alter table public.staff_profiles enable row level security;

-- Políticas para ROLES
drop policy if exists "roles_select_authenticated" on public.roles;
create policy "roles_select_authenticated"
on public.roles for select to authenticated
using (true);

drop policy if exists "roles_admin_manage" on public.roles;
create policy "roles_admin_manage"
on public.roles for all to authenticated
using (
  exists (
    select 1 from public.staff_profiles sp
    join public.roles r on r.id = sp.role_id
    where sp.user_id = auth.uid() and r.code = 'ADMIN'
  )
)
with check (
  exists (
    select 1 from public.staff_profiles sp
    join public.roles r on r.id = sp.role_id
    where sp.user_id = auth.uid() and r.code = 'ADMIN'
  )
);

-- Políticas para STAFF_PROFILES
drop policy if exists "staff_select_own" on public.staff_profiles;
create policy "staff_select_own"
on public.staff_profiles for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "staff_update_own" on public.staff_profiles;
create policy "staff_update_own"
on public.staff_profiles for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "staff_admin_select_all" on public.staff_profiles;
create policy "staff_admin_select_all"
on public.staff_profiles for select to authenticated
using (
  exists (
    select 1 from public.staff_profiles sp
    join public.roles r on r.id = sp.role_id
    where sp.user_id = auth.uid() and r.code = 'ADMIN'
  )
);

drop policy if exists "staff_admin_manage_all" on public.staff_profiles;
create policy "staff_admin_manage_all"
on public.staff_profiles for all to authenticated
using (
  exists (
    select 1 from public.staff_profiles sp
    join public.roles r on r.id = sp.role_id
    where sp.user_id = auth.uid() and r.code = 'ADMIN'
  )
)
with check (
  exists (
    select 1 from public.staff_profiles sp
    join public.roles r on r.id = sp.role_id
    where sp.user_id = auth.uid() and r.code = 'ADMIN'
  )
);

-- =============================================
-- 4. DADOS INICIAIS (SEED)
-- =============================================

insert into public.roles (code, name, description, permissions)
values
  ('ADMIN', 'Administrador', 'Acesso total ao sistema - gerenciamento de usuários e configurações', 
   '["users:read", "users:write", "users:delete", "roles:manage", "settings:manage", "reports:view", "all:access"]'::jsonb),
  ('RECEPCAO', 'Recepção', 'Perfil de recepção - atendimento e agendamentos',
   '["clients:read", "clients:write", "appointments:read", "appointments:write", "checkin:manage"]'::jsonb),
  ('QA', 'QA / Teste', 'Usuário de teste e qualidade',
   '["test:access", "reports:view"]'::jsonb)
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  permissions = excluded.permissions;

-- =============================================
-- 5. VERIFICAÇÃO
-- =============================================
select 'Migração executada com sucesso!' as status;
select * from public.roles;
