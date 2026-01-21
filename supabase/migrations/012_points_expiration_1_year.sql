-- =============================================
-- MIGRAÇÃO 012: Validade de Pontos - 1 Ano
-- Projeto: Bedeschi Fidelidade/Estética
-- Regra: Pontos duram 1 ano, após expiram automaticamente
-- =============================================

-- =============================================
-- 1. ATUALIZAR VALIDADE PADRÃO DAS REGRAS PARA 365 DIAS
-- =============================================

-- Alterar valor padrão da coluna validity_days para 365 (1 ano)
ALTER TABLE public.fidelity_rules 
ALTER COLUMN validity_days SET DEFAULT 365;

-- Atualizar regras existentes que tinham 30 dias para 365 dias
UPDATE public.fidelity_rules 
SET validity_days = 365 
WHERE validity_days = 30;

-- =============================================
-- 2. ADICIONAR CAMPO DE VALIDADE AOS PONTOS DOS CLIENTES
-- =============================================

-- Adicionar coluna para rastrear quando os pontos expiram
ALTER TABLE public.fidelity_clients 
ADD COLUMN IF NOT EXISTS points_expires_at DATE;

-- Definir data de expiração para clientes existentes (1 ano a partir de agora)
UPDATE public.fidelity_clients 
SET points_expires_at = CURRENT_DATE + INTERVAL '1 year'
WHERE points_expires_at IS NULL AND points_balance > 0;

-- =============================================
-- 3. CRIAR TABELA DE HISTÓRICO DE PONTOS
-- =============================================

CREATE TABLE IF NOT EXISTS public.fidelity_points_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.fidelity_clients(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES public.fidelity_appointments(id) ON DELETE SET NULL,
    points INTEGER NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('earned', 'redeemed', 'expired', 'adjusted')),
    description TEXT,
    expires_at DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_points_history_client_id ON public.fidelity_points_history(client_id);
CREATE INDEX IF NOT EXISTS idx_points_history_expires_at ON public.fidelity_points_history(expires_at);
CREATE INDEX IF NOT EXISTS idx_points_history_type ON public.fidelity_points_history(type);

-- Habilitar RLS
ALTER TABLE public.fidelity_points_history ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DROP POLICY IF EXISTS "points_history_select" ON public.fidelity_points_history;
DROP POLICY IF EXISTS "points_history_manage" ON public.fidelity_points_history;

CREATE POLICY "points_history_select" 
ON public.fidelity_points_history 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "points_history_manage" 
ON public.fidelity_points_history 
FOR ALL 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.staff_profiles sp
        JOIN public.roles r ON sp.role_id = r.id
        WHERE sp.user_id = auth.uid() AND r.code IN ('ADMIN', 'RECEPCAO')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.staff_profiles sp
        JOIN public.roles r ON sp.role_id = r.id
        WHERE sp.user_id = auth.uid() AND r.code IN ('ADMIN', 'RECEPCAO')
    )
);

-- =============================================
-- 4. FUNÇÃO PARA EXPIRAR PONTOS AUTOMATICAMENTE
-- =============================================

CREATE OR REPLACE FUNCTION public.expire_old_points()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER := 0;
    client_record RECORD;
BEGIN
    -- Buscar clientes com pontos que expiraram
    FOR client_record IN 
        SELECT id, name, points_balance, points_expires_at
        FROM public.fidelity_clients
        WHERE points_expires_at < CURRENT_DATE
        AND points_balance > 0
    LOOP
        -- Registrar expiração no histórico
        INSERT INTO public.fidelity_points_history 
        (client_id, points, type, description, created_at)
        VALUES (
            client_record.id, 
            -client_record.points_balance, 
            'expired', 
            'Pontos expirados após 1 ano de validade',
            NOW()
        );
        
        -- Zerar pontos do cliente
        UPDATE public.fidelity_clients 
        SET 
            points_balance = 0,
            points_expires_at = NULL
        WHERE id = client_record.id;
        
        expired_count := expired_count + 1;
    END LOOP;
    
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 5. FUNÇÃO PARA RENOVAR VALIDADE AO GANHAR PONTOS
-- =============================================

CREATE OR REPLACE FUNCTION public.renew_points_expiration()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o cliente ganhou pontos, renovar a data de expiração para 1 ano
    IF NEW.points_balance > OLD.points_balance THEN
        NEW.points_expires_at := CURRENT_DATE + INTERVAL '1 year';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para renovar expiração automaticamente
DROP TRIGGER IF EXISTS renew_points_on_update ON public.fidelity_clients;
CREATE TRIGGER renew_points_on_update
    BEFORE UPDATE OF points_balance ON public.fidelity_clients
    FOR EACH ROW
    EXECUTE FUNCTION public.renew_points_expiration();

-- =============================================
-- 6. COMENTÁRIOS
-- =============================================

COMMENT ON TABLE public.fidelity_points_history IS 'Histórico de movimentações de pontos dos clientes';
COMMENT ON COLUMN public.fidelity_clients.points_expires_at IS 'Data de expiração dos pontos (1 ano após último ganho)';
COMMENT ON FUNCTION public.expire_old_points() IS 'Função para expirar pontos com mais de 1 ano. Executar periodicamente via cron.';

-- =============================================
-- FIM DA MIGRAÇÃO 012
-- =============================================

SELECT 'Migração 012 - Sistema de validade de pontos (1 ano) implementado!' AS status;
