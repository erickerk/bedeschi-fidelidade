# Modelo de Dados - Bedeschi Fidelidade

## 1. Diagrama ER (Entidade-Relacionamento)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              MODELO DE DADOS                                         │
└─────────────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────┐         ┌─────────────┐         ┌─────────────┐
    │   TENANTS   │────────▶│    USERS    │         │ CATEGORIES  │
    │  (clinics)  │         │  (staff)    │         │  (service)  │
    └──────┬──────┘         └─────────────┘         └──────┬──────┘
           │                                                │
           │                                                │
           ▼                                                ▼
    ┌─────────────┐                                 ┌─────────────┐
    │   CLIENTS   │                                 │  SERVICES   │
    │ (customers) │                                 │  (catalog)  │
    └──────┬──────┘                                 └──────┬──────┘
           │                                                │
           │         ┌─────────────────────┐               │
           └────────▶│    APPOINTMENTS     │◀──────────────┘
                     │    (main record)    │
                     └──────────┬──────────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
              ▼                 ▼                 ▼
    ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
    │ APPOINTMENT │   │   REVIEWS   │   │   POINTS    │
    │    ITEMS    │   │ (feedback)  │   │TRANSACTIONS │
    └─────────────┘   └─────────────┘   └─────────────┘


    ┌─────────────┐         ┌─────────────┐         ┌─────────────┐
    │  FIDELITY   │────────▶│   REWARDS   │────────▶│  REDEMPTIONS│
    │    RULES    │         │  (earned)   │         │  (claimed)  │
    └─────────────┘         └─────────────┘         └─────────────┘


    ┌─────────────┐
    │ AUDIT_LOGS  │  (registra todas as ações importantes)
    └─────────────┘
```

---

## 2. Schemas das Tabelas

### 2.1 Tenants (Clínicas)

```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificação
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,  -- usado na URL: /c/bedeschi
  document VARCHAR(20),               -- CNPJ

  -- Contato
  email VARCHAR(255),
  phone VARCHAR(20),
  whatsapp VARCHAR(20),

  -- Endereço
  address_street VARCHAR(255),
  address_number VARCHAR(20),
  address_complement VARCHAR(100),
  address_neighborhood VARCHAR(100),
  address_city VARCHAR(100),
  address_state VARCHAR(2),
  address_zipcode VARCHAR(10),

  -- Branding
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#C9A962',    -- Dourado Bedeschi
  secondary_color VARCHAR(7) DEFAULT '#3D4555',  -- Azul escuro Bedeschi

  -- Configurações
  settings JSONB DEFAULT '{
    "otp_enabled": true,
    "otp_method": "whatsapp",
    "review_expiry_days": 30,
    "review_edit_hours": 24,
    "points_expiry_days": 365,
    "timezone": "America/Sao_Paulo"
  }',

  -- Status
  status VARCHAR(20) DEFAULT 'active',  -- active, suspended, cancelled
  subscription_plan VARCHAR(50) DEFAULT 'starter',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_status ON tenants(status);
```

### 2.2 Users (Usuários Staff - Atendentes/Admin)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),

  -- Auth (vinculado ao Supabase Auth)
  auth_id UUID UNIQUE,  -- supabase.auth.users.id

  -- Dados pessoais
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  avatar_url TEXT,

  -- Permissões
  role VARCHAR(20) NOT NULL DEFAULT 'attendant',  -- owner, admin, attendant
  permissions JSONB DEFAULT '[]',

  -- Status
  status VARCHAR(20) DEFAULT 'active',  -- active, inactive, blocked

  -- Timestamps
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_auth ON users(auth_id);
CREATE INDEX idx_users_email ON users(email);
```

### 2.3 Clients (Clientes da Clínica)

```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),

  -- Identificação
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,  -- Principal identificador
  phone_verified BOOLEAN DEFAULT FALSE,
  email VARCHAR(255),
  document VARCHAR(14),        -- CPF

  -- Dados pessoais
  birth_date DATE,
  gender VARCHAR(20),

  -- Endereço (opcional)
  address_street VARCHAR(255),
  address_city VARCHAR(100),
  address_state VARCHAR(2),
  address_zipcode VARCHAR(10),

  -- Notas
  notes TEXT,
  tags JSONB DEFAULT '[]',

  -- LGPD
  consent_accepted BOOLEAN DEFAULT FALSE,
  consent_date TIMESTAMPTZ,
  consent_ip VARCHAR(45),
  marketing_consent BOOLEAN DEFAULT FALSE,

  -- QR Code individual (futuro)
  unique_code VARCHAR(20) UNIQUE,

  -- Status
  status VARCHAR(20) DEFAULT 'active',  -- active, inactive, blocked

  -- Timestamps
  last_visit_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  -- Constraints
  UNIQUE(tenant_id, phone)
);

CREATE INDEX idx_clients_tenant ON clients(tenant_id);
CREATE INDEX idx_clients_phone ON clients(phone);
CREATE INDEX idx_clients_unique_code ON clients(unique_code);
```

