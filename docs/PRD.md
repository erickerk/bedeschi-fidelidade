# PRD - Sistema de Fidelidade Instituto Bedeschi

## 📋 Visão Geral

**Produto:** Bedeschi Fidelidade  
**Versão:** 1.0 MVP  
**Data:** Janeiro 2026  
**Stakeholder:** Instituto Bedeschi Beauty Clinic

---

## 1. Objetivo do Produto

Criar um sistema SaaS de fidelidade **mobile-first** para clínicas de estética, permitindo:

- Automação do programa de fidelidade (hoje manual)
- Acesso simples do cliente via QR Code
- Gestão completa de atendimentos e recompensas
- Coleta de avaliações dos serviços

### 1.1 Problema a Resolver

| Problema Atual                         | Solução Proposta                               |
| -------------------------------------- | ---------------------------------------------- |
| Controle manual de pontos em planilhas | Sistema automatizado com cálculo em tempo real |
| Cliente não sabe saldo de pontos       | Acesso instantâneo via QR Code                 |
| Sem feedback dos serviços              | Sistema de avaliação integrado                 |
| Regras de fidelidade confusas          | Configuração clara e transparente              |

---

## 2. Escopo

### 2.1 MVP (Fase 1-3)

- ✅ Cadastro de clientes
- ✅ Acesso cliente via QR Code + celular
- ✅ Sistema de pontuação configurável
- ✅ Avaliação de atendimentos
- ✅ Painel atendente (lançar atendimentos)
- ✅ Painel admin (configurações + relatórios básicos)
- ✅ Importação de serviços via XLSX
- ✅ Multi-tenant preparado

### 2.2 Pós-MVP (Futuro)

- ⏳ Notificações WhatsApp/SMS automáticas
- ⏳ Agendamento integrado
- ⏳ App nativo (PWA inicialmente)
- ⏳ Integração com sistemas de pagamento
- ⏳ Programa de indicação
- ⏳ Gamificação (níveis, badges)
- ⏳ BI avançado

---

## 3. Personas

### 3.1 Cliente - "Maria" (Persona Principal)

- **Idade:** 35-55 anos
- **Perfil:** Pouca familiaridade com tecnologia
- **Objetivo:** Ver pontos e recompensas rapidamente
- **Frustração:** Apps complicados, muitas senhas
- **Necessidade:** Fluxo ultra-simples, botões grandes

### 3.2 Atendente - "Julia"

- **Idade:** 22-35 anos
- **Perfil:** Usa celular diariamente, familiarizada com sistemas
- **Objetivo:** Registrar atendimentos rapidamente entre clientes
- **Frustração:** Sistemas lentos, muitos cliques
- **Necessidade:** Interface rápida, atalhos

### 3.3 Administrador - "Dr. Bedeschi"

- **Idade:** 40-60 anos
- **Perfil:** Empresário, quer visão macro
- **Objetivo:** Entender performance da clínica e do programa
- **Frustração:** Relatórios confusos, dados desatualizados
- **Necessidade:** Dashboard claro, exportação de dados

---

## 4. User Stories

### 4.1 Cliente

| ID  | User Story                                             | Critério de Aceite                               | Prioridade |
| --- | ------------------------------------------------------ | ------------------------------------------------ | ---------- |
| C01 | Como cliente, quero escanear QR Code e ver meus pontos | Abre página, digito celular, vejo saldo em <5s   | P0         |
| C02 | Como cliente, quero ver minhas recompensas disponíveis | Lista de recompensas com prazo de validade       | P0         |
| C03 | Como cliente, quero avaliar meu último atendimento     | Modal de avaliação aparece se houver pendente    | P0         |
| C04 | Como cliente, quero ver histórico de atendimentos      | Lista com data, serviço, valor, pontos ganhos    | P1         |
| C05 | Como cliente, quero pular avaliação e fazer depois     | Botão "Avaliar depois", lembra no próximo acesso | P1         |

### 4.2 Atendente

