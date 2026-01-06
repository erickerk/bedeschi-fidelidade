# 📊 Instruções: Popular Banco com Clientes e Avaliações

## ✅ Alterações Implementadas

### 1. Login Apenas para Recepcionistas ✅

**Antes:** Todos precisavam de email e senha
**Agora:**

- ✅ **Recepcionistas:** Precisam de email e senha (acesso ao sistema)
- ✅ **Profissionais/Médicos:** Não precisam de email/senha (apenas prestadores de serviço)
  - Email gerado automaticamente: `nome.profissional@prestador.bedeschi.local`
  - Senha padrão (não utilizada): `prestador123`

**Benefício:** Profissionais e médicos são cadastrados apenas para seleção em atendimentos e avaliações.

### 2. Lista de Especialidades Predefinida ✅

**Campo:** Especialidade (select dropdown)

**Opções disponíveis:**

- Massagem e Estética Corporal
- Estética Facial
- Depilação
- Design de Sobrancelhas
- Micropigmentação
- Alongamento de Cílios
- Manicure e Pedicure
- Dermatologia Estética
- Harmonização Facial
- Fisioterapia Dermato-Funcional
- Nutrição Estética
- Cosmetologia
- **Outra** (permite digitar especialidade customizada)

**Benefício:** Evita erros de digitação e padroniza especialidades.

### 3. Script SQL de Dados de Exemplo ✅

Criado: `supabase/migrations/seed_clientes_avaliacoes.sql`

**Dados incluídos:**

- 10 clientes com nomes, telefones, emails e PINs
- Pontos, gastos e número de atendimentos
- Atendimentos vinculados a profissionais
- Avaliações de 4 e 5 estrelas com comentários

---

## 🚀 Como Popular o Banco de Dados

### Passo 1: Acessar Supabase

1. Acesse: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione o projeto: **Bedeschi Fidelidade**
3. URL: `https://lvqcualqeevdenghexjm.supabase.co`

### Passo 2: Abrir SQL Editor

1. Menu lateral → **SQL Editor**
2. Clique em **New Query**

### Passo 3: Copiar e Executar o SQL

1. Abra o arquivo: `supabase/migrations/seed_clientes_avaliacoes.sql`
2. Copie TODO o conteúdo (Ctrl+A, Ctrl+C)
3. Cole no SQL Editor do Supabase
4. Clique em **RUN** (botão verde no canto inferior direito)

### Passo 4: Verificar Execução

Aguarde a mensagem: **Success. No rows returned**

Se houver erro, leia a mensagem. Possíveis causas:

- Tabelas já existem: OK, prossiga
- Conflito de dados: Execute apenas a seção de INSERT

---

## 📋 Validação dos Dados

### 1. Verificar Clientes

**SQL de verificação:**

```sql
SELECT name, phone, pin, points_balance, total_appointments
FROM public.customers
ORDER BY created_at DESC
LIMIT 10;
```

**Resultado esperado:** 10 clientes listados

### 2. Verificar Atendimentos

**SQL de verificação:**

```sql
SELECT
  a.appointment_date,
  a.staff_name,
  c.name as customer_name,
  a.total_amount,
  a.has_review
FROM public.appointments a
JOIN public.customers c ON c.id = a.customer_id
ORDER BY a.created_at DESC
LIMIT 5;
```

**Resultado esperado:** 5 atendimentos com reviews

### 3. Verificar Avaliações

**SQL de verificação:**

```sql
SELECT
  r.rating,
  r.comment,
  c.name as customer_name,
  s.name as staff_name
FROM public.reviews r
JOIN public.customers c ON c.id = r.customer_id
JOIN public.staff_users s ON s.id = r.staff_id
ORDER BY r.created_at DESC;
```

**Resultado esperado:** 5 avaliações com notas 4 e 5

---

## 🧪 Testar na Aplicação

### Teste 1: Dashboard Admin - Visualizar Avaliações

