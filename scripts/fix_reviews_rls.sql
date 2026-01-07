-- Correção de Permissões (RLS) para Avaliações
-- Execute este script no SQL Editor do Supabase para permitir que clientes enviem avaliações

-- Habilitar RLS na tabela (garantia)
ALTER TABLE fidelity_reviews ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas que possam estar bloqueando (opcional, mas recomendado)
DROP POLICY IF EXISTS "Permitir inserção pública" ON fidelity_reviews;
DROP POLICY IF EXISTS "Permitir leitura pública" ON fidelity_reviews;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON fidelity_reviews;

-- Criar política para permitir inserção de avaliações (qualquer pessoa com a chave API pública)
-- Como o login do cliente é via PIN e não Supabase Auth, precisamos permitir acesso público à tabela de reviews
CREATE POLICY "Permitir inserção pública de avaliações"
ON fidelity_reviews FOR INSERT
WITH CHECK (true);

-- Criar política para permitir leitura de avaliações
CREATE POLICY "Permitir leitura pública de avaliações"
ON fidelity_reviews FOR SELECT
USING (true);

-- Garantir que a tabela de atendimentos também permita atualização da flag has_review
CREATE POLICY "Permitir atualização de atendimentos"
ON fidelity_appointments FOR UPDATE
USING (true);
