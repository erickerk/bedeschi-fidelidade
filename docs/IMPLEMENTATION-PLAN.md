# Plano de Implementação - Bedeschi Fidelidade

## Visão Geral

**Duração Total Estimada:** 6-8 semanas  
**Metodologia:** Sprints de 2 semanas  
**Equipe Mínima:** 1 Full-stack Dev + 1 Designer (part-time)

---

## Sprint 0 - Setup (3-5 dias)

### Objetivos

- Configurar ambiente de desenvolvimento
- Criar projeto base
- Configurar Supabase

### Tarefas

| Tarefa                               | Responsável | Tempo | Status |
| ------------------------------------ | ----------- | ----- | ------ |
| Criar projeto Next.js 14             | Dev         | 1h    | ⬜     |
| Configurar TypeScript strict         | Dev         | 30min | ⬜     |
| Instalar e configurar TailwindCSS    | Dev         | 1h    | ⬜     |
| Configurar shadcn/ui                 | Dev         | 1h    | ⬜     |
| Criar projeto Supabase               | Dev         | 30min | ⬜     |
| Configurar variáveis de ambiente     | Dev         | 30min | ⬜     |
| Criar estrutura de pastas            | Dev         | 1h    | ⬜     |
| Configurar ESLint + Prettier         | Dev         | 30min | ⬜     |
| Configurar Husky (pre-commit)        | Dev         | 30min | ⬜     |
| Deploy inicial Vercel                | Dev         | 1h    | ⬜     |
| Criar design tokens no Tailwind      | Dev/Design  | 2h    | ⬜     |
| Configurar fontes (Playfair + Inter) | Dev         | 30min | ⬜     |

### Entregáveis

- Repo Git configurado
- Projeto rodando em localhost
- Preview deploy no Vercel
- Supabase projeto criado

---

## Sprint 1 - Fundação (2 semanas)

### Objetivos

- Criar modelo de dados
- Implementar autenticação
- Criar componentes base UI
- Fluxo básico do cliente

### Semana 1

| Tarefa                         | Prioridade | Tempo Est. | Status |
| ------------------------------ | ---------- | ---------- | ------ |
| **Banco de Dados**             |            |            |        |
| Criar migration: tenants       | P0         | 1h         | ⬜     |
| Criar migration: users         | P0         | 1h         | ⬜     |
| Criar migration: clients       | P0         | 1h         | ⬜     |
| Criar migration: categories    | P0         | 1h         | ⬜     |
| Criar migration: services      | P0         | 1h         | ⬜     |
| Configurar RLS básico          | P0         | 2h         | ⬜     |
| Seed de dados inicial          | P1         | 2h         | ⬜     |
| **Componentes UI**             |            |            |        |
| Button (todas variantes)       | P0         | 2h         | ⬜     |
| Input (text, phone, search)    | P0         | 2h         | ⬜     |
| Card (normal, premium, reward) | P0         | 3h         | ⬜     |
| Logo component                 | P0         | 1h         | ⬜     |
| Header (client, staff)         | P0         | 2h         | ⬜     |
| Loading states                 | P1         | 1h         | ⬜     |

### Semana 2

| Tarefa                        | Prioridade | Tempo Est. | Status |
| ----------------------------- | ---------- | ---------- | ------ |
| **Autenticação**              |            |            |        |
| Supabase Auth config          | P0         | 2h         | ⬜     |
| Login page (staff)            | P0         | 3h         | ⬜     |
| Middleware de auth            | P0         | 2h         | ⬜     |
| Context de usuário            | P0         | 2h         | ⬜     |
| **Cliente - QR Code**         |            |            |        |
| Página de entrada /c/[tenant] | P0         | 3h         | ⬜     |
| Input de celular com máscara  | P0         | 2h         | ⬜     |
| API: buscar cliente por phone | P0         | 2h         | ⬜     |
| Integração OTP (mock inicial) | P1         | 2h         | ⬜     |
| Página de verificação OTP     | P1         | 3h         | ⬜     |

