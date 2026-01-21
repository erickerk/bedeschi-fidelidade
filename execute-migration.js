#!/usr/bin/env node

/**
 * Script para executar migração de pontos (1 ano) no Supabase
 * Projeto: Bedeschi Fidelidade/Estética
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://lvqcualqeevdenghexjm.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2cWN1YWxxZWV2ZGVuZ2hleGptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ3NDcwOCwiZXhwIjoyMDgzMDUwNzA4fQ.S5xcYUHdYML67ujw57ye9-vnpL_gluH10WdoZL3SXHM';

async function executeMigration() {
  console.log('🚀 Iniciando migração de pontos (1 ano)...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const sqlStatements = [
    // 1. Atualizar validade padrão das regras
    `ALTER TABLE public.fidelity_rules ALTER COLUMN validity_days SET DEFAULT 365;`,
    `UPDATE public.fidelity_rules SET validity_days = 365 WHERE validity_days = 30;`,

    // 2. Adicionar campo de validade aos clientes
    `ALTER TABLE public.fidelity_clients ADD COLUMN IF NOT EXISTS points_expires_at DATE;`,
    `UPDATE public.fidelity_clients SET points_expires_at = CURRENT_DATE + INTERVAL '1 year' WHERE points_expires_at IS NULL AND points_balance > 0;`,

    // 3. Criar tabela de histórico
    `CREATE TABLE IF NOT EXISTS public.fidelity_points_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      client_id UUID NOT NULL REFERENCES public.fidelity_clients(id) ON DELETE CASCADE,
      appointment_id UUID REFERENCES public.fidelity_appointments(id) ON DELETE SET NULL,
      points INTEGER NOT NULL,
      type VARCHAR(20) NOT NULL CHECK (type IN ('earned', 'redeemed', 'expired', 'adjusted')),
      description TEXT,
      expires_at DATE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`,

    // Índices
    `CREATE INDEX IF NOT EXISTS idx_points_history_client_id ON public.fidelity_points_history(client_id);`,
    `CREATE INDEX IF NOT EXISTS idx_points_history_expires_at ON public.fidelity_points_history(expires_at);`,
    `CREATE INDEX IF NOT EXISTS idx_points_history_type ON public.fidelity_points_history(type);`,

    // RLS
    `ALTER TABLE public.fidelity_points_history ENABLE ROW LEVEL SECURITY;`,
    `DROP POLICY IF EXISTS "points_history_select" ON public.fidelity_points_history;`,
    `DROP POLICY IF EXISTS "points_history_manage" ON public.fidelity_points_history;`,

    `CREATE POLICY "points_history_select" ON public.fidelity_points_history FOR SELECT TO authenticated USING (true);`,

    `CREATE POLICY "points_history_manage" ON public.fidelity_points_history FOR ALL TO authenticated
     USING (EXISTS (SELECT 1 FROM public.staff_profiles sp JOIN public.roles r ON sp.role_id = r.id WHERE sp.user_id = auth.uid() AND r.code IN ('ADMIN', 'RECEPCAO')))
     WITH CHECK (EXISTS (SELECT 1 FROM public.staff_profiles sp JOIN public.roles r ON sp.role_id = r.id WHERE sp.user_id = auth.uid() AND r.code IN ('ADMIN', 'RECEPCAO')));`,

    // 4. Função para expirar pontos
    `CREATE OR REPLACE FUNCTION public.expire_old_points() RETURNS INTEGER AS $$
     DECLARE expired_count INTEGER := 0; client_record RECORD;
     BEGIN
       FOR client_record IN SELECT id, name, points_balance, points_expires_at FROM public.fidelity_clients WHERE points_expires_at < CURRENT_DATE AND points_balance > 0 LOOP
         INSERT INTO public.fidelity_points_history (client_id, points, type, description, created_at) VALUES (client_record.id, -client_record.points_balance, 'expired', 'Pontos expirados após 1 ano de validade', NOW());
         UPDATE public.fidelity_clients SET points_balance = 0, points_expires_at = NULL WHERE id = client_record.id;
         expired_count := expired_count + 1;
       END LOOP;
       RETURN expired_count;
     END;
     $$ LANGUAGE plpgsql;`,

    // 5. Função para renovar validade
    `CREATE OR REPLACE FUNCTION public.renew_points_expiration() RETURNS TRIGGER AS $$
     BEGIN
       IF NEW.points_balance > OLD.points_balance THEN NEW.points_expires_at := CURRENT_DATE + INTERVAL '1 year'; END IF;
       RETURN NEW;
     END;
     $$ LANGUAGE plpgsql;`,

    // Trigger
    `DROP TRIGGER IF EXISTS renew_points_on_update ON public.fidelity_clients;`,
    `CREATE TRIGGER renew_points_on_update BEFORE UPDATE OF points_balance ON public.fidelity_clients FOR EACH ROW EXECUTE FUNCTION public.renew_points_expiration();`,

    // Comentários
    `COMMENT ON TABLE public.fidelity_points_history IS 'Histórico de movimentações de pontos dos clientes';`,
    `COMMENT ON COLUMN public.fidelity_clients.points_expires_at IS 'Data de expiração dos pontos (1 ano após último ganho)';`,
    `COMMENT ON FUNCTION public.expire_old_points() IS 'Função para expirar pontos com mais de 1 ano. Executar periodicamente via cron.';`,
  ];

  let executed = 0;
  let failed = 0;

  for (const sql of sqlStatements) {
    try {
      const { error } = await supabase.rpc('execute_sql', { sql });
      if (error) {
        console.log(`❌ Erro: ${error.message}`);
        failed++;
      } else {
        executed++;
        console.log(`✅ Executado: ${sql.substring(0, 60)}...`);
      }
    } catch (err) {
      console.log(`⚠️ Erro ao executar: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Resultado:`);
  console.log(`   ✅ Executados: ${executed}`);
  console.log(`   ❌ Falhados: ${failed}`);
  console.log(`\n✨ Migração 012 - Sistema de validade de pontos (1 ano) implementado!`);
}

executeMigration().catch(err => {
  console.error('❌ Erro fatal:', err);
  process.exit(1);
});
