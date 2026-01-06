# ⚙️ Configurar Variáveis de Ambiente na Vercel (Manual)

## 🔴 Problema Identificado

O build falhou na Vercel porque as variáveis de ambiente **não estão configuradas** no painel da Vercel.

- ✅ Build local: **Funciona** (usa `.env.local`)
- ❌ Build Vercel: **Falha** (sem variáveis no painel)

---

## 🚀 Solução: Adicionar Variáveis no Painel da Vercel

### Passo 1: Acessar o Painel

1. Acesse: [https://vercel.com/ericks-projects-a9788af3/bedeschi-fidelidade-app](https://vercel.com/ericks-projects-a9788af3/bedeschi-fidelidade-app)
2. Clique em **Settings** (Configurações)
3. Clique em **Environment Variables**

---

### Passo 2: Adicionar as 4 Variáveis

Para cada variável abaixo, clique em **Add New** e preencha:

#### Variável 1: NEXT_PUBLIC_SUPABASE_URL

```
Nome: NEXT_PUBLIC_SUPABASE_URL
Valor: https://lvqcualqeevdenghexjm.supabase.co
Ambientes: Production, Preview, Development
```

#### Variável 2: NEXT_PUBLIC_SUPABASE_ANON_KEY

```
Nome: NEXT_PUBLIC_SUPABASE_ANON_KEY
Valor: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2cWN1YWxxZWV2ZGVuZ2hleGptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NzQ3MDgsImV4cCI6MjA4MzA1MDcwOH0.-x0z-y2ETLwKTOCqOXoCu1Kro7LSUQX5SrEWF2Owkdw
Ambientes: Production, Preview, Development
```

#### Variável 3: SUPABASE_SERVICE_ROLE_KEY

```
Nome: SUPABASE_SERVICE_ROLE_KEY
Valor: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2cWN1YWxxZWV2ZGVuZ2hleGptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ3NDcwOCwiZXhwIjoyMDgzMDUwNzA4fQ.S5xcYUHdYML67ujw57ye9-vnpL_gluH10WdoZL3SXHM
Ambientes: Production (APENAS Production!)
```

#### Variável 4: NEXT_PUBLIC_APP_URL

```
Nome: NEXT_PUBLIC_APP_URL
Valor: https://bedeschi-fidelidade-app.vercel.app
Ambientes: Production, Preview, Development
```

---

### Passo 3: Verificar as Variáveis

Após adicionar todas, você deve ver:

```
✓ NEXT_PUBLIC_SUPABASE_URL
✓ NEXT_PUBLIC_SUPABASE_ANON_KEY
✓ SUPABASE_SERVICE_ROLE_KEY
✓ NEXT_PUBLIC_APP_URL
```

---

### Passo 4: Fazer Redeploy

Após salvar as variáveis, aguarde 1-2 minutos e execute:

```bash
npx vercel --prod --yes
```

Ou clique em **Redeploy** no painel da Vercel.

---

## ✅ Validação Após Deploy

1. Acesse: [https://bedeschi-fidelidade-app.vercel.app](https://bedeschi-fidelidade-app.vercel.app)
2. Limpe o cache do navegador (Ctrl+Shift+Delete)
3. Verifique se a versão está igual à local
4. Teste em outro dispositivo
5. Escaneie o QR code

---

## 🔍 Por que o Build Falha?

**Sem as variáveis na Vercel:**

- `NEXT_PUBLIC_SUPABASE_URL` ❌ undefined
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ❌ undefined
- `SUPABASE_SERVICE_ROLE_KEY` ❌ undefined
- `NEXT_PUBLIC_APP_URL` ❌ undefined

O Next.js tenta usar essas variáveis durante o build e falha.

**Com as variáveis configuradas:**

- ✅ Build completa com sucesso
- ✅ Aplicação funciona corretamente
- ✅ Todos os dispositivos veem a mesma versão

---

## ⚠️ Importante

- **Copie os valores EXATAMENTE** como estão (sem espaços extras)
- **Não compartilhe as chaves** publicamente
- **SUPABASE_SERVICE_ROLE_KEY** deve estar **APENAS em Production**
- Após salvar, aguarde 1-2 minutos antes de fazer redeploy
