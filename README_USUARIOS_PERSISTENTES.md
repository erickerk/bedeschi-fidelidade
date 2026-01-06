# 🔐 Sistema de Usuários Persistentes

## ⚠️ AÇÃO NECESSÁRIA: Criar Tabela no Supabase

Antes de criar usuários, você **DEVE** executar o SQL abaixo no Supabase:

### 📋 Passo a Passo:

1. **Acesse o SQL Editor do Supabase:**

   ```
   https://supabase.com/dashboard/project/lvqcualqeevdenghexjm/editor/sql
   ```

2. **Execute o SQL do arquivo:**

   ```
   SQL_CREATE_STAFF_USERS.sql
   ```

   Ou copie e execute diretamente:

   ```sql
   -- Criar tabela staff_users
   CREATE TABLE IF NOT EXISTS public.staff_users (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     email VARCHAR(255) UNIQUE NOT NULL,
     name VARCHAR(255) NOT NULL,
     role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'recepcao', 'profissional', 'medico')),
     password_hash TEXT NOT NULL,
     specialty TEXT,
     is_active BOOLEAN DEFAULT true,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     created_by VARCHAR(255),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Índices
   CREATE INDEX IF NOT EXISTS idx_staff_users_email ON public.staff_users(email);
   CREATE INDEX IF NOT EXISTS idx_staff_users_role ON public.staff_users(role);
   CREATE INDEX IF NOT EXISTS idx_staff_users_active ON public.staff_users(is_active);

   -- RLS
   ALTER TABLE public.staff_users ENABLE ROW LEVEL SECURITY;

   DROP POLICY IF EXISTS "Todos podem ler staff_users ativos" ON public.staff_users;
   DROP POLICY IF EXISTS "Permitir gerenciamento de staff_users" ON public.staff_users;

   CREATE POLICY "Todos podem ler staff_users ativos"
     ON public.staff_users FOR SELECT
     USING (is_active = true);

   CREATE POLICY "Permitir gerenciamento de staff_users"
     ON public.staff_users FOR ALL
     USING (true) WITH CHECK (true);
   ```

3. **Clique em "RUN" para executar**

4. **Verificar criação:**
   ```sql
   SELECT * FROM public.staff_users;
   ```

---

## 🎯 Como Funciona

### 1. **Criar Usuário (Admin Dashboard)**

Quando você cria um usuário da Recepção no Admin Dashboard:

- ✅ Usuário é salvo na tabela `staff_users` do Supabase
- ✅ Senha é criptografada com bcrypt (segurança)
- ✅ Usuário **NUNCA** é deletado pelo script de seed
- ✅ Persiste permanentemente no banco de dados

### 2. **Login**

Sistema de autenticação em cascata:

1. **Prioridade 1:** Busca em `staff_users` (Supabase) ⭐
2. **Fallback 1:** Credenciais padrão (admin, qa)
3. **Fallback 2:** localStorage (usuários antigos)

### 3. **Proteção contra Seed**

O script `reset-and-seed.js` **NÃO** deleta:

- ✅ `auth.users` (Supabase Auth)
- ✅ `staff_users` (Usuários criados pelo Admin) ⭐

---

## 🚀 Testando o Sistema

### Criar Usuário de Teste:

1. **Login como Admin:**
   - Email: `raul.admin@bedeschi.com.br`
   - Senha: `Bed3sch1#Adm!n2026`

2. **Ir para "Equipe"**

3. **Criar novo profissional:**
   - Nome: `Teste Recepção`
   - Papel: `Recepcionista`
   - Email: `teste@teste.com`
   - Senha: `senha123`

4. **Fazer logout e tentar logar:**
   - Email: `teste@teste.com`
   - Senha: `senha123`
   - ✅ Deve funcionar!

5. **Executar seed:**

   ```bash
   node scripts/reset-and-seed.js
   ```

6. **Tentar logar novamente:**
   - ✅ Usuário ainda existe!
   - ✅ Login funciona normalmente!

---

## 📊 Verificar Usuários Criados

### Via SQL Editor:

```sql
SELECT
  email,
  name,
  role,
  specialty,
  created_at,
  created_by
FROM public.staff_users
WHERE is_active = true
ORDER BY created_at DESC;
```

### Via Admin Dashboard:

- Acesse a aba "Equipe"
- Veja a seção "Usuários do Sistema" (em desenvolvimento)

---

## 🔧 Arquivos Importantes

| Arquivo                            | Descrição                        |
| ---------------------------------- | -------------------------------- |
| `SQL_CREATE_STAFF_USERS.sql`       | SQL para criar tabela            |
| `src/lib/staff-users-api.ts`       | API de gerenciamento de usuários |
| `src/app/admin/dashboard/page.tsx` | Cadastro de usuários             |
| `src/app/staff/login/page.tsx`     | Sistema de login                 |
| `scripts/reset-and-seed.js`        | Proteção contra exclusão         |

---

## ⚡ Resumo

✅ **Usuários criados pelo Admin são PERMANENTES**  
✅ **Nunca serão deletados pelo seed**  
✅ **Senhas criptografadas com bcrypt**  
✅ **Login automático via Supabase**  
✅ **Fallback para credenciais locais**

🎉 **Sistema pronto para produção!**
