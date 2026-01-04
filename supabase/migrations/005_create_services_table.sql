-- Migration: Criar tabela de serviços
-- BUG-001 FIX: Persistência real de serviços no banco de dados

-- Criar tabela de serviços
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    category_id VARCHAR(50) NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_services_category_id ON public.services(category_id);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON public.services(is_active);
CREATE INDEX IF NOT EXISTS idx_services_name ON public.services(name);

-- RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem ler serviços ativos
CREATE POLICY "services_select_policy" ON public.services
    FOR SELECT
    USING (is_active = true);

-- Política: Apenas admins podem inserir
CREATE POLICY "services_insert_policy" ON public.services
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.staff_profiles sp
            JOIN public.roles r ON sp.role_id = r.id
            WHERE sp.user_id = auth.uid() AND r.code = 'ADMIN'
        )
    );

-- Política: Apenas admins podem atualizar
CREATE POLICY "services_update_policy" ON public.services
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.staff_profiles sp
            JOIN public.roles r ON sp.role_id = r.id
            WHERE sp.user_id = auth.uid() AND r.code = 'ADMIN'
        )
    );

-- Política: Apenas admins podem deletar
CREATE POLICY "services_delete_policy" ON public.services
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.staff_profiles sp
            JOIN public.roles r ON sp.role_id = r.id
            WHERE sp.user_id = auth.uid() AND r.code = 'ADMIN'
        )
    );

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS services_updated_at_trigger ON public.services;
CREATE TRIGGER services_updated_at_trigger
    BEFORE UPDATE ON public.services
    FOR EACH ROW
    EXECUTE FUNCTION update_services_updated_at();

-- Comentários
COMMENT ON TABLE public.services IS 'Tabela de serviços oferecidos pela clínica';
COMMENT ON COLUMN public.services.external_code IS 'Código externo do serviço (ex: DC1, EF2)';
COMMENT ON COLUMN public.services.category_id IS 'ID da categoria do serviço';
COMMENT ON COLUMN public.services.category_name IS 'Nome da categoria (desnormalizado para performance)';