### 2.4 Categories (Categorias de Serviços)

```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),

  -- Dados
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(7),

  -- Ordenação
  sort_order INTEGER DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(tenant_id, slug)
);

CREATE INDEX idx_categories_tenant ON categories(tenant_id);
```

### 2.5 Services (Serviços/Procedimentos)

```sql
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  category_id UUID REFERENCES categories(id),

  -- Identificação (importado da planilha)
  external_code VARCHAR(50),  -- Código da planilha
  cnae VARCHAR(20),

  -- Dados do serviço
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Valores
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  duration_minutes INTEGER DEFAULT 60,

  -- Fidelidade
  points_multiplier DECIMAL(4,2) DEFAULT 1.0,  -- Multiplicador de pontos
  eligible_for_points BOOLEAN DEFAULT TRUE,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(tenant_id, external_code)
);

CREATE INDEX idx_services_tenant ON services(tenant_id);
CREATE INDEX idx_services_category ON services(category_id);
CREATE INDEX idx_services_external_code ON services(external_code);
```

### 2.6 Appointments (Atendimentos)

```sql
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  attended_by UUID REFERENCES users(id),  -- Atendente

  -- Data/hora
  appointment_date DATE NOT NULL,
  appointment_time TIME,

  -- Valores
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,

  -- Pagamento (opcional)
  payment_method VARCHAR(50),  -- pix, credit, debit, cash, mixed
  payment_status VARCHAR(20) DEFAULT 'pending',  -- pending, paid, partial

  -- Observações
  notes TEXT,

  -- Status
  status VARCHAR(20) DEFAULT 'completed',  -- scheduled, in_progress, completed, cancelled

  -- Flags de avaliação
  review_requested BOOLEAN DEFAULT FALSE,
  review_completed BOOLEAN DEFAULT FALSE,
  review_skipped_count INTEGER DEFAULT 0,
  review_expires_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_appointments_tenant ON appointments(tenant_id);
CREATE INDEX idx_appointments_client ON appointments(client_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_review ON appointments(review_completed, review_expires_at);
```

### 2.7 Appointment Items (Itens do Atendimento)

```sql
CREATE TABLE appointment_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id),

  -- Snapshot do serviço no momento
  service_name VARCHAR(255) NOT NULL,
  service_category_id UUID,

  -- Valores
  unit_price DECIMAL(10,2) NOT NULL,
  quantity INTEGER DEFAULT 1,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,

  -- Pontos gerados
  points_earned INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_appointment_items_appointment ON appointment_items(appointment_id);
CREATE INDEX idx_appointment_items_service ON appointment_items(service_id);
```

### 2.8 Points Transactions (Ledger de Pontos)

```sql
CREATE TABLE points_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  client_id UUID NOT NULL REFERENCES clients(id),

  -- Tipo de transação
  type VARCHAR(30) NOT NULL,
  -- EARN_APPOINTMENT: pontos ganhos por atendimento
  -- EARN_BONUS: bônus manual ou promoção
  -- REDEEM: resgate de pontos
  -- EXPIRE: expiração
  -- ADJUST_ADD: ajuste manual (adição)
  -- ADJUST_SUB: ajuste manual (subtração)

  -- Valores
  amount INTEGER NOT NULL,          -- Positivo ou negativo
  balance_after INTEGER NOT NULL,   -- Saldo após transação

  -- Referência
  reference_type VARCHAR(50),       -- appointment, reward, manual
  reference_id UUID,

  -- Detalhes
  description TEXT,

  -- Metadados (categoria, serviço para acúmulo por tipo)
  metadata JSONB DEFAULT '{}',

  -- Expiração (para pontos que expiram)
  expires_at TIMESTAMPTZ,
  expired BOOLEAN DEFAULT FALSE,

  -- Auditoria
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_points_tenant ON points_transactions(tenant_id);
CREATE INDEX idx_points_client ON points_transactions(client_id);
CREATE INDEX idx_points_type ON points_transactions(type);
CREATE INDEX idx_points_expires ON points_transactions(expires_at, expired);
```

