# 🚀 GUIA DE DEPLOY - VERCEL

**Projeto**: Bedeschi Fidelidade/Estética
**Repositório**: https://github.com/erickerk/bedeschi-fidelidade.git

---

## ✅ STATUS ATUAL

### Commit Mais Recente
```
2886a9f - Versão atualizada da aplicação MVP Pronto 3.0
```

**Arquivos Incluídos no Último Commit**:
- ✅ `src/app/api/reviews/route.ts` (novo endpoint API)
- ✅ `src/lib/reviews-api.ts` (correção carregamento reviews)
- ✅ `src/lib/app-context.tsx` (deleteRule + carregamento profissionais)
- ✅ `src/app/admin/dashboard/page.tsx` (botão excluir regras)
- ✅ `src/lib/mock-data.ts` (interface Review atualizada)
- ✅ `CORRECOES-AVALIACOES.md` (documentação das correções)

**Status Git**:
```bash
✅ Branch: main
✅ Remote: origin (GitHub)
✅ Push Status: Everything up-to-date
```

---

## 🔄 DEPLOY AUTOMÁTICO VERCEL

### Como Funciona

O Vercel está conectado ao repositório GitHub e faz deploy automático quando:
1. **Push na branch main**: Deploy de produção
2. **Push em outras branches**: Deploy de preview
3. **Pull Request**: Deploy de preview com URL única

### Verificar Conexão Vercel

1. Acesse: https://vercel.com/dashboard
2. Vá no projeto: **bedeschi-fidelidade** (ou nome configurado)
3. Em **Settings → Git**, verifique:
   - ✅ **GitHub Repository**: erickerk/bedeschi-fidelidade
   - ✅ **Production Branch**: main
   - ✅ **Auto Deploy**: Enabled

---

## 🔧 FORÇAR REDEPLOY MANUAL

Se o deploy automático não disparou, você pode forçar manualmente:

### Opção 1: Via Vercel Dashboard
1. Acesse https://vercel.com/dashboard
2. Selecione o projeto
3. Clique em **Deployments**
4. Clique no botão **Redeploy** no último deploy

### Opção 2: Via CLI Vercel
```bash
# Instalar Vercel CLI (se não tiver)
npm i -g vercel

# Login
vercel login

# Deploy de produção
vercel --prod
```

### Opção 3: Empty Commit + Push
```bash
git commit --allow-empty -m "chore: trigger vercel redeploy"
git push origin main
```

---

## ⚙️ VARIÁVEIS DE AMBIENTE

**IMPORTANTE**: Verifique se todas as variáveis estão configuradas no Vercel:

### No Vercel Dashboard → Settings → Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://lvqcualqeevdenghexjm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Atenção**: 
- `SUPABASE_SERVICE_ROLE_KEY` é necessária para o endpoint `/api/reviews`
- Se não estiver configurada, o carregamento de avaliações falhará em produção

---

## 🛡️ PREVENÇÃO DE DESSINCRONIZAÇÃO

### Boas Práticas

1. **Sempre commitar antes de testar em produção**
   ```bash
   git add .
   git commit -m "feat: descrição da mudança"
   git push origin main
   ```

2. **Verificar status antes de desenvolver**
   ```bash
   git status
   git pull origin main
   ```

3. **Usar branches para features grandes**
   ```bash
   git checkout -b feature/nome-da-feature
   # desenvolver...
   git push origin feature/nome-da-feature
   # criar PR no GitHub → merge para main → deploy automático
   ```

4. **Validar deploy**
   - Aguardar conclusão do build no Vercel (2-3 minutos)
   - Testar a URL de produção
   - Verificar console do navegador para erros

---

## 📋 CHECKLIST DE DEPLOY

Antes de cada deploy importante:

- [ ] Todas as mudanças commitadas (`git status` limpo)
- [ ] Pushed para GitHub (`git push origin main`)
- [ ] Build local funcionando (`npm run build`)
- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] Aguardar conclusão do deploy (verificar em vercel.com)
- [ ] Testar URL de produção
- [ ] Validar funcionalidades críticas:
  - [ ] Login de clientes
  - [ ] Dashboard administrativo
  - [ ] Carregamento de avaliações (32 reviews)
  - [ ] Ranking de profissionais
  - [ ] Formulários (profissionais e serviços aparecem)

---

## 🚨 TROUBLESHOOTING

### Deploy falhou no Vercel

1. **Verificar logs do build**:
   - Dashboard Vercel → Deployments → clique no deploy → View Build Logs

2. **Erros comuns**:
   - **Erro de build**: Verificar sintaxe TypeScript/React
   - **Variável de ambiente faltando**: Adicionar no Vercel Settings
   - **Erro de dependências**: Verificar `package.json` e rodar `npm install`

### Versão antiga ainda aparece

1. **Limpar cache do navegador**: Ctrl+Shift+R
2. **Verificar URL correta**: Pode estar acessando preview ao invés de produção
3. **Forçar redeploy**: Ver opções acima

### Reviews não carregam em produção

1. **Verificar variável**: `SUPABASE_SERVICE_ROLE_KEY` no Vercel
2. **Testar endpoint**: `https://seu-site.vercel.app/api/reviews`
3. **Verificar RLS**: Políticas no Supabase devem permitir service_role

---

## 📊 MONITORAMENTO

### URLs Importantes

- **Produção**: Verificar no Vercel Dashboard
- **GitHub**: https://github.com/erickerk/bedeschi-fidelidade
- **Vercel Dashboard**: https://vercel.com/dashboard

### Validação Pós-Deploy

Após cada deploy, validar:
1. ✅ Homepage carrega
2. ✅ Login funciona
3. ✅ Admin Dashboard mostra dados corretos
4. ✅ Avaliação média: 3.9 ⭐ (não 0.0)
5. ✅ Botão excluir regras presente
6. ✅ Console sem erros críticos

---

## 🎯 RESUMO DEPLOY ATUAL

**Correções Implementadas e Prontas para Produção**:

1. ✅ Nome do profissional nas avaliações
2. ✅ Avaliação média corrigida (3.9 ⭐)
3. ✅ Botão excluir regras funcionando
4. ✅ Profissionais e serviços carregando nos formulários
5. ✅ Endpoint API `/api/reviews` para bypass RLS

**Status**: 
- ✅ Código no GitHub: Atualizado
- ⏳ Vercel: Aguardando redeploy automático ou manual

**Próximos Passos**:
1. Verificar deploy automático no Vercel
2. Se necessário, forçar redeploy manual
3. Validar todas as funcionalidades em produção
4. Limpar cache do navegador ao testar

---

**Última Atualização**: 07/01/2026
