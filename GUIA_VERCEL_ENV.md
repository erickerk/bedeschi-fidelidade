# 🚀 Guia Completo: Configurar Variáveis de Ambiente na Vercel

## ⚡ Passo 1: Acessar o Painel da Vercel

1. Acesse: **[https://vercel.com](https://vercel.com)**
2. Faça login com sua conta
3. Clique no projeto **bedeschi-fidelidade-app**
4. Vá para **Settings** (Configurações)

---

## 📝 Passo 2: Acessar Environment Variables

1. No menu lateral esquerdo, clique em **Environment Variables**
2. Você verá uma seção para adicionar variáveis

---

## 🔐 Passo 3: Adicionar Variáveis de Ambiente

Você precisa adicionar **4 variáveis**. Para cada uma:

1. Clique em **Add New**
2. Preencha os campos conforme abaixo
3. Selecione **Production** (ou todos os ambientes)
4. Clique em **Save**

### Variável 1: NEXT_PUBLIC_SUPABASE_URL

```
Nome: NEXT_PUBLIC_SUPABASE_URL
Valor: https://lvqcualqeevdenghexjm.supabase.co
Ambientes: Production, Preview, Development
```

### Variável 2: NEXT_PUBLIC_SUPABASE_ANON_KEY

```
Nome: NEXT_PUBLIC_SUPABASE_ANON_KEY
Valor: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2cWN1YWxxZWV2ZGVuZ2hleGptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NzQ3MDgsImV4cCI6MjA4MzA1MDcwOH0.-x0z-y2ETLwKTOCqOXoCu1Kro7LSUQX5SrEWF2Owkdw
Ambientes: Production, Preview, Development
```

### Variável 3: SUPABASE_SERVICE_ROLE_KEY

```
Nome: SUPABASE_SERVICE_ROLE_KEY
Valor: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2cWN1YWxxZWV2ZGVuZ2hleGptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ3NDcwOCwiZXhwIjoyMDgzMDUwNzA4fQ.S5xcYUHdYML67ujw57ye9-vnpL_gluH10WdoZL3SXHM
Ambientes: Production (apenas Production!)
```

### Variável 4: NEXT_PUBLIC_APP_URL

```
Nome: NEXT_PUBLIC_APP_URL
Valor: https://bedeschi-fidelidade-app.vercel.app
Ambientes: Production, Preview, Development
```

---

## ✅ Passo 4: Verificar as Variáveis

Após adicionar todas as 4 variáveis, você deve ver:

```
✓ NEXT_PUBLIC_SUPABASE_URL
✓ NEXT_PUBLIC_SUPABASE_ANON_KEY
✓ SUPABASE_SERVICE_ROLE_KEY
✓ NEXT_PUBLIC_APP_URL
```

---

## 🚀 Passo 5: Fazer o Deploy

Após configurar as variáveis, execute no terminal:

```bash
cd c:\Users\admin\Desktop\Fidelidade_clinica_estetica
npx vercel --prod --yes
```

Ou acesse o painel da Vercel e clique em **Deploy** na seção de Deployments.

---

## 📊 Passo 6: Monitorar o Deploy

1. Acesse: **[https://vercel.com/ericks-projects-a9788af3/bedeschi-fidelidade-app](https://vercel.com/ericks-projects-a9788af3/bedeschi-fidelidade-app)**
2. Vá para **Deployments**
3. Aguarde o status mudar para ✅ **Ready**

---

## 🔗 Links Úteis

- **Painel Vercel:** [https://vercel.com/ericks-projects-a9788af3/bedeschi-fidelidade-app](https://vercel.com/ericks-projects-a9788af3/bedeschi-fidelidade-app)
- **Settings:** [https://vercel.com/ericks-projects-a9788af3/bedeschi-fidelidade-app/settings](https://vercel.com/ericks-projects-a9788af3/bedeschi-fidelidade-app/settings)
- **Environment Variables:** [https://vercel.com/ericks-projects-a9788af3/bedeschi-fidelidade-app/settings/environment-variables](https://vercel.com/ericks-projects-a9788af3/bedeschi-fidelidade-app/settings/environment-variables)

---

## ⚠️ Importante

- **NUNCA** compartilhe as chaves de API publicamente
- As variáveis com `NEXT_PUBLIC_` são públicas (aparecem no cliente)
- As variáveis sem `NEXT_PUBLIC_` são privadas (apenas servidor)
- `SUPABASE_SERVICE_ROLE_KEY` é sensível - configure apenas em **Production**

---

## ✨ Pronto

Após seguir estes passos, seu aplicativo estará deployado na Vercel com todas as variáveis de ambiente configuradas corretamente!

Se houver erro no build, verifique:
1. ✅ Todas as 4 variáveis foram adicionadas
2. ✅ Os valores estão corretos (sem espaços extras)
3. ✅ O projeto está conectado ao GitHub
4. ✅ O branch é `main`
