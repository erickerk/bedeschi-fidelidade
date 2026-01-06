# Arquitetura Técnica - Bedeschi Fidelidade

## 1. Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENTE (BROWSER/PWA)                             │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                │
│  │  App Cliente   │  │  App Atendente │  │  App Admin     │                │
│  │  (Mobile-first)│  │  (Responsivo)  │  │  (Dashboard)   │                │
│  └───────┬────────┘  └───────┬────────┘  └───────┬────────┘                │
│          │                   │                   │                          │
│          └───────────────────┴───────────────────┘                          │
│                              │                                              │
│                    Next.js 14 (App Router)                                  │
│                    TailwindCSS + shadcn/ui                                  │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │ HTTPS
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API LAYER                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Next.js API Routes / Server Actions              │   │
│  │                    (tRPC ou REST - endpoints typed)                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│  │  Auth Middleware│  │  Tenant Resolver│  │  Rate Limiter   │            │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘            │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SUPABASE (BaaS)                                   │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                         PostgreSQL                                    │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │ │
│  │  │   Tenants   │  │   Users     │  │  Clients    │  │  Services   │  │ │
│  │  │   (clinics) │  │  (staff)    │  │  (patients) │  │  (catalog)  │  │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │ │
│  │  │ Appointments│  │   Points    │  │  Rewards    │  │   Reviews   │  │ │
│  │  │             │  │  (ledger)   │  │  (rules)    │  │             │  │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │ │
│  │                                                                       │ │
│  │  Row Level Security (RLS) por tenant_id                              │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│  │  Supabase Auth  │  │  Edge Functions │  │  Storage        │            │
│  │  (JWT + OTP)    │  │  (webhooks)     │  │  (uploads)      │            │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘            │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SERVIÇOS EXTERNOS                                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│  │  Twilio/WhatsApp│  │  Resend (email) │  │  Vercel (host)  │            │
│  │  (OTP/notif)    │  │                 │  │                 │            │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Stack Tecnológico

### 2.1 Frontend

| Tecnologia                | Justificativa                                             |
| ------------------------- | --------------------------------------------------------- |
| **Next.js 14**            | SSR, App Router, Server Components, API Routes integradas |
| **TypeScript**            | Tipagem forte, menos bugs, melhor DX                      |
| **TailwindCSS**           | Utility-first, design system consistente, rápido          |
| **shadcn/ui**             | Componentes acessíveis, customizáveis, sem vendor lock    |
| **Framer Motion**         | Animações cinematográficas premium                        |
| **React Hook Form + Zod** | Forms performáticos com validação                         |
| **TanStack Query**        | Cache e sync de dados server state                        |

### 2.2 Backend

| Tecnologia             | Justificativa                                           |
| ---------------------- | ------------------------------------------------------- |
| **Next.js API Routes** | Simplicidade, mesmo deploy, typed end-to-end            |
| **Supabase**           | Auth, DB, RLS, Edge Functions, Storage - tudo integrado |
| **PostgreSQL**         | Robusto, RLS nativo, JSONB para flexibilidade           |
| **Drizzle ORM**        | Type-safe, migrations, performance                      |

### 2.3 Infraestrutura

| Tecnologia         | Justificativa                                      |
| ------------------ | -------------------------------------------------- |
| **Vercel**         | Deploy simplificado, edge network, preview deploys |
| **Supabase Cloud** | Managed Postgres, backups automáticos              |
| **Upstash**        | Rate limiting, Redis serverless                    |

### 2.4 Serviços Externos

| Serviço                    | Uso                         |
| -------------------------- | --------------------------- |
| **Twilio / Evolution API** | WhatsApp OTP e notificações |
| **Resend**                 | Emails transacionais        |
| **QRCode.react**           | Geração de QR Codes         |

---

## 3. Decisões Arquiteturais

### 3.1 Multi-tenancy

**Estratégia:** Shared Database com Row Level Security (RLS)

