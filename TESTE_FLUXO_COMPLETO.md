# 🧪 Teste Completo: Fluxo de Atendimentos e Avaliações

## 📋 Objetivo

Validar o fluxo completo:
1. Recepção cria atendimento
2. Cliente visualiza atendimento
3. Cliente avalia atendimento
4. Dashboard admin mostra avaliações

---

## ✅ Pré-requisitos

Antes de começar os testes:

### 1. Popular Banco de Dados

Execute o script SQL: `supabase/migrations/seed_clientes_avaliacoes.sql`

- Acesse: [Supabase Dashboard](https://supabase.com/dashboard)
- Projeto: **Bedeschi Fidelidade**
- SQL Editor → New Query
- Cole e execute o script

### 2. Cadastrar Profissionais

No Admin Dashboard:

1. Login: `admin@bedeschi.com` / `teste123`
2. Aba **Equipe** → **Novo Usuário**
3. Cadastre ao menos 2 profissionais:

**Profissional 1:**
- Nome: `Carla Santos`
- Papel: **Profissional**
- Especialidade: **Massagem e Estética Corporal**
- Email: (deixar vazio ou qualquer - será gerado automaticamente)
- ✅ Clique **Cadastrar**

**Profissional 2:**
- Nome: `Dra. Amanda Costa`
- Papel: **Médico**
- Especialidade: **Dermatologia Estética**
- Email: (deixar vazio)
- ✅ Clique **Cadastrar**

### 3. Verificar Clientes Cadastrados

Na Recepção, verifique se há clientes:

1. Login: `julia.atendente@bedeschi.com` / `teste123`
2. Aba **Clientes**
3. Se vazio, cadastre um cliente teste:
   - Nome: `Maria Silva Teste`
   - Telefone: `11987654321`
   - Email: `maria.teste@email.com`
   - ✅ Clique **Cadastrar**
   - Anote o PIN gerado (ex: `1234`)

---

## 🎯 Teste 1: Recepção Cria Atendimento

### Passo 1: Acessar Recepção

1. URL: `http://localhost:3001/recepcao`
2. Login: `julia.atendente@bedeschi.com` / `teste123`

### Passo 2: Criar Novo Atendimento

1. Clique botão **Novo Atendimento** (ícone Plus amarelo)
2. Preencha todos os campos:

**Cliente:**
- Digite o nome no campo de busca
- Selecione: `Maria Silva Teste` (ou outro cliente)

**Profissional:**
- Selecione: `Carla Santos - Massagem e Estética Corporal`

**Data:**
- Selecione: **Hoje** (data máxima permitida)

**Horário:**
- Selecione: `14:00` (ou qualquer horário)

**Procedimentos:**
- Digite: `massagem`
- Marque: ✅ `Massagem Relaxante 60min`
- Digite: `limpeza`
- Marque: ✅ `Limpeza de Pele`

3. **Verificar resumo:**
   - ✅ Deve mostrar: "2 procedimento(s) selecionado(s)"
   - ✅ Total: R$ 330,00 (ou valor dos serviços)

4. Clique **Registrar**

### Passo 3: Verificar Sucesso

**Esperado:**
- ✅ Alert de sucesso com detalhes do atendimento
- ✅ Modal fecha automaticamente
- ✅ Atendimento aparece na lista da aba **Atendimentos**

**Console do navegador:**
```
📝 Iniciando criação de atendimento...
✅ Atendimento criado: {id: "...", clientId: "...", ...}
[AppContext] Criando agendamento no Supabase...
✅ Formulário resetado e modal fechado
```

### Passo 4: Verificar no Supabase

1. Supabase → SQL Editor
2. Execute:

```sql
SELECT 
  a.client_name,
  a.professional_name,
  a.date,
  a.total,
  a.points_earned,
  a.has_review,
  ARRAY_LENGTH(a.services, 1) as num_services
FROM public.appointments a
ORDER BY a.created_at DESC
LIMIT 5;
```

**Esperado:**
- ✅ Atendimento aparece no topo
- ✅ `has_review` = `false`
- ✅ Dados corretos (cliente, profissional, total, pontos)

---

## 🎯 Teste 2: Cliente Visualiza Atendimento

### Passo 1: Acessar Painel do Cliente

1. URL: `http://localhost:3001/c/bedeschi`
2. Fazer logout da recepção se necessário

### Passo 2: Login do Cliente

1. Digite o telefone: `11987654321` (sem formatação)
2. Digite o PIN: `1234` (ou o PIN anotado)
3. Clique **Acessar**

### Passo 3: Verificar Dashboard do Cliente

**Aba Início:**
- ✅ Saldo de pontos atualizado
- ✅ Gasto total atualizado
- ✅ Última visita mostra data de hoje

**Aba Histórico:**
1. Clique em **Histórico**
2. **Verificar:**
   - ✅ Atendimento criado aparece no topo
   - ✅ Mostra profissional: `Carla Santos`
   - ✅ Mostra procedimentos: `Massagem Relaxante 60min`, `Limpeza de Pele`
   - ✅ Mostra total: R$ 330,00
   - ✅ Mostra pontos ganhos: 330

### Passo 4: Verificar Modal de Avaliação

**Esperado:**
- ✅ Modal de avaliação aparece automaticamente
- ✅ Título: "Avalie seu último atendimento"
- ✅ Mostra profissional correto
- ✅ Sistema de estrelas (1-5)
- ✅ Campo de comentário opcional

---

## 🎯 Teste 3: Cliente Avalia Atendimento

### Passo 1: Avaliar

1. Clique nas estrelas: **5 estrelas** ⭐⭐⭐⭐⭐
2. Digite comentário:
```
Excelente atendimento! A Carla é muito profissional e atenciosa. Saí relaxada e renovada. Super recomendo!
```
3. Clique **Enviar Avaliação**

### Passo 2: Verificar Confirmação

**Esperado:**
- ✅ Mensagem: "✓ Avaliação enviada com sucesso!"
- ✅ Modal fecha após 2 segundos
- ✅ Atendimento agora mostra: "✓ Avaliado"

**Console do navegador:**
```
✅ Review criada: {id: "rev-...", rating: 5, comment: "..."}
[AppContext] Criando review no Supabase...
```

### Passo 3: Verificar no Supabase

Execute:

```sql
SELECT 
  r.rating,
  r.comment,
  c.name as customer_name,
  s.name as staff_name,
  r.created_at
FROM public.reviews r
JOIN public.customers c ON c.id = r.customer_id
JOIN public.staff_users s ON s.id = r.staff_id
ORDER BY r.created_at DESC
LIMIT 5;
```

**Esperado:**
- ✅ Avaliação aparece no topo
- ✅ Rating: 5
- ✅ Comentário completo
- ✅ Nomes corretos (cliente e profissional)

---

## 🎯 Teste 4: Dashboard Admin Mostra Avaliações

### Passo 1: Acessar Admin

1. URL: `http://localhost:3001/admin/dashboard`
2. Login: `admin@bedeschi.com` / `teste123`
3. Aba **Dashboard**

### Passo 2: Verificar Seção "Mais Bem Avaliados"

**Esperado:**
- ✅ Profissional aparece na lista
- ✅ Nome: `Carla Santos`
- ✅ Estrelas: ⭐⭐⭐⭐⭐ (5.0)
- ✅ Número de avaliações: 1

### Passo 3: Verificar Seção "Piores Avaliações"

**Esperado:**
- ✅ Nenhuma avaliação negativa (seção vazia ou apenas 5 estrelas)

### Passo 4: Verificar Analytics (Se houver)

- ✅ Gráfico de satisfação mostra 100%
- ✅ Total de avaliações: 1
- ✅ Média geral: 5.0

---

## 🎯 Teste 5: Criar Múltiplos Atendimentos

Repita o **Teste 1** para criar mais atendimentos:

### Atendimento 2

- Cliente: Outro cliente ou mesmo cliente
- Profissional: `Dra. Amanda Costa`
- Procedimentos: `Harmonização Facial`, `Peeling Facial`
- Data/Horário: Hoje, 15:00

### Atendimento 3

- Cliente: Outro cliente
- Profissional: `Carla Santos`
- Procedimentos: `Massagem Modeladora`
- Data/Horário: Hoje, 16:00

**Para cada atendimento:**
1. ✅ Criar na recepção
2. ✅ Cliente visualizar
3. ✅ Cliente avaliar (varie as notas: 4, 5 estrelas)
4. ✅ Verificar no dashboard admin

---

## 📊 Resultado Final Esperado

### Dashboard Admin

**Mais Bem Avaliados:**
- `Carla Santos` - ⭐⭐⭐⭐⭐ (5.0) - 2 avaliações
- `Dra. Amanda Costa` - ⭐⭐⭐⭐ (4.0) - 1 avaliação

**Estatísticas:**
- Total de atendimentos: 3+
- Total de avaliações: 3+
- Média geral: 4.7
- Taxa de satisfação: 100% (4+ estrelas)

### Supabase

**Tabela `appointments`:**
- 3+ registros
- Todos com `status = 'completed'`
- Todos com `has_review = true`

**Tabela `reviews`:**
- 3+ registros
- Ratings: 4, 5
- Comentários preenchidos

**Tabela `customers`:**
- Saldo de pontos atualizado
- `total_spent` incrementado
- `total_appointments` incrementado

---

## ❌ Problemas Comuns e Soluções

### Problema 1: Atendimento não salva

**Sintomas:**
- Clica em "Registrar" mas nada acontece
- Modal não fecha
- Nenhum alert aparece

**Solução:**
1. Abra o Console do navegador (F12)
2. Procure por erros em vermelho
3. Verifique se todos os campos foram preenchidos:
   - ✅ Cliente selecionado
   - ✅ Profissional selecionado
   - ✅ Data preenchida
   - ✅ Pelo menos 1 procedimento marcado

### Problema 2: Cliente não vê atendimento

**Sintomas:**
- Cliente loga mas histórico está vazio
- Atendimento foi criado na recepção

**Solução:**
1. Verifique se usou o telefone correto (sem formatação)
2. Verifique se o PIN está correto
3. Verifique no Supabase se o `client_id` está correto:

```sql
SELECT id, name, phone FROM customers WHERE phone = '11987654321';
```

### Problema 3: Modal de avaliação não aparece

**Sintomas:**
- Cliente vê atendimento mas não aparece modal para avaliar

**Solução:**
1. Verifique se o atendimento já foi avaliado
2. Verifique no console por erros
3. Force refresh (Ctrl+Shift+R)

### Problema 4: Dashboard admin não mostra avaliações

**Sintomas:**
- Avaliações foram feitas mas dashboard mostra vazio

**Solução:**
1. Verifique no Supabase se as reviews foram salvas:

```sql
SELECT COUNT(*) FROM reviews;
```

2. Limpe o cache do navegador
3. Faça logout e login novamente no admin

---

## 🚀 Checklist Final

Antes de considerar o teste completo, marque:

- [ ] Recepção consegue criar atendimento
- [ ] Atendimento salvo no Supabase
- [ ] Cliente consegue fazer login
- [ ] Cliente visualiza atendimento no histórico
- [ ] Modal de avaliação aparece automaticamente
- [ ] Cliente consegue avaliar (estrelas + comentário)
- [ ] Avaliação salva no Supabase
- [ ] Dashboard admin mostra profissional avaliado
- [ ] Pontos do cliente foram atualizados
- [ ] Múltiplos atendimentos funcionam corretamente

**Status:** ✅ FLUXO COMPLETO VALIDADO

---

## 📝 Logs Úteis para Debug

Abra o Console do navegador (F12) e monitore:

**Recepção criando atendimento:**
```
📝 Iniciando criação de atendimento...
✅ Atendimento criado: {...}
[AppContext] Criando agendamento no Supabase...
✅ Formulário resetado e modal fechado
```

**Cliente avaliando:**
```
✅ Review criada: {...}
[AppContext] Criando review no Supabase...
[AppContext] Atendimento marcado como avaliado
```

**Admin carregando dados:**
```
[AppContext] Carregando dados do Supabase Bedeschi...
[AppContext] X avaliações carregadas do Supabase
```

---

## 🎓 Conclusão

Este guia cobre todo o fluxo de atendimentos e avaliações. Siga os passos em ordem e verifique cada checkpoint. Se todos os testes passarem, o sistema está funcionando corretamente!

**Dúvidas ou problemas?**
- Verifique os logs do console
- Confira os dados no Supabase
- Revise se todos os pré-requisitos foram cumpridos
