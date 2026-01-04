-- =============================================
-- MIGRAÇÃO 001: Tabela de Papéis (Roles)
-- =============================================

-- Tabela de papéis de acesso do sistema
create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,        -- ADMIN, RECEPCAO, QA
  name text not null,               -- Nome legível
  description text,
  permissions jsonb default '[]'::jsonb,  -- Lista de permissões
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índice para busca por código
create index if not exists roles_code_idx on public.roles (code);

-- Trigger para atualizar updated_at automaticamente
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger roles_updated_at
  before update on public.roles
  for each row
  execute function public.update_updated_at_column();

-- Comentários
comment on table public.roles is 'Papéis de acesso do sistema (ADMIN, RECEPCAO, QA)';
comment on column public.roles.code is 'Código único do papel (ex: ADMIN, RECEPCAO, QA)';
comment on column public.roles.permissions is 'Array JSON de permissões do papel';
