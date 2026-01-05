# 🔄 Redeploy: Cache-Busting e QR Code

## ✅ Alterações Realizadas

### 1. Cache-Busting Headers

Adicionados headers para forçar atualização em todos os dispositivos:

- `Cache-Control: public, max-age=0, must-revalidate` - Força revalidação a cada acesso
- Assets estáticos (`/_next/static/`) mantêm cache de 1 ano com `immutable`

**Resultado:** Todos os dispositivos verão sempre a versão mais recente do site.

### 2. QR Code URL

Alterado de:

```
https://institutobedeschi.com.br
```

Para:

```
https://bedeschi-fidelidade-app.vercel.app
```

**Resultado:** QR code agora direciona para a aplicação Vercel correta.

---

## 🚀 Próximos Passos

### 1. Fazer Commit das Alterações

```bash
git add next.config.js src/app/c/[tenant]/page.tsx
git commit -m "fix: cache-busting headers e QR code URL para Vercel"
git push origin main
```

### 2. Fazer Deploy na Vercel

```bash
npx vercel --prod --yes
```

### 3. Aguardar Build

- O build deve levar 2-3 minutos
- Verifique em: [https://vercel.com/ericks-projects-a9788af3/bedeschi-fidelidade-app/deployments](https://vercel.com/ericks-projects-a9788af3/bedeschi-fidelidade-app/deployments)

### 4. Validar em Múltiplos Dispositivos

- Limpe o cache do navegador (Ctrl+Shift+Delete)
- Acesse: [https://bedeschi-fidelidade-app.vercel.app](https://bedeschi-fidelidade-app.vercel.app)
- Escaneie o QR code com outro dispositivo
- Verifique se ambos veem a mesma versão

---

## 🔍 Como Funciona o Cache-Busting

**Antes (problema):**

- Navegadores cacheavam versões antigas indefinidamente
- Diferentes dispositivos viam versões diferentes

**Depois (solução):**

- `max-age=0` força revalidação a cada acesso
- `must-revalidate` garante que sempre busca a versão mais recente
- Assets estáticos (`/_next/static/`) continuam cacheados (otimização)

---

## 📱 Teste do QR Code

1. Abra a aplicação em um dispositivo
2. Escaneie o QR code com outro dispositivo
3. Ambos devem acessar: [https://bedeschi-fidelidade-app.vercel.app](https://bedeschi-fidelidade-app.vercel.app)

---

## ⚠️ Importante

- **Não limpe o cache manualmente** - o header `Cache-Control` faz isso automaticamente
- **Todos os dispositivos verão a mesma versão** após o redeploy
- **O QR code agora aponta para a URL correta** da aplicação
