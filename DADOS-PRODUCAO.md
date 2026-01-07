# 📋 Gestão de Dados em Produção

## ⚠️ IMPORTANTE - Proteção de Dados

### O que NÃO fazer:
- ❌ **NUNCA** acessar a rota `/api/seed-test-data` em produção (está desativada)
- ❌ **NUNCA** executar scripts que deletem dados sem confirmação explícita
- ❌ **NUNCA** usar `supabase.from(...).delete().gte()` sem WHERE específico

### Proteções Implementadas:
✅ Rota `/api/seed-test-data` **DESATIVADA** - retorna erro 403
✅ Dados só são deletados via Admin Dashboard com confirmação dupla
✅ AppContext sincroniza automaticamente com Supabase (não perde dados)
✅ Clientes e equipe só são removidos quando Admin explicitamente deleta

---

## 🎯 Como Popular/Gerenciar Dados em Produção

### 1. Cadastrar Serviços (via Admin Dashboard)
1. Acesse: `/admin/dashboard`
2. Aba **Serviços**
3. Botão "Adicionar Serviço"
4. Preencha: nome, categoria, preço, duração

### 2. Cadastrar Equipe (via Admin Dashboard)
1. Acesse: `/admin/dashboard`
2. Aba **Equipe**
3. Botão "Adicionar Profissional"
4. Preencha: nome, email, função, especialidade

### 3. Cadastrar Clientes (via Recepção)
1. Acesse: `/recepcao`
2. Aba **Clientes**
3. Botão "Novo Cliente"
4. Preencha: nome, telefone, email, data de nascimento
5. Sistema gera PIN automaticamente

### 4. Registrar Atendimentos (via Recepção)
1. Acesse: `/recepcao`
2. Aba **Atendimentos**
3. Botão "Novo Atendimento"
4. Selecione: cliente, serviços, profissional, data/hora
5. Sistema calcula pontos automaticamente

### 5. Criar Regras de Fidelidade (via Admin)
1. Acesse: `/admin/dashboard`
2. Aba **Regras**
3. Botão "Nova Regra"
4. Configure: tipo, threshold, recompensa, validade

---

## 🔒 Exclusão Segura de Dados

### Deletar Cliente (apenas Admin)
- Admin Dashboard > Clientes > Botão de exclusão
- **Confirmação dupla obrigatória**
- Deleta cascata: cliente + atendimentos + recompensas

### Deletar Profissional (apenas Admin)
- Admin Dashboard > Equipe > Botão de exclusão
- **Confirmação obrigatória**
- Atendimentos antigos mantêm nome do profissional

### Deletar Serviço
- Admin Dashboard > Serviços > Botão de exclusão
- Atendimentos antigos mantêm registro do serviço

---

## 📊 Sincronização de Dados

### Carregamento Inicial
- Ao abrir qualquer tela, `AppContext` carrega todos os dados do Supabase
- Cache em memória para performance
- Dados sempre sincronizados com banco

### Atualização de Dados
- Qualquer alteração é **PERSISTIDA NO SUPABASE** imediatamente
- Estado local atualizado após confirmação do banco
- Em caso de erro, dados locais são preservados

### Refresh Manual
- Admin pode forçar recarregamento via `refreshData()`
- Garante sincronização total com Supabase

---

## 🧪 Ambiente de Desenvolvimento

Para popular dados de TESTE em ambiente LOCAL:

1. **Via Supabase Studio**:
   ```bash
   npm run db:studio
   ```
   Acesse http://localhost:54323 e insira dados manualmente

2. **Via SQL Migration** (preferido):
   Criar arquivo em `supabase/migrations/` com INSERT statements

3. **Via Interface Admin**:
   Use as telas normais de Admin/Recepção

---

## 🚨 Troubleshooting

### "Meus dados sumiram!"
- Verificar se alguém acessou `/api/seed-test-data` (agora bloqueada)
- Verificar logs do Supabase para ver quem deletou
- Restaurar do backup do Supabase (ativar Point-in-Time Recovery)

### "Gráficos sem dados"
- Verificar se há atendimentos cadastrados
- Verificar filtro de data (pode estar filtrando período sem dados)
- Verificar se serviços têm `category_id` preenchido

### "Cliente não aparece"
- Verificar se `is_active = true`
- Verificar se telefone está correto
- Verificar logs do `AppContext` no console

---

## 📝 Logs e Monitoramento

- Console do navegador: logs do `AppContext`
- Supabase Dashboard: logs de queries e erros
- Supabase Auth: logs de login/logout da equipe

**Nunca expor dados sensível em logs de produção!**
