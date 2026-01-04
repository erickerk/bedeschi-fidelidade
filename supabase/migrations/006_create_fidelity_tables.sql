-- =============================================
-- MIGRAÇÃO 006: Tabelas de Fidelidade
-- Projeto: Bedeschi Fidelidade/Estética
-- =============================================

-- =============================================
-- 1. TABELA DE CLIENTES
-- =============================================

CREATE TABLE IF NOT EXISTS public.fidelity_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    pin VARCHAR(10) NOT NULL,
    email VARCHAR(255),
    birth_date DATE,
    points_balance INTEGER NOT NULL DEFAULT 0,
    total_spent DECIMAL(12, 2) NOT NULL DEFAULT 0,
    total_appointments INTEGER NOT NULL DEFAULT 0,
    last_visit DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fidelity_clients_phone ON public.fidelity_clients(phone);
CREATE INDEX IF NOT EXISTS idx_fidelity_clients_is_active ON public.fidelity_clients(is_active);

-- =============================================
-- 2. TABELA DE REGRAS DE FIDELIDADE
-- =============================================

CREATE TABLE IF NOT EXISTS public.fidelity_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('COMBO_VALUE', 'QUANTITY_ACCUMULATION', 'SERVICE_SPECIFIC', 'POINTS_CONVERSION')),
    category_id VARCHAR(50),
    category_name VARCHAR(100),
    service_id VARCHAR(50),
    service_name VARCHAR(255),
    threshold_value DECIMAL(12, 2),
    threshold_quantity INTEGER,
    reward_type VARCHAR(50) NOT NULL CHECK (reward_type IN ('FREE_SERVICE', 'DISCOUNT_PERCENT', 'DISCOUNT_FIXED', 'CREDIT', 'POINTS')),
    reward_value DECIMAL(12, 2),
    reward_service_id VARCHAR(50),
    reward_service_name VARCHAR(255),
    validity_days INTEGER NOT NULL DEFAULT 30,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fidelity_rules_is_active ON public.fidelity_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_fidelity_rules_type ON public.fidelity_rules(type);

-- =============================================
-- 3. TABELA DE RECOMPENSAS
-- =============================================

CREATE TABLE IF NOT EXISTS public.fidelity_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.fidelity_clients(id) ON DELETE CASCADE,
    rule_id UUID REFERENCES public.fidelity_rules(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('FREE_SERVICE', 'DISCOUNT_PERCENT', 'DISCOUNT_FIXED', 'CREDIT', 'POINTS')),
    value DECIMAL(12, 2),
    service_name VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'redeemed', 'expired')),
    expires_at DATE,
    redeemed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fidelity_rewards_client_id ON public.fidelity_rewards(client_id);
CREATE INDEX IF NOT EXISTS idx_fidelity_rewards_status ON public.fidelity_rewards(status);

-- =============================================
-- 4. TABELA DE AGENDAMENTOS/ATENDIMENTOS
-- =============================================

CREATE TABLE IF NOT EXISTS public.fidelity_appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.fidelity_clients(id) ON DELETE CASCADE,
    professional_id VARCHAR(50),
    professional_name VARCHAR(255),
    date DATE NOT NULL,
    time VARCHAR(10),
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
    total DECIMAL(12, 2) NOT NULL DEFAULT 0,
    points_earned INTEGER NOT NULL DEFAULT 0,
    has_review BOOLEAN NOT NULL DEFAULT false,
    review_rating INTEGER CHECK (review_rating >= 1 AND review_rating <= 5),
    review_comment TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fidelity_appointments_client_id ON public.fidelity_appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_fidelity_appointments_date ON public.fidelity_appointments(date);
CREATE INDEX IF NOT EXISTS idx_fidelity_appointments_status ON public.fidelity_appointments(status);

-- =============================================
-- 5. TABELA DE SERVIÇOS DO ATENDIMENTO
-- =============================================