```sql
-- Todas as tabelas têm tenant_id
-- RLS garante isolamento automático

CREATE POLICY "tenant_isolation" ON clients
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

**Prós:**

- Custo menor (1 banco para todos)
- Migrations simplificadas
- Queries cross-tenant fáceis para analytics

**Contras:**

- Precisa de cuidado extremo com RLS
- Performance pode degradar em escala muito grande

### 3.2 Autenticação

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUXOS DE AUTENTICAÇÃO                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  CLIENTE (sem conta):                                       │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐  │
│  │ QR Code │───▶│ Celular │───▶│   OTP   │───▶│ Session │  │
│  │  Scan   │    │  Input  │    │ WhatsApp│    │ (30min) │  │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘  │
│                                                             │
│  ATENDENTE/ADMIN (conta):                                   │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐  │
│  │  Email  │───▶│  Senha  │───▶│Supabase │───▶│   JWT   │  │
│  │  Input  │    │  Input  │    │  Auth   │    │ (7 dias)│  │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘  │
│                       ou                                    │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐                 │
│  │ Celular │───▶│   OTP   │───▶│   JWT   │                 │
│  │  Input  │    │  (SMS)  │    │         │                 │
│  └─────────┘    └─────────┘    └─────────┘                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 Sistema de Pontos (Event Sourcing Light)

Ao invés de guardar apenas o saldo, guardamos todas as transações:

```sql
-- Tabela de transações (ledger)
points_transactions (
  id, client_id, type, amount, balance_after,
  reference_type, reference_id, description, created_at
)

-- View materializada para saldo atual
client_points_balance AS
  SELECT client_id, SUM(amount) as balance
  FROM points_transactions
  GROUP BY client_id;
```

**Benefícios:**

- Auditoria completa
- Recálculo possível
- Histórico preservado

---

## 4. Estrutura de Pastas

```
bedeschi-fidelidade/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/               # Grupo: páginas autenticadas
│   │   │   ├── admin/            # Painel administrativo
│   │   │   │   ├── dashboard/
│   │   │   │   ├── services/
│   │   │   │   ├── rules/
│   │   │   │   ├── users/
│   │   │   │   └── reports/
│   │   │   ├── attendant/        # Painel atendente
│   │   │   │   ├── clients/
│   │   │   │   ├── appointments/
│   │   │   │   └── rewards/
│   │   │   └── layout.tsx
│   │   ├── (public)/             # Grupo: páginas públicas
│   │   │   ├── c/                # /c - Cliente acesso QR
│   │   │   │   ├── [tenantSlug]/ # /c/bedeschi
│   │   │   │   │   └── page.tsx  # Tela de entrada
│   │   │   │   └── verify/       # Verificação OTP
│   │   │   └── layout.tsx
│   │   ├── api/                  # API Routes
│   │   │   ├── auth/
│   │   │   ├── clients/
│   │   │   ├── appointments/
│   │   │   ├── points/
│   │   │   ├── rewards/
│   │   │   └── webhooks/
│   │   ├── layout.tsx
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── forms/                # Formulários reutilizáveis
│   │   ├── client/               # Componentes área cliente
│   │   ├── attendant/            # Componentes área atendente
│   │   ├── admin/                # Componentes área admin
│   │   └── shared/               # Componentes compartilhados
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts         # Browser client
│   │   │   ├── server.ts         # Server client
│   │   │   └── admin.ts          # Admin client (service role)
│   │   ├── db/
│   │   │   ├── schema.ts         # Drizzle schema
│   │   │   └── queries/          # Queries tipadas
│   │   ├── auth/
│   │   │   └── middleware.ts
│   │   ├── points/
│   │   │   ├── calculator.ts     # Lógica de cálculo
│   │   │   └── rules-engine.ts   # Motor de regras
│   │   └── utils/
│   │       ├── format.ts
│   │       └── validation.ts
│   │
│   ├── hooks/                    # React hooks customizados
│   ├── types/                    # TypeScript types/interfaces
│   └── constants/                # Constantes e configs
│
├── supabase/
│   ├── migrations/               # SQL migrations
│   ├── functions/                # Edge Functions
│   └── seed.sql                  # Dados iniciais
│
├── public/
│   ├── logo.svg
│   └── icons/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── docs/
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   └── API.md
│
├── .env.example
├── .env.local
├── package.json
├── tailwind.config.ts
├── drizzle.config.ts
└── README.md
```

---

## 5. Fluxo de Dados

### 5.1 Lançamento de Atendimento

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      FLUXO: LANÇAR ATENDIMENTO                              │
└─────────────────────────────────────────────────────────────────────────────┘

   ATENDENTE                    API                         DATABASE
      │                          │                              │
      │  POST /appointments      │                              │
      │  {client_id, items[]}    │                              │
      │─────────────────────────▶│                              │
      │                          │                              │
      │                          │  BEGIN TRANSACTION           │
      │                          │─────────────────────────────▶│
      │                          │                              │
      │                          │  1. INSERT appointment       │
      │                          │─────────────────────────────▶│
      │                          │                              │
      │                          │  2. INSERT appointment_items │
      │                          │─────────────────────────────▶│
      │                          │                              │
      │                          │  3. Calculate points         │
      │                          │  (rules engine)              │
      │                          │                              │
      │                          │  4. INSERT points_transaction│
      │                          │─────────────────────────────▶│
      │                          │                              │
      │                          │  5. Check reward eligibility │
      │                          │  (rules engine)              │
      │                          │                              │
      │                          │  6. INSERT reward (if earned)│
      │                          │─────────────────────────────▶│
      │                          │                              │
      │                          │  COMMIT                      │
      │                          │─────────────────────────────▶│
      │                          │                              │
      │  200 OK                  │                              │
      │  {appointment, points,   │                              │
      │   newRewards}            │                              │
      │◀─────────────────────────│                              │
      │                          │                              │
```

