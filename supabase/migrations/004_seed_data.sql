-- =============================================
-- MIGRAÇÃO 004: Dados Iniciais (Seed)
-- =============================================

-- Inserir papéis padrão
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
-- NOTA: Os perfis de funcionários (staff_profiles) 
-- serão criados após cadastrar usuários no Auth.
-- 
-- Para criar o admin Raul, execute:
-- 1. Crie o usuário no Auth (Dashboard > Authentication)
-- 2. Execute o SQL abaixo substituindo o email correto:
--
-- insert into public.staff_profiles (user_id, full_name, email, role_id)
-- select u.id, 'Raul', u.email, r.id
-- from auth.users u
-- join public.roles r on r.code = 'ADMIN'
-- where u.email = 'raul@suaemail.com';
-- =============================================