1. Acesse: `http://localhost:3001/admin/dashboard`
2. Login: `admin@bedeschi.com` / `teste123`
3. Vá para aba **Dashboard**
4. **Verificar:**
   - ✅ Seção "Mais Bem Avaliados" mostra profissionais
   - ✅ Seção "Piores Avaliações" (deve estar vazia ou com notas 4)
   - ✅ Gráficos mostram dados reais

### Teste 2: Cadastrar Prestador (Profissional)

1. Aba **Equipe** → Botão **Novo Usuário**
2. Preencha:
   - Nome: `Mariana Rodrigues`
   - Papel: **Profissional**
   - Especialidade: **Massagem e Estética Corporal**
   - Email: (deixar vazio ou preencher - será gerado automaticamente)
   - Telefone: `11999887766` (opcional)
   - **Senha:** NÃO é exigida para profissionais
3. Clique **Cadastrar**
4. **Verificar:**
   - ✅ Mensagem: "Prestador(a) cadastrado(a) com sucesso!"
   - ✅ Aparece na lista de usuários
   - ✅ Email gerado: `mariana.rodrigues@prestador.bedeschi.local`

### Teste 3: Cadastrar Recepcionista

1. Aba **Equipe** → Botão **Novo Usuário**
2. Preencha:
   - Nome: `Sofia Almeida`
   - Papel: **Recepção**
   - Especialidade: (deixar vazio ou selecionar qualquer)
   - Email: `sofia.almeida@bedeschi.com` **OBRIGATÓRIO**
   - Senha: `sofia123` **OBRIGATÓRIO**
3. Clique **Cadastrar**
4. **Verificar:**
   - ✅ Mensagem: "Recepcionista cadastrado(a) com sucesso!"
   - ✅ Pode fazer login em `/staff/login`

### Teste 4: Recepção - Novo Atendimento

1. Login recepção: `julia.atendente@bedeschi.com` / `teste123`
2. Aba **Novo Atendimento**
3. Dropdown **Profissional**
4. **Verificar:**
   - ✅ Mariana Rodrigues aparece na lista
   - ✅ Todos os profissionais cadastrados aparecem
   - ✅ Especialidades estão corretas

### Teste 5: Cliente Avaliar Profissional

1. Acesse: `http://localhost:3001/c/bedeschi`
2. Login com telefone e PIN de um dos clientes seeded
   - Ex: `11987654321` / PIN: `1234`
3. **Verificar:**
   - ✅ Cliente tem histórico de atendimentos
   - ✅ Pontos aparecem corretamente
   - ✅ Pode avaliar atendimentos pendentes

---

## 📊 Clientes de Teste Disponíveis

| Nome                 | Telefone    | PIN  | Pontos | Atendimentos |
| -------------------- | ----------- | ---- | ------ | ------------ |
| Maria Silva Santos   | 11987654321 | 1234 | 450    | 5            |
| Ana Paula Oliveira   | 11976543210 | 5678 | 320    | 4            |
| Juliana Costa Lima   | 11965432109 | 9012 | 580    | 7            |
| Carla Mendes Souza   | 11954321098 | 3456 | 210    | 3            |
| Patricia Alves Rocha | 11943210987 | 7890 | 890    | 10           |

---

## 🎯 Status Final

- ✅ Login apenas para recepcionistas
- ✅ Profissionais sem login (apenas prestadores)
- ✅ Lista de especialidades predefinida
- ✅ Script SQL com clientes e avaliações
- ✅ Build passou
- ✅ Deploy concluído

**Próximos passos:**

1. Execute o SQL no Supabase
2. Valide os dados conforme instruções acima
3. Teste o fluxo completo
4. Reporte qualquer problema encontrado

**URLs:**

- Local: [http://localhost:3001](http://localhost:3001)
- Produção: [https://bedeschi-fidelidade-app.vercel.app](https://bedeschi-fidelidade-app.vercel.app)
- Supabase: [https://supabase.com/dashboard/project/lvqcualqeevdenghexjm](https://supabase.com/dashboard/project/lvqcualqeevdenghexjm)