### Entregáveis Sprint 1

- [ ] Banco de dados com tabelas principais
- [ ] Login de staff funcionando
- [ ] Cliente consegue acessar via QR e digitar celular
- [ ] Componentes UI base prontos
- [ ] Design system aplicado

### Testes

- [ ] Login/logout staff
- [ ] Validação de celular
- [ ] RLS isolando dados por tenant
- [ ] Responsividade mobile

---

## Sprint 2 - Core Features (2 semanas)

### Objetivos

- Tela principal do cliente
- Cadastro e busca de clientes (atendente)
- Lançamento de atendimentos
- Importação de serviços XLSX

### Semana 3

| Tarefa                     | Prioridade | Tempo Est. | Status |
| -------------------------- | ---------- | ---------- | ------ |
| **Cliente - Dashboard**    |            |            |        |
| Tela principal do cliente  | P0         | 4h         | ⬜     |
| Card de pontos (animado)   | P0         | 3h         | ⬜     |
| Progresso por categoria    | P0         | 3h         | ⬜     |
| Lista de recompensas       | P0         | 2h         | ⬜     |
| **Atendente - Clientes**   |            |            |        |
| Busca de cliente           | P0         | 3h         | ⬜     |
| Cadastro rápido de cliente | P0         | 4h         | ⬜     |
| Ficha do cliente           | P0         | 3h         | ⬜     |
| Edição de cliente          | P1         | 2h         | ⬜     |
| Histórico do cliente       | P1         | 3h         | ⬜     |

### Semana 4

| Tarefa                         | Prioridade | Tempo Est. | Status |
| ------------------------------ | ---------- | ---------- | ------ |
| **Banco de Dados**             |            |            |        |
| Migration: appointments        | P0         | 1h         | ⬜     |
| Migration: appointment_items   | P0         | 1h         | ⬜     |
| Migration: points_transactions | P0         | 1h         | ⬜     |
| **Atendente - Atendimentos**   |            |            |        |
| Tela de novo atendimento       | P0         | 6h         | ⬜     |
| Busca/seleção de serviços      | P0         | 3h         | ⬜     |
| Cálculo de totais              | P0         | 2h         | ⬜     |
| API: criar atendimento         | P0         | 4h         | ⬜     |
| **Admin - Serviços**           |            |            |        |
| Upload XLSX                    | P0         | 3h         | ⬜     |
| Parser da planilha             | P0         | 4h         | ⬜     |
| API: importar serviços         | P0         | 3h         | ⬜     |
| Lista de serviços              | P1         | 2h         | ⬜     |
| Edição de serviço              | P1         | 2h         | ⬜     |

### Entregáveis Sprint 2

- [ ] Cliente vê seus pontos e recompensas
- [ ] Atendente cadastra/busca clientes
- [ ] Atendente lança atendimentos
- [ ] Admin importa serviços via XLSX

### Testes

- [ ] Fluxo completo: cadastro → atendimento → pontos
- [ ] Import de planilha com 303 serviços
- [ ] Cálculo correto de pontos
- [ ] Mobile: todos os fluxos

---

## Sprint 3 - Fidelidade & Avaliações (2 semanas)

### Objetivos

- Sistema de regras de fidelidade
- Avaliações de atendimentos
- Recompensas e resgates
- Dashboard admin

### Semana 5

| Tarefa                            | Prioridade | Tempo Est. | Status |
| --------------------------------- | ---------- | ---------- | ------ |
| **Banco de Dados**                |            |            |        |
| Migration: fidelity_rules         | P0         | 1h         | ⬜     |
| Migration: rewards                | P0         | 1h         | ⬜     |
| Migration: reviews                | P0         | 1h         | ⬜     |
| Migration: audit_logs             | P1         | 1h         | ⬜     |
| **Fidelidade**                    |            |            |        |
| Motor de regras (rules engine)    | P0         | 6h         | ⬜     |
| Cálculo de elegibilidade          | P0         | 4h         | ⬜     |
| Geração automática de recompensas | P0         | 3h         | ⬜     |
| **Admin - Regras**                |            |            |        |
| CRUD de regras                    | P0         | 6h         | ⬜     |
| UI de configuração de regra       | P0         | 4h         | ⬜     |
| Preview de regra                  | P1         | 2h         | ⬜     |

