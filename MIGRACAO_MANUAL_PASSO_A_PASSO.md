# 📋 MIGRAÇÃO MANUAL - PASSO A PASSO

## ⚠️ Problema
A execução automática via CLI/Python não funciona devido a restrições de firewall/rede no Supabase hospedado.

## ✅ Solução: Executar Manualmente no SQL Editor

### 🔧 PASSO 1: Acesse o SQL Editor do Supabase

Abra este link no navegador:

```
https://supabase.com/dashboard/project/lvqcualqeevdenghexjm/sql/new
```

---

### 📋 PASSO 2: Copie o SQL da Migração

Abra o arquivo:

```
EXECUTAR_MIGRACAO_AQUI.sql
```

Copie **TODO** o conteúdo do arquivo.

---

### 🖥️ PASSO 3: Cole no SQL Editor

1. Clique na aba "SQL Editor" do Supabase Dashboard
2. Clique em "New Query"
3. Cole todo o conteúdo do arquivo `EXECUTAR_MIGRACAO_AQUI.sql`

---

### ▶️ PASSO 4: Execute a Migração

1. Clique no botão **"Run"** (ou pressione `Ctrl+Enter`)
2. Aguarde a execução (pode levar alguns segundos)

---

### ✨ PASSO 5: Confirme o Sucesso

Você deve ver a mensagem no final:

```
Migração 012 - Sistema de validade de pontos (1 ano) implementado!
```

---

## 🎯 O que Será Criado

Após a execução, o banco terá:

- ✅ **Validade padrão de regras**: 365 dias (1 ano)
- ✅ **Coluna `points_expires_at`**: Data de expiração dos pontos
- ✅ **Tabela `fidelity_points_history`**: Histórico de movimentações
- ✅ **Função `expire_old_points()`**: Expira pontos automaticamente
- ✅ **Função `renew_points_expiration()`**: Renova validade ao ganhar pontos
- ✅ **Trigger `renew_points_on_update`**: Ativa a renovação automaticamente
- ✅ **Políticas RLS**: Segurança configurada

---

## 🔍 Validação Pós-Migração

Para confirmar que tudo funcionou, execute este SQL no SQL Editor:

```sql
-- Verificar coluna points_expires_at
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'fidelity_clients' 
AND column_name = 'points_expires_at';

-- Verificar tabela de histórico
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'fidelity_points_history';

-- Verificar função de expiração
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'expire_old_points';
```

Se todos os 3 retornarem resultados, a migração foi bem-sucedida! ✅

---

## 📞 Suporte

Se houver erro durante a execução:

1. Copie a mensagem de erro completa
2. Verifique se você está no projeto correto: `lvqcualqeevdenghexjm`
3. Certifique-se de ter permissões de admin no projeto
4. Tente executar novamente

---

## 🎉 Próximos Passos

Após a migração:

1. ✅ Todas as funcionalidades implementadas estarão operacionais
2. ✅ Pontos expirarão automaticamente após 1 ano
3. ✅ Relatório de gestão de pontos funcionará
4. ✅ Sistema de validação de importação estará ativo