### 2.9 Category Accumulation (Acúmulo por Categoria)

```sql
-- Tabela para rastrear acúmulo por categoria/cliente
CREATE TABLE client_category_accumulation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  category_id UUID NOT NULL REFERENCES categories(id),

  -- Acumulados
  total_spent DECIMAL(12,2) DEFAULT 0,
  total_quantity INTEGER DEFAULT 0,

  -- Última atualização
  last_appointment_id UUID REFERENCES appointments(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(client_id, category_id)
);

CREATE INDEX idx_accumulation_client ON client_category_accumulation(client_id);
CREATE INDEX idx_accumulation_category ON client_category_accumulation(category_id);
```

### 2.10 Fidelity Rules (Regras de Fidelidade)

```sql
CREATE TABLE fidelity_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),

  -- Identificação
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Tipo de regra
  rule_type VARCHAR(30) NOT NULL,
  -- VALUE_ACCUMULATION: acúmulo por valor gasto
  -- QUANTITY_ACCUMULATION: acúmulo por quantidade
  -- POINTS_CONVERSION: pontos para crédito/desconto

  -- Condições (trigger)
  trigger_config JSONB NOT NULL,
  -- Exemplo VALUE_ACCUMULATION:
  -- {
  --   "category_id": "uuid" | null (todas),
  --   "service_id": "uuid" | null (todos da categoria),
  --   "threshold_value": 1000.00
  -- }
  -- Exemplo QUANTITY_ACCUMULATION:
  -- {
  --   "service_id": "uuid",
  --   "threshold_quantity": 10
  -- }

  -- Recompensa
  reward_config JSONB NOT NULL,
  -- {
  --   "type": "FREE_SERVICE" | "DISCOUNT_FIXED" | "DISCOUNT_PERCENT" | "CREDIT",
  --   "service_id": "uuid" (se FREE_SERVICE),
  --   "value": 50.00 (se DISCOUNT ou CREDIT),
  --   "percent": 10 (se DISCOUNT_PERCENT),
  --   "validity_days": 60,
  --   "max_uses": 1,
  --   "restricted_to_categories": ["uuid"] | null
  -- }

  -- Comportamento
  reset_after_reward BOOLEAN DEFAULT TRUE,
  stackable BOOLEAN DEFAULT FALSE,  -- Pode acumular múltiplas vezes

  -- Período de validade da regra
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,

  -- Prioridade (para conflitos)
  priority INTEGER DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fidelity_rules_tenant ON fidelity_rules(tenant_id);
CREATE INDEX idx_fidelity_rules_active ON fidelity_rules(is_active, starts_at, ends_at);
```

### 2.11 Rewards (Recompensas Ganhas)

```sql
CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  rule_id UUID REFERENCES fidelity_rules(id),

  -- Tipo
  reward_type VARCHAR(30) NOT NULL,
  -- FREE_SERVICE, DISCOUNT_FIXED, DISCOUNT_PERCENT, CREDIT

  -- Detalhes (snapshot da regra)
  title VARCHAR(255) NOT NULL,
  description TEXT,

  -- Valor/Serviço
  service_id UUID REFERENCES services(id),
  service_name VARCHAR(255),
  value DECIMAL(10,2),
  percent INTEGER,

  -- Restrições
  restricted_services JSONB,  -- Array de service_ids
  restricted_categories JSONB,  -- Array de category_ids

  -- Validade
  expires_at TIMESTAMPTZ NOT NULL,

  -- Status
  status VARCHAR(20) DEFAULT 'available',
  -- available, redeemed, expired, cancelled

  -- Resgate
  redeemed_at TIMESTAMPTZ,
  redeemed_appointment_id UUID REFERENCES appointments(id),

  -- Origem
  earned_from_appointment_id UUID REFERENCES appointments(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rewards_tenant ON rewards(tenant_id);
CREATE INDEX idx_rewards_client ON rewards(client_id);
CREATE INDEX idx_rewards_status ON rewards(status, expires_at);
```

### 2.12 Reviews (Avaliações)

