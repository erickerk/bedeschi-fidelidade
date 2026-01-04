-- =============================================
-- MIGRAÇÃO 002: Tabela de Perfis de Funcionários
-- =============================================

-- Tabela de perfis internos (funcionários/colaboradores)
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
create index if not exists staff_profiles_role_id_idx on public.staff_profiles (role_id);
create index if not exists staff_profiles_active_idx on public.staff_profiles (active);
create index if not exists staff_profiles_email_idx on public.staff_profiles (email);

-- Trigger para atualizar updated_at
create trigger staff_profiles_updated_at
  before update on public.staff_profiles
  for each row
  execute function public.update_updated_at_column();

-- Comentários
comment on table public.staff_profiles is 'Perfis de funcionários/colaboradores do sistema';
comment on column public.staff_profiles.user_id is 'FK para auth.users - usuário autenticado';
comment on column public.staff_profiles.role_id is 'FK para roles - papel do funcionário';