### 5.2 Motor de Regras de Fidelidade

```typescript
// Pseudocódigo do Rules Engine

interface FidelityRule {
  id: string;
  type: "VALUE_ACCUMULATION" | "QUANTITY_ACCUMULATION" | "POINTS";
  trigger: {
    categoryId?: string;
    serviceId?: string;
    minValue?: number;
    minQuantity?: number;
  };
  reward: {
    type: "FREE_SERVICE" | "DISCOUNT_FIXED" | "DISCOUNT_PERCENT" | "CREDIT";
    serviceId?: string;
    value?: number;
    validityDays: number;
  };
  resetAfterReward: boolean;
  active: boolean;
}

async function processAppointment(appointment: Appointment) {
  const rules = await getActiveRules(appointment.tenant_id);
  const clientAccumulation = await getClientAccumulation(appointment.client_id);

  const earnedRewards: Reward[] = [];

  for (const rule of rules) {
    const eligible = checkEligibility(rule, appointment, clientAccumulation);

    if (eligible) {
      const reward = createReward(rule, appointment.client_id);
      earnedRewards.push(reward);

      if (rule.resetAfterReward) {
        await resetAccumulation(appointment.client_id, rule);
      }
    }
  }

  return earnedRewards;
}
```

---

## 6. Segurança

### 6.1 Camadas de Segurança

| Camada            | Implementação                   |
| ----------------- | ------------------------------- |
| **Transport**     | HTTPS only, HSTS                |
| **Auth**          | JWT + Refresh tokens, OTP       |
| **Authorization** | RLS + Middleware                |
| **Input**         | Zod validation, sanitização     |
| **Rate Limiting** | Upstash, por IP e por user      |
| **Audit**         | Log de todas as ações sensíveis |

### 6.2 Headers de Segurança

```typescript
// next.config.js
const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Strict-Transport-Security", value: "max-age=63072000" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=()" },
];
```

### 6.3 Rate Limiting

```
Endpoint                    Limite
─────────────────────────────────────
POST /api/auth/otp/send     5/min por IP
POST /api/auth/otp/verify   10/min por IP
GET  /api/clients/*         100/min por user
POST /api/appointments      30/min por user
```

---

## 7. Monitoramento

### 7.1 Métricas

| Métrica        | Ferramenta       | Alerta   |
| -------------- | ---------------- | -------- |
| Uptime         | Vercel Analytics | < 99%    |
| Response Time  | Vercel           | p95 > 2s |
| Error Rate     | Sentry           | > 1%     |
| DB Connections | Supabase         | > 80%    |

### 7.2 Logs

```typescript
// Estrutura de log padronizada
{
  timestamp: ISO8601,
  level: 'info' | 'warn' | 'error',
  tenant_id: uuid,
  user_id: uuid | null,
  action: string,
  resource: string,
  resource_id: uuid,
  metadata: object,
  duration_ms: number
}
```

---

## 8. Deploy e CI/CD

```yaml
# GitHub Actions simplificado
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install & Test
        run: |
          npm ci
          npm run lint
          npm run test

      - name: Deploy to Vercel
        uses: vercel/actions@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
```

---

## 9. Estimativa de Custos (MVP)

| Serviço           | Plano     | Custo/mês       |
| ----------------- | --------- | --------------- |
| Vercel            | Pro       | ~$20            |
| Supabase          | Pro       | ~$25            |
| Twilio (WhatsApp) | Pay-as-go | ~$10-30         |
| Resend            | Free tier | $0              |
| Upstash           | Free tier | $0              |
| Domínio           | .com.br   | ~R$ 40/ano      |
| **Total MVP**     |           | **~$55-75/mês** |

---

_Arquitetura revisável conforme crescimento e necessidades_