| ID  | User Story                                            | Critério de Aceite                         | Prioridade |
| --- | ----------------------------------------------------- | ------------------------------------------ | ---------- |
| A01 | Como atendente, quero buscar cliente por celular/nome | Busca retorna em <1s                       | P0         |
| A02 | Como atendente, quero cadastrar cliente rapidamente   | Formulário com nome + celular (mínimo)     | P0         |
| A03 | Como atendente, quero lançar atendimento              | Selecionar serviços, ajustar valor, salvar | P0         |
| A04 | Como atendente, quero ver pontos do cliente           | Exibir saldo atual e recompensas           | P0         |
| A05 | Como atendente, quero registrar resgate de recompensa | Selecionar recompensa, confirmar resgate   | P0         |
| A06 | Como atendente, quero ver avaliações recebidas        | Filtro por período, serviço, nota          | P1         |

### 4.3 Administrador

| ID  | User Story                                   | Critério de Aceite                          | Prioridade |
| --- | -------------------------------------------- | ------------------------------------------- | ---------- |
| D01 | Como admin, quero importar serviços via XLSX | Upload processa e cadastra/atualiza         | P0         |
| D02 | Como admin, quero criar regras de fidelidade | Interface para configurar acúmulo e resgate | P0         |
| D03 | Como admin, quero ver dashboard de KPIs      | Clientes ativos, pontos, faturamento        | P0         |
| D04 | Como admin, quero gerenciar atendentes       | CRUD de usuários com permissões             | P1         |
| D05 | Como admin, quero ajustar pontos manualmente | Ajuste com motivo obrigatório (auditoria)   | P1         |
| D06 | Como admin, quero exportar relatórios CSV    | Botão de export em cada relatório           | P2         |

---

## 5. Fluxos Principais

### 5.1 Fluxo Cliente - Acesso QR Code

```
┌─────────────────────────────────────────────────────────────┐
│  CLIENTE ESCANEIA QR CODE NA RECEPÇÃO                       │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  TELA DE ENTRADA                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [Logo Instituto Bedeschi]                          │   │
│  │                                                     │   │
│  │  "Bem-vinda ao Programa de Fidelidade"             │   │
│  │                                                     │   │
│  │  Digite seu celular:                               │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │  (11) 99999-9999                            │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  │                                                     │   │
│  │  [    ACESSAR MEUS PONTOS    ] (botão grande)      │   │
│  │                                                     │   │
│  │  Primeira vez? Fale com nossa atendente            │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  VERIFICAÇÃO (se configurado)                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Enviamos um código para seu WhatsApp              │   │
│  │                                                     │   │
│  │  Digite o código:                                  │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │  [ _ ] [ _ ] [ _ ] [ _ ]                    │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  │                                                     │   │
│  │  [    VERIFICAR    ]                               │   │
│  │                                                     │   │
│  │  Não recebeu? [Reenviar] ou [Ligar para clínica]  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  TEM AVALIAÇÃO PENDENTE?                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  "Como foi seu último atendimento?"                │   │
│  │                                                     │   │
│  │  Massagem Relaxante - 28/12/2025                   │   │
│  │                                                     │   │
│  │  ⭐ ⭐ ⭐ ⭐ ⭐  (selecionar 1-5)                    │   │
│  │                                                     │   │
│  │  Comentário (opcional):                            │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │                                             │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  │                                                     │   │
│  │  [    ENVIAR AVALIAÇÃO    ]                        │   │
│  │                                                     │   │
│  │  [Avaliar depois]                                  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  TELA PRINCIPAL DO CLIENTE                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Olá, Maria! 👋                                    │   │
│  │                                                     │   │
│  │  ┌───────────────────────────────────────────────┐ │   │
│  │  │  SEUS PONTOS                                  │ │   │
│  │  │  ══════════════                              │ │   │
│  │  │       1.250 pts                              │ │   │
│  │  │                                              │ │   │
│  │  │  R$ 850,00 em Massagem                       │ │   │
│  │  │  ▓▓▓▓▓▓▓▓▓░░░░░ 85%                         │ │   │
│  │  │  Faltam R$ 150 para ganhar 1 massagem grátis │ │   │
│  │  └───────────────────────────────────────────────┘ │   │
│  │                                                     │   │
│  │  🎁 RECOMPENSAS DISPONÍVEIS                        │   │
│  │  ┌───────────────────────────────────────────────┐ │   │
│  │  │  ✨ 1 Limpeza de Pele GRÁTIS                 │ │   │
│  │  │     Válido até 15/01/2026                    │ │   │
│  │  │     [Falar com atendente para resgatar]      │ │   │
│  │  └───────────────────────────────────────────────┘ │   │
│  │                                                     │   │
│  │  [    VER HISTÓRICO    ]                           │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Fluxo Atendente - Lançar Atendimento

```
┌─────────────────────────────────────────────────────────────┐
│  LOGIN ATENDENTE                                            │
│  Email/Celular + Senha ou OTP                               │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  DASHBOARD ATENDENTE                                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [🔍 Buscar cliente...]                             │   │
│  │                                                     │   │
│  │  Últimos atendimentos:                             │   │
│  │  • Maria Silva - Massagem - há 2h                  │   │
│  │  • João Santos - Limpeza - há 3h                   │   │
│  │                                                     │   │
│  │  [+ NOVO CLIENTE]  [+ NOVO ATENDIMENTO]            │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────┬───────────────────────────────────────────┘
                  │ Busca cliente
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  FICHA DO CLIENTE                                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Maria Silva                                        │   │
│  │  (11) 99999-9999                                   │   │
│  │                                                     │   │
│  │  Pontos: 1.250 | Créditos: R$ 0,00                 │   │
│  │                                                     │   │
│  │  🎁 1 recompensa disponível                        │   │
│  │                                                     │   │
│  │  [LANÇAR ATENDIMENTO]  [RESGATAR RECOMPENSA]       │   │
│  │  [VER HISTÓRICO]       [EDITAR CADASTRO]           │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────┬───────────────────────────────────────────┘
                  │ Lançar atendimento
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  NOVO ATENDIMENTO                                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Cliente: Maria Silva                               │   │
│  │                                                     │   │
│  │  Serviços: [Buscar serviço...]                     │   │
│  │  ┌───────────────────────────────────────────────┐ │   │
│  │  │ ✓ Massagem Relaxante 60min    R$ 180,00      │ │   │
│  │  │   [Ajustar valor: R$ ___]                    │ │   │
│  │  │ ✓ Hidratação Facial           R$ 120,00      │ │   │
│  │  └───────────────────────────────────────────────┘ │   │
│  │                                                     │   │
│  │  Total: R$ 300,00                                  │   │
│  │                                                     │   │
│  │  Data/Hora: [02/01/2026 14:30] (default: agora)    │   │
│  │                                                     │   │
│  │  Forma de pagamento: [Pix ▼] (opcional)            │   │
│  │                                                     │   │
│  │  Observações: ________________________________     │   │
│  │                                                     │   │
│  │  [    SALVAR ATENDIMENTO    ]                      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Regras de Negócio

