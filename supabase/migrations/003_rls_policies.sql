-- =============================================
-- MIGRAÇÃO 003: Row Level Security (RLS)
-- =============================================

-- Ativa RLS nas tabelas
alter table public.roles enable row level security;
alter table public.staff_profiles enable row level security;

-- =============================================
-- POLÍTICAS PARA ROLES
-- =============================================

-- Qualquer usuário autenticado pode ler os papéis
create policy "roles_select_authenticated"
on public.roles
for select
to authenticated
using (true);

-- Apenas ADMIN pode gerenciar papéis
create policy "roles_admin_manage"
on public.roles
for all
to authenticated
using (
  exists (
    select 1
    from public.staff_profiles sp
    join public.roles r on r.id = sp.role_id
    where sp.user_id = auth.uid() and r.code = 'ADMIN'
  )
)
with check (
  exists (
    select 1
    from public.staff_profiles sp
    join public.roles r on r.id = sp.role_id
    where sp.user_id = auth.uid() and r.code = 'ADMIN'
  )
);

-- =============================================
-- POLÍTICAS PARA STAFF_PROFILES
-- =============================================

-- Usuário autenticado pode ver seu próprio perfil
create policy "staff_select_own"
on public.staff_profiles
for select
to authenticated
using (auth.uid() = user_id);

-- Usuário pode atualizar seu próprio perfil (exceto role_id)
create policy "staff_update_own"
on public.staff_profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- ADMIN pode ver todos os perfis
create policy "staff_admin_select_all"
on public.staff_profiles
for select
to authenticated
using (
  exists (
    select 1
    from public.staff_profiles sp
    join public.roles r on r.id = sp.role_id
    where sp.user_id = auth.uid() and r.code = 'ADMIN'
  )
);

-- ADMIN pode gerenciar todos os perfis
create policy "staff_admin_manage_all"
on public.staff_profiles
for all
to authenticated
using (
  exists (
    select 1
    from public.staff_profiles sp
    join public.roles r on r.id = sp.role_id
    where sp.user_id = auth.uid() and r.code = 'ADMIN'
  )
)
with check (
  exists (
    select 1
    from public.staff_profiles sp
    join public.roles r on r.id = sp.role_id
    where sp.user_id = auth.uid() and r.code = 'ADMIN'
  )
);