CREATE TABLE IF NOT EXISTS public.fidelity_appointment_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL REFERENCES public.fidelity_appointments(id) ON DELETE CASCADE,
    service_id VARCHAR(50),
    service_name VARCHAR(255) NOT NULL,
    category_id VARCHAR(50),
    category_name VARCHAR(100),
    price DECIMAL(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fidelity_apt_services_appointment_id ON public.fidelity_appointment_services(appointment_id);

-- =============================================
-- 6. TABELA DE AVALIAÇÕES
-- =============================================

CREATE TABLE IF NOT EXISTS public.fidelity_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.fidelity_clients(id) ON DELETE CASCADE,
    appointment_id UUID NOT NULL REFERENCES public.fidelity_appointments(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(appointment_id)
);

CREATE INDEX IF NOT EXISTS idx_fidelity_reviews_client_id ON public.fidelity_reviews(client_id);
CREATE INDEX IF NOT EXISTS idx_fidelity_reviews_appointment_id ON public.fidelity_reviews(appointment_id);

-- =============================================
-- 7. TRIGGERS PARA UPDATED_AT
-- =============================================

CREATE OR REPLACE FUNCTION public.update_fidelity_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS fidelity_clients_updated_at ON public.fidelity_clients;
CREATE TRIGGER fidelity_clients_updated_at
    BEFORE UPDATE ON public.fidelity_clients
    FOR EACH ROW
    EXECUTE FUNCTION public.update_fidelity_updated_at();

DROP TRIGGER IF EXISTS fidelity_rules_updated_at ON public.fidelity_rules;
CREATE TRIGGER fidelity_rules_updated_at
    BEFORE UPDATE ON public.fidelity_rules
    FOR EACH ROW
    EXECUTE FUNCTION public.update_fidelity_updated_at();

DROP TRIGGER IF EXISTS fidelity_appointments_updated_at ON public.fidelity_appointments;
CREATE TRIGGER fidelity_appointments_updated_at
    BEFORE UPDATE ON public.fidelity_appointments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_fidelity_updated_at();

-- =============================================
-- 8. ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE public.fidelity_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fidelity_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fidelity_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fidelity_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fidelity_appointment_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fidelity_reviews ENABLE ROW LEVEL SECURITY;

-- Políticas de SELECT para todos os authenticated
CREATE POLICY "fidelity_clients_select" ON public.fidelity_clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "fidelity_rules_select" ON public.fidelity_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "fidelity_rewards_select" ON public.fidelity_rewards FOR SELECT TO authenticated USING (true);
CREATE POLICY "fidelity_appointments_select" ON public.fidelity_appointments FOR SELECT TO authenticated USING (true);
CREATE POLICY "fidelity_apt_services_select" ON public.fidelity_appointment_services FOR SELECT TO authenticated USING (true);
CREATE POLICY "fidelity_reviews_select" ON public.fidelity_reviews FOR SELECT TO authenticated USING (true);

-- Políticas de INSERT/UPDATE/DELETE para admins e recepção
CREATE POLICY "fidelity_clients_manage" ON public.fidelity_clients FOR ALL TO authenticated
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

CREATE POLICY "fidelity_rules_manage" ON public.fidelity_rules FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.staff_profiles sp
        JOIN public.roles r ON sp.role_id = r.id
        WHERE sp.user_id = auth.uid() AND r.code = 'ADMIN'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.staff_profiles sp
        JOIN public.roles r ON sp.role_id = r.id
        WHERE sp.user_id = auth.uid() AND r.code = 'ADMIN'
    )
);

CREATE POLICY "fidelity_rewards_manage" ON public.fidelity_rewards FOR ALL TO authenticated
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

CREATE POLICY "fidelity_appointments_manage" ON public.fidelity_appointments FOR ALL TO authenticated
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

CREATE POLICY "fidelity_apt_services_manage" ON public.fidelity_appointment_services FOR ALL TO authenticated
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

CREATE POLICY "fidelity_reviews_manage" ON public.fidelity_reviews FOR ALL TO authenticated
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

-- Política anon para leitura de clientes (login por telefone/pin)
CREATE POLICY "fidelity_clients_anon_select" ON public.fidelity_clients FOR SELECT TO anon USING (is_active = true);

-- =============================================
-- 9. COMENTÁRIOS
-- =============================================

COMMENT ON TABLE public.fidelity_clients IS 'Clientes do programa de fidelidade';
COMMENT ON TABLE public.fidelity_rules IS 'Regras do programa de fidelidade';
COMMENT ON TABLE public.fidelity_rewards IS 'Recompensas conquistadas pelos clientes';
COMMENT ON TABLE public.fidelity_appointments IS 'Agendamentos e atendimentos';
COMMENT ON TABLE public.fidelity_appointment_services IS 'Serviços realizados em cada atendimento';
COMMENT ON TABLE public.fidelity_reviews IS 'Avaliações dos atendimentos';

-- =============================================
-- FIM DA MIGRAÇÃO 006
-- =============================================
SELECT 'Migração 006 - Tabelas de Fidelidade criadas com sucesso!' AS status;
