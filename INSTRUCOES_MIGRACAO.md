# 📋 INSTRUÇÕES PARA EXECUTAR MIGRAÇÃO DE PONTOS

## ⚠️ O comando `npx supabase db push` requer senha do banco

Como estamos usando Supabase hospedado (não local), execute a migração diretamente no **SQL Editor do Dashboard**.

---

## 🔧 PASSO A PASSO

### 1. Acesse o SQL Editor do Supabase

Abra no navegador:

```
https://supabase.com/dashboard/project/lvqcualqeevdenghexjm/sql/new
```

### 2. Cole o SQL da Migração

Copie **TODO** o conteúdo do arquivo:

```
supabase/migrations/012_points_expiration_1_year.sql
```

### 3. Execute a Migração

- Clique no botão **"Run"** (ou pressione `Ctrl+Enter`)
- Aguarde a mensagem de sucesso

### 4. Verifique a Execução

Você deve ver a mensagem:

```
Migração 012 - Sistema de validade de pontos (1 ano) implementado!
```

---

## ✅ O QUE A MIGRAÇÃO FAZ

1. **Altera validade padrão das regras** de 30 para 365 dias
2. **Adiciona coluna `points_expires_at`** na tabela `fidelity_clients`
3. **Cria tabela `fidelity_points_history`** para rastrear movimentações
4. **Cria função `expire_old_points()`** para expirar pontos automaticamente
5. **Cria trigger** que renova a validade quando cliente ganha pontos

---

## 🔍 VALIDAÇÃO PÓS-MIGRAÇÃO

Execute no SQL Editor para confirmar:

```sql
-- Verificar se a coluna foi criada
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'fidelity_clients' 
AND column_name = 'points_expires_at';

-- Verificar se a tabela de histórico foi criada
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'fidelity_points_history';

-- Verificar se a função foi criada
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'expire_old_points';
```

---

## 📞 SUPORTE

Se houver algum erro durante a execução:
1. Copie a mensagem de erro completa
2. Verifique se você está no projeto correto: `lvqcualqeevdenghexjm`
3. Certifique-se de ter permissões de admin no projeto
