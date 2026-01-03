# Bedeschi Fidelidade

Sistema de fidelidade para clínicas de estética - **Instituto Bedeschi Beauty Clinic**

![Logo Instituto Bedeschi](./public/logo.svg)

## Visão Geral

SaaS mobile-first para automação de programa de fidelidade, permitindo:

- **Clientes**: Acesso via QR Code para ver pontos, recompensas e avaliar atendimentos
- **Atendentes**: Cadastro de clientes, lançamento de atendimentos, gestão de resgates
- **Administradores**: Configuração de regras, importação de serviços, relatórios

## Tech Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | Next.js 14, TypeScript, TailwindCSS, shadcn/ui |
| Backend | Next.js API Routes, Supabase |
| Database | PostgreSQL (Supabase) |
| Auth | Supabase Auth + OTP via WhatsApp |
| Deploy | Vercel |

## Documentação

| Documento | Descrição |
|-----------|-----------|
| [PRD](./docs/PRD.md) | Product Requirements Document |
| [Arquitetura](./docs/ARCHITECTURE.md) | Decisões técnicas e diagramas |
| [Banco de Dados](./docs/DATABASE.md) | Schema e modelo de dados |
| [API](./docs/API.md) | Endpoints e payloads |
| [Design System](./docs/DESIGN-SYSTEM.md) | Cores, tipografia, componentes |
| [Implementação](./docs/IMPLEMENTATION-PLAN.md) | Sprints e cronograma |

## Quick Start

### Pré-requisitos

- Node.js 20+
- pnpm (recomendado) ou npm
- Conta Supabase

### Instalação

```bash
# Clonar repositório
git clone <repo-url>
cd bedeschi-fidelidade

# Instalar dependências
pnpm install

# Configurar variáveis de ambiente
cp .env.example .env.local
# Editar .env.local com suas credenciais

# Rodar migrations
pnpm db:migrate

# Iniciar dev server
pnpm dev
```

### Variáveis de Ambiente

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# OTP (Twilio/Evolution API)
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_WHATSAPP_NUMBER=+14155238886
```

## Scripts

```bash
pnpm dev          # Iniciar servidor de desenvolvimento
pnpm build        # Build de produção
pnpm start        # Iniciar servidor de produção
pnpm lint         # Verificar linting
pnpm test         # Rodar testes
pnpm db:migrate   # Rodar migrations
pnpm db:seed      # Popular banco com dados iniciais
pnpm db:studio    # Abrir Supabase Studio local
```

## Estrutura do Projeto

```
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Rotas autenticadas
│   │   │   ├── admin/          # Painel admin
│   │   │   └── attendant/      # Painel atendente
│   │   ├── (public)/           # Rotas públicas
│   │   │   └── c/[tenant]/     # Acesso cliente via QR
│   │   └── api/                # API Routes
│   ├── components/             # Componentes React
│   │   ├── ui/                 # shadcn/ui
│   │   └── ...                 # Componentes customizados
│   ├── lib/                    # Utilitários e configs
│   └── types/                  # TypeScript types
├── supabase/
│   ├── migrations/             # SQL migrations
│   └── seed.sql                # Dados iniciais
├── public/                     # Assets estáticos
└── docs/                       # Documentação
```

## Fluxos Principais

### Cliente (QR Code)

```
QR Code → Digita celular → OTP → Vê pontos/recompensas → Avalia atendimento
```

### Atendente

```
Login → Busca cliente → Lança atendimento → Sistema calcula pontos → Cliente ganha recompensa
```

### Admin

```
Login → Importa serviços (XLSX) → Configura regras → Monitora dashboard
```

## Paleta de Cores

Baseado no logo Instituto Bedeschi:

| Cor | Hex | Uso |
|-----|-----|-----|
| Dourado | `#C9A962` | Primária, destaques, CTAs |
| Slate | `#3D4555` | Secundária, backgrounds escuros |
| White | `#FFFFFF` | Backgrounds claros |

## Contribuição

1. Crie uma branch: `git checkout -b feature/nome-da-feature`
2. Commit suas mudanças: `git commit -m 'feat: descrição'`
3. Push para a branch: `git push origin feature/nome-da-feature`
4. Abra um Pull Request

### Convenção de Commits

- `feat:` Nova feature
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação
- `refactor:` Refatoração
- `test:` Testes
- `chore:` Manutenção

## Licença

Proprietário - Instituto Bedeschi © 2026

---

**Desenvolvido com 💛 para Instituto Bedeschi Beauty Clinic**