### Semana 6

| Tarefa                         | Prioridade | Tempo Est. | Status |
| ------------------------------ | ---------- | ---------- | ------ |
| **Avaliações**                 |            |            |        |
| Componente Rating (estrelas)   | P0         | 3h         | ⬜     |
| Tela de avaliação (cliente)    | P0         | 4h         | ⬜     |
| API: criar avaliação           | P0         | 2h         | ⬜     |
| Detecção de avaliação pendente | P0         | 2h         | ⬜     |
| Skip/lembrar depois            | P1         | 2h         | ⬜     |
| **Recompensas**                |            |            |        |
| Tela de resgate (atendente)    | P0         | 4h         | ⬜     |
| API: resgatar recompensa       | P0         | 3h         | ⬜     |
| Histórico de resgates          | P1         | 2h         | ⬜     |
| **Admin - Dashboard**          |            |            |        |
| Dashboard KPIs                 | P0         | 6h         | ⬜     |
| Gráficos básicos               | P1         | 4h         | ⬜     |
| Filtros de período             | P1         | 2h         | ⬜     |

### Entregáveis Sprint 3

- [ ] Regras de fidelidade configuráveis
- [ ] Recompensas geradas automaticamente
- [ ] Cliente avalia atendimentos
- [ ] Dashboard admin com KPIs

### Testes

- [ ] Regra: R$ 1.000 em Massagem → 1 grátis
- [ ] Regra: 10 sessões → 1 grátis
- [ ] Avaliação aparece para cliente
- [ ] Resgate de recompensa funciona
- [ ] KPIs calculam corretamente

---

## Sprint 4 - Polimento & QA (1-2 semanas)

### Objetivos

- Integrar OTP real (WhatsApp)
- Ajustes de UX
- Testes E2E
- Performance

### Tarefas

| Tarefa                        | Prioridade | Tempo Est. | Status |
| ----------------------------- | ---------- | ---------- | ------ |
| **Integrações**               |            |            |        |
| Integrar Twilio/Evolution API | P0         | 6h         | ⬜     |
| Envio real de OTP             | P0         | 4h         | ⬜     |
| Fallback SMS                  | P1         | 2h         | ⬜     |
| **UX Polish**                 |            |            |        |
| Animações de transição        | P1         | 4h         | ⬜     |
| Loading skeletons             | P1         | 2h         | ⬜     |
| Empty states                  | P1         | 2h         | ⬜     |
| Error handling visual         | P0         | 3h         | ⬜     |
| Toast notifications           | P0         | 2h         | ⬜     |
| **Performance**               |            |            |        |
| Otimizar bundle               | P1         | 2h         | ⬜     |
| Lazy loading                  | P1         | 2h         | ⬜     |
| Image optimization            | P1         | 1h         | ⬜     |
| **Testes**                    |            |            |        |
| Testes unitários (críticos)   | P0         | 6h         | ⬜     |
| Testes E2E (Playwright)       | P0         | 8h         | ⬜     |
| Testes de carga               | P2         | 4h         | ⬜     |
| **Documentação**              |            |            |        |
| README completo               | P0         | 2h         | ⬜     |
| Manual do usuário             | P1         | 4h         | ⬜     |
| Vídeo tutorial (atendente)    | P2         | 4h         | ⬜     |

### Entregáveis Sprint 4

- [ ] OTP via WhatsApp funcionando
- [ ] UX polida com animações
- [ ] Testes passando
- [ ] Documentação completa

---

## Checklist de Testes

### Fluxo Cliente

