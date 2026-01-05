# ✅ Checklist de QA - Gestão de Equipe

## Status Atual
- ✅ Tabela `staff_users` criada no Supabase
- ✅ 5 usuários de teste cadastrados (1 admin, 1 médico, 2 profissionais, 1 recepção)
- ✅ Integração testada via script Node.js
- ⏳ Dados completos de teste (clientes, agendamentos, avaliações)

---

## 📋 Testes a Realizar

### 1. Login e Acesso
- [ ] Login com `admin@bedeschi.com` / `teste123`
- [ ] Login com `dra.amanda@bedeschi.com` / `teste123`
- [ ] Login com `carla.santos@bedeschi.com` / `teste123`
- [ ] Login com `julia.atendente@bedeschi.com` / `teste123`
- [ ] Verificar redirecionamento correto após login

### 2. Tela de Equipe - Visualização
- [ ] Contadores exibem valores corretos:
  - Total: 5
  - Médicos: 1
  - Profissionais: 2
  - Recepção/Admin: 2
- [ ] Lista de "Usuários do Sistema" exibe todos os 5 usuários
- [ ] Informações corretas: nome, email, função, data de cadastro
- [ ] Status "Ativo" aparece para todos

### 3. Cadastro de Novo Profissional
- [ ] Clicar em "Novo Usuário"
- [ ] Preencher formulário:
  - Nome: "Patricia Alves"
  - Email: "patricia.alves@bedeschi.com"
  - Senha: "teste123"
  - Papel: Profissional
  - Especialidade: "Tratamento Corporal"
- [ ] Salvar e verificar:
  - [ ] Mensagem de sucesso
  - [ ] Usuário aparece na lista
  - [ ] Contadores atualizaram (Total: 6, Profissionais: 3)
  - [ ] Possível fazer login com novas credenciais

### 4. Dashboard com Dados
- [ ] Acessar aba "Dashboard"
- [ ] Verificar cards de resumo:
  - [ ] Receita Total
  - [ ] Agendamentos
  - [ ] Clientes Ativos
  - [ ] Taxa de Ocupação
- [ ] Verificar gráficos:
  - [ ] Receita Mensal
  - [ ] Performance de Profissionais
  - [ ] Distribuição de Serviços

### 5. Validação de Segurança
- [ ] Tentar cadastrar usuário sem email → deve dar erro
- [ ] Tentar cadastrar usuário sem senha → deve dar erro
- [ ] Tentar cadastrar email duplicado → deve dar erro
- [ ] Verificar hash de senha no Supabase (não deve estar em texto plano)

### 6. Integração Cross-App
- [ ] Dados de profissionais aparecem em:
  - [ ] Sistema de agendamentos
  - [ ] Avaliações de clientes
  - [ ] Relatórios de performance

---

## 🐛 Bugs Encontrados
_Documentar aqui qualquer problema encontrado durante os testes_

| Bug | Severidade | Status | Descrição |
|-----|-----------|--------|-----------|
| - | - | - | Nenhum bug reportado ainda |

---

## 📊 Resultado dos Testes

### Resumo
- **Total de Testes**: 0/26
- **Passou**: 0
- **Falhou**: 0
- **Não Testado**: 26

### Conclusão
_A preencher após execução dos testes_