### 6.1 Acesso do Cliente (Trade-offs QR Code)

| Modelo            | Descrição                                   | Prós                                    | Contras                                        | Recomendação |
| ----------------- | ------------------------------------------- | --------------------------------------- | ---------------------------------------------- | ------------ |
| **QR Geral**      | QR fixo na recepção, cliente digita celular | Simples de implementar, 1 QR para todos | Precisa digitar celular sempre                 | ✅ MVP       |
| **QR Individual** | Cada cliente tem QR único                   | Acesso direto, sem digitar              | Logística de distribuição, cliente pode perder | Pós-MVP      |

**Decisão MVP:** QR Geral + Celular + OTP opcional

### 6.2 Verificação de Segurança

**Modo Padrão:**

- Cliente digita celular
- Sistema envia OTP via WhatsApp (4 dígitos)
- Válido por 5 minutos
- 3 tentativas antes de bloquear por 15min

**Modo Facilitado (configurável por clínica):**

- Cliente digita celular + últimos 4 dígitos do CPF
- Sem OTP (para clientes com dificuldade)
- Admin pode habilitar/desabilitar por cliente

### 6.3 Avaliação de Atendimentos

| Regra               | Valor                                            |
| ------------------- | ------------------------------------------------ |
| Escala de avaliação | 1 a 5 estrelas                                   |
| Comentário          | Opcional, max 500 caracteres                     |
| Prazo para avaliar  | 30 dias após atendimento                         |
| Edição              | Permitida até 24h após envio                     |
| Expiração           | Atendimento marca como "não avaliado" após prazo |
| Lembrete            | Exibe no próximo acesso se pendente              |

### 6.4 Sistema de Pontuação

**Tipos de Regras Configuráveis:**

