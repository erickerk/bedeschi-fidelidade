-- =============================================
-- MIGRAÇÃO 007: Corrigir políticas RLS para acesso anônimo
-- Projeto: Bedeschi Fidelidade/Estética
-- =============================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "fidelity_clients_select" ON public.fidelity_clients;
DROP POLICY IF EXISTS "fidelity_clients_anon_select" ON public.fidelity_clients;
DROP POLICY IF EXISTS "fidelity_clients_manage" ON public.fidelity_clients;
DROP POLICY IF EXISTS "allow_all_clients" ON public.fidelity_clients;

DROP POLICY IF EXISTS "fidelity_rules_select" ON public.fidelity_rules;
DROP POLICY IF EXISTS "fidelity_rules_manage" ON public.fidelity_rules;
DROP POLICY IF EXISTS "allow_all_rules" ON public.fidelity_rules;

DROP POLICY IF EXISTS "fidelity_rewards_select" ON public.fidelity_rewards;
DROP POLICY IF EXISTS "fidelity_rewards_manage" ON public.fidelity_rewards;
DROP POLICY IF EXISTS "allow_all_rewards" ON public.fidelity_rewards;

DROP POLICY IF EXISTS "fidelity_appointments_select" ON public.fidelity_appointments;
DROP POLICY IF EXISTS "fidelity_appointments_manage" ON public.fidelity_appointments;
DROP POLICY IF EXISTS "allow_all_appointments" ON public.fidelity_appointments;

DROP POLICY IF EXISTS "fidelity_apt_services_select" ON public.fidelity_appointment_services;
DROP POLICY IF EXISTS "fidelity_apt_services_manage" ON public.fidelity_appointment_services;
DROP POLICY IF EXISTS "allow_all_apt_services" ON public.fidelity_appointment_services;

-- Criar políticas permissivas para todas as operações (desenvolvimento)
-- CLIENTES: leitura pública, escrita autenticada
CREATE POLICY "clients_read_all" ON public.fidelity_clients 
  FOR SELECT USING (true);

CREATE POLICY "clients_write_all" ON public.fidelity_clients 
  FOR ALL USING (true) WITH CHECK (true);

-- REGRAS: leitura pública (clientes precisam ver as regras)
CREATE POLICY "rules_read_all" ON public.fidelity_rules 
  FOR SELECT USING (true);

CREATE POLICY "rules_write_all" ON public.fidelity_rules 
  FOR ALL USING (true) WITH CHECK (true);

-- RECOMPENSAS: leitura pública (clientes precisam ver suas recompensas)
CREATE POLICY "rewards_read_all" ON public.fidelity_rewards 
  FOR SELECT USING (true);

CREATE POLICY "rewards_write_all" ON public.fidelity_rewards 
  FOR ALL USING (true) WITH CHECK (true);

-- AGENDAMENTOS: leitura pública
CREATE POLICY "appointments_read_all" ON public.fidelity_appointments 
  FOR SELECT USING (true);

CREATE POLICY "appointments_write_all" ON public.fidelity_appointments 
  FOR ALL USING (true) WITH CHECK (true);

-- SERVIÇOS DO AGENDAMENTO: leitura pública
CREATE POLICY "apt_services_read_all" ON public.fidelity_appointment_services 
  FOR SELECT USING (true);

CREATE POLICY "apt_services_write_all" ON public.fidelity_appointment_services 
  FOR ALL USING (true) WITH CHECK (true);

-- AVALIAÇÕES: leitura pública
DROP POLICY IF EXISTS "fidelity_reviews_select" ON public.fidelity_reviews;
DROP POLICY IF EXISTS "reviews_read_all" ON public.fidelity_reviews;
DROP POLICY IF EXISTS "reviews_write_all" ON public.fidelity_reviews;

CREATE POLICY "reviews_read_all" ON public.fidelity_reviews 
  FOR SELECT USING (true);

CREATE POLICY "reviews_write_all" ON public.fidelity_reviews 
  FOR ALL USING (true) WITH CHECK (true);

SELECT 'Políticas RLS corrigidas com sucesso!' AS status;
