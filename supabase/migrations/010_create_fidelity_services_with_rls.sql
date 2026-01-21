-- =============================================
-- MIGRAÇÃO 010: Tabela de Serviços de Fidelidade com RLS
-- Projeto: Bedeschi Fidelidade/Estética
-- Fix: Habilitar RLS na tabela fidelity_services
-- =============================================

-- =============================================
-- 1. CRIAR TABELA DE SERVIÇOS (SE NÃO EXISTIR)
-- =============================================

CREATE TABLE IF NOT EXISTS public.fidelity_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id VARCHAR(50),
    category_name VARCHAR(100),
    price DECIMAL(12, 2) NOT NULL DEFAULT 0,
    duration_minutes INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- 2. CRIAR ÍNDICES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_fidelity_services_external_code ON public.fidelity_services(external_code);
CREATE INDEX IF NOT EXISTS idx_fidelity_services_category_id ON public.fidelity_services(category_id);
CREATE INDEX IF NOT EXISTS idx_fidelity_services_is_active ON public.fidelity_services(is_active);

-- =============================================
-- 3. TRIGGER PARA UPDATED_AT
-- =============================================

DROP TRIGGER IF EXISTS fidelity_services_updated_at ON public.fidelity_services;
CREATE TRIGGER fidelity_services_updated_at
    BEFORE UPDATE ON public.fidelity_services
    FOR EACH ROW
    EXECUTE FUNCTION public.update_fidelity_updated_at();

-- =============================================
-- 4. HABILITAR ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE public.fidelity_services ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 5. REMOVER POLÍTICAS ANTIGAS (SE EXISTIREM)
-- =============================================

DROP POLICY IF EXISTS "fidelity_services_select" ON public.fidelity_services;
DROP POLICY IF EXISTS "fidelity_services_manage" ON public.fidelity_services;
DROP POLICY IF EXISTS "fidelity_services_anon_select" ON public.fidelity_services;

-- =============================================
-- 6. CRIAR POLÍTICAS RLS
-- =============================================

-- Política de SELECT para usuários autenticados
CREATE POLICY "fidelity_services_select" 
ON public.fidelity_services 
FOR SELECT 
TO authenticated 
USING (is_active = true);

-- Política de SELECT para usuários anônimos (apenas serviços ativos)
CREATE POLICY "fidelity_services_anon_select" 
ON public.fidelity_services 
FOR SELECT 
TO anon 
USING (is_active = true);

-- Política de INSERT/UPDATE/DELETE para admins
CREATE POLICY "fidelity_services_manage" 
ON public.fidelity_services 
FOR ALL 
TO authenticated
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

-- =============================================
-- 7. COMENTÁRIOS
-- =============================================

COMMENT ON TABLE public.fidelity_services IS 'Catálogo de serviços oferecidos pela clínica';
COMMENT ON COLUMN public.fidelity_services.external_code IS 'Código único do serviço (ex: EST001, MED001)';
COMMENT ON COLUMN public.fidelity_services.category_id IS 'ID da categoria do serviço';
COMMENT ON COLUMN public.fidelity_services.category_name IS 'Nome da categoria do serviço';
COMMENT ON COLUMN public.fidelity_services.price IS 'Preço padrão do serviço';
COMMENT ON COLUMN public.fidelity_services.duration_minutes IS 'Duração estimada em minutos';

-- =============================================
-- FIM DA MIGRAÇÃO 010
-- =============================================

SELECT 'Migração 010 - Tabela fidelity_services criada com RLS habilitado!' AS status;