```
TIPO 1: Acúmulo por Valor (por categoria)
─────────────────────────────────────────
Exemplo: "A cada R$ 1.000 gastos em Massagem, ganha 1 Massagem Relaxante grátis"

Configuração:
- Categoria: Massagem
- Valor acumulado necessário: R$ 1.000
- Recompensa: 1x Massagem Relaxante 60min
- Validade da recompensa: 60 dias
- Resetar contador após resgate: Sim

TIPO 2: Acúmulo por Quantidade
─────────────────────────────────────────
Exemplo: "A cada 10 sessões de Depilação, ganha 1 sessão grátis"

Configuração:
- Serviço: Depilação (qualquer)
- Quantidade necessária: 10
- Recompensa: 1x Depilação (mesmo tipo)
- Validade: 90 dias

TIPO 3: Pontos Gerais
─────────────────────────────────────────
Exemplo: "A cada R$ 1 gasto, ganha 1 ponto. 500 pontos = R$ 50 de desconto"

Configuração:
- Taxa de acúmulo: 1 ponto por R$ 1,00
- Resgate: 500 pontos = R$ 50 crédito
- Expiração de pontos: 365 dias sem movimentação
```

### 6.5 Recompensas

| Campo        | Descrição                                          |
| ------------ | -------------------------------------------------- |
| Tipo         | Serviço grátis, Desconto fixo, Desconto %, Crédito |
| Restrição    | Pode limitar a categorias/serviços específicos     |
| Validade     | Data de expiração                                  |
| Resgate      | Registrado no atendimento, com auditoria           |
| Transferível | Não (vinculada ao cliente)                         |

---

## 7. Requisitos Não-Funcionais

### 7.1 Performance

- Tempo de carregamento inicial: < 3s em 3G
- Busca de cliente: < 500ms
- Salvamento de atendimento: < 1s

### 7.2 Disponibilidade

- Uptime: 99.5%
- Backup diário automático

### 7.3 Segurança

- HTTPS obrigatório
- Dados sensíveis criptografados
- Tokens JWT com expiração
- Rate limiting em endpoints públicos
- LGPD compliance

### 7.4 LGPD

- Consentimento no cadastro
- Finalidade clara dos dados
- Direito de exclusão (soft delete + anonimização)
- Exportação de dados do cliente

### 7.5 Auditoria

Eventos registrados:

- Login/logout
- Criação/edição de cliente
- Atendimentos lançados
- Ajustes manuais de pontos (motivo obrigatório)
- Resgates de recompensa
- Alterações em configurações

### 7.6 Multi-tenant

- Isolamento de dados por tenant_id
- RLS (Row Level Security) no banco
- Subdomínio ou path por clínica
- Configurações independentes

---

## 8. Métricas de Sucesso (KPIs)

| Métrica       | Meta MVP                                   | Como Medir                          |
| ------------- | ------------------------------------------ | ----------------------------------- |
| Adoção        | 70% dos clientes ativos acessam em 3 meses | Unique users / clientes cadastrados |
| Engajamento   | 50% avaliam atendimentos                   | Avaliações / atendimentos           |
| Retenção      | +15% de retorno de clientes                | Comparar com período anterior       |
| NPS implícito | Média ≥ 4.0 estrelas                       | Média das avaliações                |

---

## 9. Riscos e Mitigações

| Risco                         | Probabilidade | Impacto | Mitigação                                       |
| ----------------------------- | ------------- | ------- | ----------------------------------------------- |
| Cliente não consegue usar OTP | Alta          | Alto    | Modo facilitado, atendente pode acessar por ele |
| Fraude de pontos              | Média         | Alto    | Auditoria, ajustes só por admin                 |
| Perda de dados                | Baixa         | Crítico | Backup automático, soft delete                  |
| Sistema fora do ar            | Baixa         | Alto    | Monitoramento, redundância                      |

---

## 10. Glossário

| Termo           | Definição                             |
| --------------- | ------------------------------------- |
| **Tenant**      | Clínica/empresa que usa o sistema     |
| **Cliente**     | Pessoa que recebe serviços na clínica |
| **Atendimento** | Registro de serviço(s) prestado(s)    |
| **Pontos**      | Unidade de fidelidade acumulada       |
| **Recompensa**  | Benefício conquistado pelo cliente    |
| **Resgate**     | Ato de utilizar uma recompensa        |
| **OTP**         | One-Time Password (código único)      |

---

_Documento vivo - Atualizar conforme evolução do produto_
