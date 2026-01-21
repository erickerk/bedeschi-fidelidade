-- =============================================
-- MIGRAÇÃO 011: Verificar e Corrigir RLS em Todas as Tabelas
-- Projeto: Bedeschi Fidelidade/Estética
-- Fix: Garantir que todas as tabelas públicas tenham RLS habilitado
-- =============================================

-- =============================================
-- 1. VERIFICAR TABELAS SEM RLS
-- =============================================

-- Esta query mostra todas as tabelas públicas sem RLS habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = false
ORDER BY tablename;

-- =============================================
-- 2. HABILITAR RLS EM TODAS AS TABELAS DE FIDELIDADE
-- =============================================

-- Garantir que RLS está habilitado em todas as tabelas
ALTER TABLE IF EXISTS public.fidelity_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.fidelity_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.fidelity_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.fidelity_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.fidelity_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.fidelity_appointment_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.fidelity_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.staff_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.services ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 3. CRIAR POLÍTICAS PARA STAFF_USERS (SE NÃO EXISTIREM)
-- =============================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "staff_users_select" ON public.staff_users;
DROP POLICY IF EXISTS "staff_users_manage" ON public.staff_users;

-- SELECT para authenticated
CREATE POLICY "staff_users_select" 
ON public.staff_users 
FOR SELECT 
TO authenticated 
USING (is_active = true);

-- Gerenciar apenas para ADMIN
CREATE POLICY "staff_users_manage" 
ON public.staff_users 
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
-- 4. CRIAR POLÍTICAS PARA STAFF_PROFILES (SE NÃO EXISTIREM)
-- =============================================

DROP POLICY IF EXISTS "staff_profiles_select" ON public.staff_profiles;
DROP POLICY IF EXISTS "staff_profiles_manage" ON public.staff_profiles;

CREATE POLICY "staff_profiles_select" 
ON public.staff_profiles 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "staff_profiles_manage" 
ON public.staff_profiles 
FOR ALL 
TO authenticated
USING (
    user_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.staff_profiles sp
        JOIN public.roles r ON sp.role_id = r.id
        WHERE sp.user_id = auth.uid() AND r.code = 'ADMIN'
    )
)
WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.staff_profiles sp
        JOIN public.roles r ON sp.role_id = r.id
        WHERE sp.user_id = auth.uid() AND r.code = 'ADMIN'
    )
);

-- =============================================
-- 5. CRIAR POLÍTICAS PARA ROLES (SE NÃO EXISTIREM)
-- =============================================

DROP POLICY IF EXISTS "roles_select" ON public.roles;

CREATE POLICY "roles_select" 
ON public.roles 
FOR SELECT 
TO authenticated 
USING (true);

-- =============================================
-- 6. CRIAR POLÍTICAS PARA SERVICES (SE NÃO EXISTIREM)
-- =============================================

DROP POLICY IF EXISTS "services_select" ON public.services;
DROP POLICY IF EXISTS "services_anon_select" ON public.services;
DROP POLICY IF EXISTS "services_manage" ON public.services;

CREATE POLICY "services_select" 
ON public.services 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "services_anon_select" 
ON public.services 
FOR SELECT 
TO anon 
USING (true);

CREATE POLICY "services_manage" 
ON public.services 
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
-- 7. VERIFICAÇÃO FINAL
-- =============================================

-- Mostrar todas as tabelas com RLS habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = pg_tables.tablename) as policies_count
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- =============================================
-- FIM DA MIGRAÇÃO 011
-- =============================================

SELECT 'Migração 011 - RLS verificado e corrigido em todas as tabelas!' AS status;
