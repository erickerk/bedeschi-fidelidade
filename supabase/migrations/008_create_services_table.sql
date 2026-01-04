-- =============================================
-- MIGRAÇÃO 008: Tabela de Serviços
-- Projeto: Bedeschi Fidelidade/Estética
-- =============================================

CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id VARCHAR(50),
    category_name VARCHAR(100),
    price DECIMAL(12, 2) NOT NULL DEFAULT 0,
    duration_minutes INTEGER DEFAULT 60,
    points_multiplier DECIMAL(4, 2) DEFAULT 1.0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_services_category ON public.services(category_name);
CREATE INDEX IF NOT EXISTS idx_services_active ON public.services(is_active);

-- RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas
CREATE POLICY "services_read_all" ON public.services FOR SELECT USING (true);
CREATE POLICY "services_write_all" ON public.services FOR ALL USING (true) WITH CHECK (true);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_services_updated_at ON public.services;
CREATE TRIGGER trigger_services_updated_at
    BEFORE UPDATE ON public.services
    FOR EACH ROW
    EXECUTE FUNCTION update_services_updated_at();

-- Dados iniciais de serviços
INSERT INTO public.services (name, category_name, price, duration_minutes, is_active) VALUES
    ('Massagem Relaxante 60min', 'Massagens', 180.00, 60, true),
    ('Massagem Modeladora', 'Massagens', 220.00, 60, true),
    ('Limpeza de Pele', 'Facial', 150.00, 45, true),
    ('Peeling Facial', 'Facial', 200.00, 60, true),
    ('Depilação Perna Completa', 'Depilação', 120.00, 45, true),
    ('Depilação Virilha', 'Depilação', 80.00, 30, true),
    ('Design de Sobrancelhas', 'Sobrancelhas', 65.00, 30, true),
    ('Micropigmentação Sobrancelha', 'Micropigmentação', 450.00, 120, true),
    ('Alongamento de Cílios', 'Cílios', 280.00, 90, true),
    ('Manicure Completa', 'Manicure', 45.00, 45, true),
    ('Pedicure Completa', 'Pedicure', 55.00, 60, true),
    ('Hidratação Capilar', 'Tratamentos', 120.00, 60, true)
ON CONFLICT DO NOTHING;

SELECT 'Tabela services criada com sucesso!' AS status;
