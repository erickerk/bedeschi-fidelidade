# 🔒 Correção de RLS (Row Level Security) - Bedeschi Fidelidade

## 📋 Problema Identificado

O Supabase detectou que a tabela `public.fidelity_services` está pública mas **não tem RLS habilitado**, o que representa um risco de segurança.

```
⚠️ Table public.fidelity_services is public, but RLS has not been enabled.
```

## ✅ Solução Implementada

Foram criadas **2 migrações SQL** para corrigir o problema:

### 1. **Migração 010** - Criar/Corrigir `fidelity_services` com RLS
📄 Arquivo: `supabase/migrations/010_create_fidelity_services_with_rls.sql`

**O que faz:**
- Cria a tabela `fidelity_services` (se não existir)
- Adiciona índices para performance
- Habilita RLS na tabela
- Cria 3 políticas de segurança:
  - **SELECT para authenticated**: usuários autenticados podem ver serviços ativos
  - **SELECT para anon**: usuários anônimos podem ver serviços ativos
  - **ALL para ADMIN**: apenas admins podem criar/editar/deletar serviços

### 2. **Migração 011** - Verificar e Corrigir RLS em Todas as Tabelas
📄 Arquivo: `supabase/migrations/011_verify_and_fix_all_rls.sql`

**O que faz:**
- Verifica todas as tabelas públicas sem RLS
- Habilita RLS em **todas** as tabelas do sistema
- Cria políticas para tabelas que estavam faltando:
  - `staff_users`
  - `staff_profiles`
  - `roles`
  - `services`
- Exibe relatório final com status de RLS de todas as tabelas

## 🚀 Como Executar

### **Opção 1: Via Supabase Studio (Recomendado)**

1. Acesse o **Supabase Studio**: https://lvqcualqeevdenghexjm.supabase.co
2. Vá em **SQL Editor** (menu lateral esquerdo)
3. Clique em **New Query**
4. Execute as migrações **na ordem**:

#### Passo 1: Execute a Migração 010
```sql
-- Cole o conteúdo completo do arquivo:
-- supabase/migrations/010_create_fidelity_services_with_rls.sql
```

#### Passo 2: Execute a Migração 011
```sql
-- Cole o conteúdo completo do arquivo:
-- supabase/migrations/011_verify_and_fix_all_rls.sql
```

5. Verifique os resultados:
   - A última query mostra uma tabela com todas as tabelas e seu status de RLS
   - Todas devem ter `rls_enabled = true`

### **Opção 2: Via CLI do Supabase**

```bash
# Certifique-se de estar no diretório do projeto
cd c:\Users\admin\Desktop\Fidelidade_clinica_estetica

# Execute as migrações
npx supabase db push
```

## 🔍 Verificação Pós-Execução

Após executar as migrações, execute esta query no SQL Editor para confirmar:

```sql
-- Verificar RLS em todas as tabelas
SELECT 
    tablename,
    rowsecurity as rls_enabled,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = pg_tables.tablename) as policies_count
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Resultado esperado:**
- Todas as tabelas devem ter `rls_enabled = true`
- Cada tabela deve ter pelo menos 1 política (`policies_count > 0`)

## 📊 Tabelas Protegidas

Após a correção, as seguintes tabelas terão RLS habilitado:

✅ `fidelity_services` ← **CORRIGIDO**
✅ `fidelity_clients`
✅ `fidelity_rules`
✅ `fidelity_rewards`
✅ `fidelity_appointments`
✅ `fidelity_appointment_services`
✅ `fidelity_reviews`
✅ `staff_users`
✅ `staff_profiles`
✅ `roles`
✅ `services`

## 🛡️ Políticas de Segurança Implementadas

### Para `fidelity_services`:

| Operação | Quem pode | Condição |
|----------|-----------|----------|
| SELECT | authenticated | Apenas serviços ativos |
| SELECT | anon | Apenas serviços ativos |
| INSERT/UPDATE/DELETE | authenticated | Apenas usuários com role ADMIN |

### Para outras tabelas:
- **Leitura**: Usuários autenticados e/ou anônimos (conforme regra de negócio)
- **Escrita**: Apenas ADMIN ou RECEPCAO (conforme tabela)

## ⚠️ IMPORTANTE

- **Não execute** essas migrações em ambiente de produção sem backup
- **Teste primeiro** em ambiente de desenvolvimento/staging
- As políticas RLS seguem o padrão de segurança do projeto
- Se você tiver dados sensíveis, revise as políticas antes de executar

## 📝 Logs de Execução

Ao executar as migrações, você verá mensagens como:

```
✅ Migração 010 - Tabela fidelity_services criada com RLS habilitado!
✅ Migração 011 - RLS verificado e corrigido em todas as tabelas!
```

## 🆘 Troubleshooting

### Erro: "relation already exists"
- **Causa**: A tabela já existe
- **Solução**: Normal, o script usa `CREATE TABLE IF NOT EXISTS`

### Erro: "policy already exists"
- **Causa**: Política já foi criada
- **Solução**: O script remove políticas antigas antes de criar (`DROP POLICY IF EXISTS`)

### Erro: "permission denied"
- **Causa**: Usuário sem permissão
- **Solução**: Use a `service_role_key` ou execute como admin no Supabase Studio

## 📞 Suporte

Projeto: **Bedeschi Fidelidade/Estética**
- Project ID: `lvqcualqeevdenghexjm`
- URL: https://lvqcualqeevdenghexjm.supabase.co
- Organização: Bedeschi

---

**Data de criação**: 21/01/2026
**Versão**: 1.0
**Status**: ✅ Pronto para execução
