# 🚨 AÇÃO NECESSÁRIA: Criar Tabelas no Supabase

## ⚠️ Problema Identificado

As tabelas `customers`, `appointments`, `reviews` e `rewards` **NÃO EXISTEM** no Supabase.

## ✅ Solução: Execute o SQL Agora

### Passo 1: Acessar Supabase

1. Acesse: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione o projeto: **Bedeschi Fidelidade**
3. URL: `lvqcualqeevdenghexjm.supabase.co`

### Passo 2: Abrir SQL Editor

1. Menu lateral → **SQL Editor**
2. Clique em **New Query**

### Passo 3: Executar o Script

1. Abra o arquivo: `supabase/migrations/create_all_tables.sql`
2. Copie **TODO** o conteúdo (Ctrl+A, Ctrl+C)
3. Cole no SQL Editor do Supabase
4. Clique em **RUN** (botão verde)

### Passo 4: Verificar Sucesso

Você deve ver:
```
status
Tabelas criadas com sucesso!
```

### Passo 5: Verificar Tabelas Criadas

Execute no SQL Editor:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

**Deve mostrar:**
- ✅ appointments
- ✅ customers
- ✅ reviews
- ✅ rewards
- ✅ services
- ✅ staff_users

---

## 🔄 Depois de Executar o SQL

Execute o teste QA novamente:

```bash
node scripts/test-fluxo-completo.js
```

Se tudo estiver correto, verá:
```
✅ TODOS OS TESTES PASSARAM!
🎉 Sistema 100% funcional e sincronizado!
```

---

## 📋 Tabelas Criadas

### 1. `customers` - Clientes
- ID, nome, telefone, email, PIN
- Pontos, gastos, número de atendimentos
- Índices otimizados

### 2. `appointments` - Atendimentos
- Cliente, profissional, data, horário
- Serviços (JSON), total, pontos
- Status de avaliação
- Vinculado a `customers` e `staff_users`

### 3. `reviews` - Avaliações
- Cliente, atendimento, profissional
- Nota (1-5), comentário
- Constraint: um cliente avalia um atendimento apenas uma vez

### 4. `rewards` - Recompensas
- Cliente, tipo, valor
- Status (disponível/resgatado/expirado)
- Data de expiração

---

## 🚀 Após Criar as Tabelas

O teste QA vai:
1. ✅ Verificar profissionais cadastrados
2. ✅ Criar cliente de teste (Telefone: 11999888777, PIN: 9999)
3. ✅ Criar atendimento (R$ 350,00, 350 pontos)
4. ✅ Criar avaliação (5 estrelas)
5. ✅ Verificar sincronização de todos os dados
6. ✅ Validar estatísticas do profissional

**Execute o SQL agora e depois rode o teste!**