| Teste   | Cenário                                  | Status |
| ------- | ---------------------------------------- | ------ |
| QR-01   | Cliente escaneia QR e vê tela de entrada | ⬜     |
| QR-02   | Cliente digita celular válido            | ⬜     |
| QR-03   | Cliente digita celular não cadastrado    | ⬜     |
| OTP-01  | OTP enviado com sucesso                  | ⬜     |
| OTP-02  | OTP código correto                       | ⬜     |
| OTP-03  | OTP código errado (3x = bloqueio)        | ⬜     |
| OTP-04  | OTP expirado                             | ⬜     |
| DASH-01 | Cliente vê saldo de pontos               | ⬜     |
| DASH-02 | Cliente vê progresso por categoria       | ⬜     |
| DASH-03 | Cliente vê recompensas disponíveis       | ⬜     |
| REV-01  | Cliente com avaliação pendente vê modal  | ⬜     |
| REV-02  | Cliente avalia com 5 estrelas            | ⬜     |
| REV-03  | Cliente pula avaliação                   | ⬜     |
| REV-04  | Cliente acessa novamente e vê lembrete   | ⬜     |
| HIST-01 | Cliente vê histórico de atendimentos     | ⬜     |

### Fluxo Atendente

| Teste   | Cenário                                  | Status |
| ------- | ---------------------------------------- | ------ |
| AUTH-01 | Login com email/senha válidos            | ⬜     |
| AUTH-02 | Login com credenciais inválidas          | ⬜     |
| AUTH-03 | Logout                                   | ⬜     |
| CLI-01  | Busca cliente por telefone               | ⬜     |
| CLI-02  | Busca cliente por nome                   | ⬜     |
| CLI-03  | Cadastra novo cliente (mínimo)           | ⬜     |
| CLI-04  | Cadastra cliente completo                | ⬜     |
| CLI-05  | Cliente duplicado (mesmo telefone)       | ⬜     |
| ATD-01  | Lança atendimento com 1 serviço          | ⬜     |
| ATD-02  | Lança atendimento com múltiplos serviços | ⬜     |
| ATD-03  | Ajusta valor do serviço                  | ⬜     |
| ATD-04  | Aplica desconto                          | ⬜     |
| ATD-05  | Verifica pontos gerados                  | ⬜     |
| RES-01  | Resgata recompensa disponível            | ⬜     |
| RES-02  | Tenta resgatar recompensa expirada       | ⬜     |

### Fluxo Admin

| Teste  | Cenário                          | Status |
| ------ | -------------------------------- | ------ |
| SRV-01 | Importa planilha XLSX válida     | ⬜     |
| SRV-02 | Importa planilha com erros       | ⬜     |
| SRV-03 | Atualiza serviço existente       | ⬜     |
| SRV-04 | Desativa serviço                 | ⬜     |
| RUL-01 | Cria regra VALUE_ACCUMULATION    | ⬜     |
| RUL-02 | Cria regra QUANTITY_ACCUMULATION | ⬜     |
| RUL-03 | Edita regra existente            | ⬜     |
| RUL-04 | Desativa regra                   | ⬜     |
| RPT-01 | Dashboard mostra KPIs corretos   | ⬜     |
| RPT-02 | Filtra por período               | ⬜     |
| RPT-03 | Exporta CSV                      | ⬜     |

### Edge Cases

| Teste   | Cenário                           | Status |
| ------- | --------------------------------- | ------ |
| EDGE-01 | Recompensa expira automaticamente | ⬜     |
| EDGE-02 | Pontos expiram após 365 dias      | ⬜     |
| EDGE-03 | Atendimento com valor zero        | ⬜     |
| EDGE-04 | Cliente sem atendimentos          | ⬜     |
| EDGE-05 | Múltiplas recompensas simultâneas | ⬜     |
| EDGE-06 | Rate limiting OTP                 | ⬜     |
| EDGE-07 | Sessão expirada                   | ⬜     |
| EDGE-08 | Conexão lenta (3G)                | ⬜     |
| EDGE-09 | Offline mode (PWA)                | ⬜     |

---

## Modo Operação - Dia a Dia

### Atendente - Passo a Passo

**1. Início do Expediente**

