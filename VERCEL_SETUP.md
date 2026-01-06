# 🚀 Configuração do Deploy na Vercel

## ❌ Erro Atual

```
Error: supabaseKey is required.
```

**Causa:** As variáveis de ambiente do Supabase não estão configuradas na Vercel.

---

## ✅ Solução: Configurar Variáveis de Ambiente

### 1. Acesse o Painel da Vercel

1. Vá para [vercel.com](https://vercel.com)
2. Selecione o projeto **bedeschi-fidelidade**
3. Clique em **Settings** (Configurações)
4. No menu lateral, clique em **Environment Variables** (Variáveis de Ambiente)

---

### 2. Adicione as Variáveis Obrigatórias

Copie os valores do seu arquivo `.env.local` e adicione na Vercel:

#### **Variáveis Obrigatórias:**

| Nome | Valor | Ambiente |
|------|-------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | https://lvqcualqeevdenghexjm.supabase.co | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sua anon key do Supabase | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | Sua service role key | Production, Preview, Development |

#### **Como adicionar:**

1. Clique em **Add New**
2. Cole o **Nome** da variável (ex: `NEXT_PUBLIC_SUPABASE_URL`)
3. Cole o **Valor** (copie do `.env.local`)
4. Selecione os ambientes: **✓ Production ✓ Preview ✓ Development**
5. Clique em **Save**
6. Repita para cada variável

---

### 3. Onde Encontrar suas Chaves do Supabase

#### **URL do Projeto:**
```
https://lvqcualqeevdenghexjm.supabase.co
```

#### **Anon Key e Service Role Key:**

1. Acesse [supabase.com](https://supabase.com)
2. Abra o projeto **Bedeschi Fidelidade**
3. Vá em **Settings** → **API**
4. Copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** (🔐 Secret) → `SUPABASE_SERVICE_ROLE_KEY`

---

### 4. Variáveis Opcionais (mas recomendadas)

| Nome | Descrição | Valor Sugerido |
|------|-----------|----------------|
| `NEXT_PUBLIC_APP_URL` | URL do seu app | `https://seu-dominio.vercel.app` |
| `NEXT_PUBLIC_APP_NAME` | Nome da aplicação | `Bedeschi Fidelidade` |

---

### 5. Fazer Redeploy

Após adicionar as variáveis:

1. Vá em **Deployments**
2. Clique nos **...** (três pontos) do último deploy
3. Selecione **Redeploy**
4. Aguarde o build completar

---

## 🔒 Segurança - Token Exposto no GitHub

### ⚠️ AÇÃO URGENTE NECESSÁRIA

O GitHub detectou um token exposto no arquivo `scripts/setup-supabase.js`.

### **O que fazer AGORA:**

#### 1. **Revogar o Token Exposto**

1. Acesse [supabase.com](https://supabase.com)
2. Vá em **Account** → **Access Tokens**
3. Localize o token que começa com `sbp_fbf88a127de883ddbc531dd002d652e730504570`
4. Clique em **Revoke** (Revogar)

#### 2. **Gerar Novo Token**

1. Na mesma página, clique em **Generate New Token**
2. Dê um nome: `Bedeschi Fidelidade - Setup`
3. Defina permissões: ✓ All (se necessário)
4. Copie o novo token

#### 3. **Atualizar .env.local**

Adicione no arquivo `.env.local`:

```env
SUPABASE_PROJECT_ID=lvqcualqeevdenghexjm
SUPABASE_ACCESS_TOKEN=seu-novo-token-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
```

#### 4. **Verificar .gitignore**

Certifique-se que `.env.local` está no `.gitignore`:

```
.env.local
.env*.local
```

---

## 📋 Checklist de Deploy

- [ ] Variáveis de ambiente adicionadas na Vercel
- [ ] Token exposto revogado no Supabase
- [ ] Novo token gerado e salvo em `.env.local`
- [ ] `.env.local` está no `.gitignore`
- [ ] Redeploy feito na Vercel
- [ ] Deploy concluído com sucesso

---

## 🧪 Verificar Deploy

Após o deploy:

1. Acesse: `https://seu-projeto.vercel.app`
2. Teste o login: `/staff/login`
3. Teste a recepção: `/recepcao`
4. Verifique no console do navegador se não há erros

---

## ❓ Problemas Comuns

### Erro: "supabaseKey is required"
- ✅ Adicione as variáveis na Vercel
- ✅ Faça redeploy após adicionar

### Erro: "Invalid API key"
- ✅ Verifique se copiou a chave correta do Supabase
- ✅ Certifique-se de usar `anon public` (não `service_role`) para `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Página em branco
- ✅ Verifique logs no painel da Vercel
- ✅ Teste localmente com `npm run build && npm start`

---

## 📞 Precisa de Ajuda?

Se continuar com problemas:

1. Verifique os logs no painel da Vercel
2. Rode localmente: `npm run build` para replicar o erro
3. Verifique se todas as variáveis foram adicionadas corretamente

---

## ✅ Resumo

**3 passos para resolver:**

1. **Adicionar variáveis na Vercel** (Settings → Environment Variables)
2. **Revogar token exposto** (Supabase → Access Tokens → Revoke)
3. **Fazer redeploy** (Deployments → Redeploy)

Após esses passos, seu deploy funcionará! 🎉