```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  appointment_id UUID NOT NULL REFERENCES appointments(id),

  -- Avaliação
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,

  -- Avaliação por serviço (opcional, detalhada)
  service_ratings JSONB,
  -- [{"service_id": "uuid", "service_name": "...", "rating": 5}]

  -- Avaliação do atendente (opcional)
  attendant_id UUID REFERENCES users(id),
  attendant_rating INTEGER CHECK (attendant_rating >= 1 AND attendant_rating <= 5),

  -- Status
  status VARCHAR(20) DEFAULT 'published',  -- published, hidden, flagged

  -- Edição
  edited_at TIMESTAMPTZ,
  edit_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reviews_tenant ON reviews(tenant_id);
CREATE INDEX idx_reviews_client ON reviews(client_id);
CREATE INDEX idx_reviews_appointment ON reviews(appointment_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
```

### 2.13 Audit Logs (Trilha de Auditoria)

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),

  -- Quem
  user_id UUID REFERENCES users(id),
  client_id UUID REFERENCES clients(id),
  actor_type VARCHAR(20) NOT NULL,  -- user, client, system

  -- O quê
  action VARCHAR(100) NOT NULL,
  -- Exemplos: client.create, appointment.create, points.adjust,
  -- reward.redeem, user.login, settings.update

  -- Recurso
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,

  -- Detalhes
  old_values JSONB,
  new_values JSONB,
  metadata JSONB,

  -- Contexto
  ip_address VARCHAR(45),
  user_agent TEXT,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);
```

### 2.14 OTP Codes (Códigos de Verificação)

```sql
CREATE TABLE otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),

  -- Destino
  phone VARCHAR(20) NOT NULL,

  -- Código
  code VARCHAR(6) NOT NULL,

  -- Controle
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,

  -- Validade
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_otp_phone ON otp_codes(phone, expires_at);
```

---

## 3. Views Úteis

### 3.1 Saldo de Pontos do Cliente

```sql
CREATE VIEW client_points_balance AS
SELECT
  client_id,
  tenant_id,
  COALESCE(SUM(amount), 0) as balance,
  MAX(created_at) as last_transaction_at
FROM points_transactions
WHERE expired = FALSE
GROUP BY client_id, tenant_id;
```

### 3.2 Resumo do Cliente

```sql
CREATE VIEW client_summary AS
SELECT
  c.id as client_id,
  c.tenant_id,
  c.name,
  c.phone,
  COALESCE(pb.balance, 0) as points_balance,
  COUNT(DISTINCT a.id) as total_appointments,
  COALESCE(SUM(a.total), 0) as total_spent,
  MAX(a.appointment_date) as last_visit,
  COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'available') as available_rewards,
  AVG(rev.rating) as avg_rating
FROM clients c
LEFT JOIN client_points_balance pb ON c.id = pb.client_id
LEFT JOIN appointments a ON c.id = a.client_id
LEFT JOIN rewards r ON c.id = r.client_id
LEFT JOIN reviews rev ON c.id = rev.client_id
GROUP BY c.id, c.tenant_id, c.name, c.phone, pb.balance;
```

---

## 4. Políticas RLS (Row Level Security)

```sql
-- Habilitar RLS em todas as tabelas
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
-- ... etc

-- Função para obter tenant_id do usuário atual
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN NULLIF(current_setting('app.tenant_id', true), '')::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Política para clientes
CREATE POLICY tenant_isolation_clients ON clients
  USING (tenant_id = get_current_tenant_id());

-- Política para serviços (leitura pública para QR)
CREATE POLICY tenant_isolation_services ON services
  FOR SELECT USING (tenant_id = get_current_tenant_id() OR TRUE);

CREATE POLICY tenant_write_services ON services
  FOR ALL USING (tenant_id = get_current_tenant_id());

-- ... políticas similares para outras tabelas
```

---

## 5. Migrations Exemplo

```sql
-- 001_initial_schema.sql
-- Criação das tabelas base

-- 002_add_fidelity_rules.sql
-- Adiciona sistema de regras

-- 003_add_reviews.sql
-- Adiciona avaliações

-- 004_add_audit_logs.sql
-- Adiciona auditoria
```

---

## 6. Índices de Performance

```sql
-- Busca de cliente por telefone (muito usado)
CREATE INDEX CONCURRENTLY idx_clients_phone_tenant
ON clients(tenant_id, phone);

-- Atendimentos recentes para avaliação
CREATE INDEX CONCURRENTLY idx_appointments_pending_review
ON appointments(client_id, appointment_date DESC)
WHERE review_completed = FALSE AND review_expires_at > NOW();

-- Recompensas disponíveis
CREATE INDEX CONCURRENTLY idx_rewards_available
ON rewards(client_id, status, expires_at)
WHERE status = 'available';
```

---

_Schema versionado via migrations_