```
1. Abra o sistema no tablet/computador
2. Faça login com seu email e senha
3. Verifique notificações (se houver)
```

**2. Cliente Chega**

```
1. Pergunte: "Já faz parte do nosso programa de fidelidade?"

SE SIM:
  2. Busque pelo nome ou celular
  3. Confirme: "Maria Silva, correto?"
  4. Veja os pontos e recompensas disponíveis

SE NÃO:
  2. Clique em "Novo Cliente"
  3. Peça nome e celular (mínimo)
  4. Se quiser, complete com email e data de nascimento
  5. Marque o consentimento LGPD
  6. Salve
```

**3. Após o Atendimento**

```
1. Abra a ficha do cliente
2. Clique em "Novo Atendimento"
3. Busque e adicione os serviços realizados
4. Ajuste valores se necessário (ex: desconto)
5. Confira o total
6. Selecione forma de pagamento
7. Adicione observações se relevante
8. Clique em "Salvar Atendimento"
9. Sistema mostra:
   - Pontos ganhos
   - Se conquistou alguma recompensa
10. Avise a cliente!
```

**4. Cliente Quer Resgatar Recompensa**

```
1. Abra a ficha do cliente
2. Veja as recompensas disponíveis
3. Clique em "Resgatar"
4. Confirme a recompensa
5. Sistema vincula ao atendimento atual
6. Recompensa marcada como "Resgatada"
```

**5. Cliente Quer Ver Pontos (QR Code)**

```
1. Aponte para o QR Code na recepção
2. Cliente escaneia com o celular
3. Digita o número do celular
4. Recebe código no WhatsApp (se configurado)
5. Vê os pontos e recompensas
6. Se tiver avaliação pendente, pode avaliar
```

### Admin - Configurações

**Configurar Regra de Fidelidade**

```
1. Acesse Admin > Regras de Fidelidade
2. Clique em "Nova Regra"
3. Escolha o tipo:
   - Por valor (ex: R$ 1.000 em categoria X)
   - Por quantidade (ex: 10 sessões do serviço Y)
4. Configure o gatilho (categoria/serviço, valor/quantidade)
5. Configure a recompensa:
   - Serviço grátis
   - Desconto fixo ou %
   - Crédito
6. Defina validade da recompensa
7. Ative a regra
8. Salve
```

**Importar Serviços**

```
1. Prepare a planilha XLSX com colunas:
   - Código, Descrição, Categoria, Valor, Tempo, CNAE
2. Acesse Admin > Serviços > Importar
3. Arraste o arquivo ou clique para selecionar
4. Sistema processa e mostra preview
5. Verifique erros (se houver)
6. Confirme importação
7. Serviços aparecem na lista
```

---

## Dependências de Pacotes

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "typescript": "^5.0.0",
    "@supabase/supabase-js": "^2.38.0",
    "@supabase/ssr": "^0.1.0",
    "tailwindcss": "^3.4.0",
    "@radix-ui/react-*": "latest",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    "framer-motion": "^10.16.0",
    "react-hook-form": "^7.48.0",
    "zod": "^3.22.0",
    "@hookform/resolvers": "^3.3.0",
    "@tanstack/react-query": "^5.0.0",
    "date-fns": "^2.30.0",
    "xlsx": "^0.18.5",
    "qrcode.react": "^3.1.0",
    "react-hot-toast": "^2.4.0",
    "lucide-react": "^0.294.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0",
    "@playwright/test": "^1.40.0"
  }
}
```

---

## Cronograma Visual

```
Semana │ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │ 7 │ 8 │
───────┼───┼───┼───┼───┼───┼───┼───┼───┤
Setup  │███│   │   │   │   │   │   │   │
Sprint1│   │███│███│   │   │   │   │   │
Sprint2│   │   │   │███│███│   │   │   │
Sprint3│   │   │   │   │   │███│███│   │
Sprint4│   │   │   │   │   │   │   │███│
Launch │   │   │   │   │   │   │   │ ✓ │
```

---

_Plano ajustável conforme feedback e descobertas durante desenvolvimento_
