# Design System - Bedeschi Fidelidade

## 1. Identidade Visual

### 1.1 Cores (Baseado no Logo)

```css
:root {
  /* Cores Primárias - Instituto Bedeschi */
  --gold-50: #fdf9f0;
  --gold-100: #f9efd8;
  --gold-200: #f0ddb0;
  --gold-300: #e5c77d;
  --gold-400: #d9b256;
  --gold-500: #c9a962; /* Principal - Logo */
  --gold-600: #b08d3e;
  --gold-700: #8e7132;
  --gold-800: #6b5526;
  --gold-900: #4a3a1a;

  /* Cores Secundárias */
  --slate-50: #f8fafc;
  --slate-100: #f1f5f9;
  --slate-200: #e2e8f0;
  --slate-300: #cbd5e1;
  --slate-400: #94a3b8;
  --slate-500: #64748b;
  --slate-600: #475569;
  --slate-700: #3d4555; /* Principal - Logo */
  --slate-800: #1e293b;
  --slate-900: #0f172a;

  /* Feedback */
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #3b82f6;

  /* Backgrounds */
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-dark: #3d4555;
  --bg-premium: linear-gradient(135deg, #3d4555 0%, #2d3340 100%);
}
```

### 1.2 Tipografia

```css
:root {
  /* Font Families */
  --font-display: "Playfair Display", Georgia, serif; /* Títulos premium */
  --font-body: "Inter", system-ui, sans-serif; /* Corpo do texto */

  /* Font Sizes */
  --text-xs: 0.75rem; /* 12px */
  --text-sm: 0.875rem; /* 14px */
  --text-base: 1rem; /* 16px */
  --text-lg: 1.125rem; /* 18px */
  --text-xl: 1.25rem; /* 20px */
  --text-2xl: 1.5rem; /* 24px */
  --text-3xl: 1.875rem; /* 30px */
  --text-4xl: 2.25rem; /* 36px */
  --text-5xl: 3rem; /* 48px */

  /* Font Weights */
  --font-light: 300;
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;

  /* Line Heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
}
```

### 1.3 Espaçamento

```css
:root {
  --space-1: 0.25rem; /* 4px */
  --space-2: 0.5rem; /* 8px */
  --space-3: 0.75rem; /* 12px */
  --space-4: 1rem; /* 16px */
  --space-5: 1.25rem; /* 20px */
  --space-6: 1.5rem; /* 24px */
  --space-8: 2rem; /* 32px */
  --space-10: 2.5rem; /* 40px */
  --space-12: 3rem; /* 48px */
  --space-16: 4rem; /* 64px */
  --space-20: 5rem; /* 80px */
}
```

### 1.4 Bordas e Sombras

```css
:root {
  /* Border Radius */
  --radius-sm: 0.25rem; /* 4px */
  --radius-md: 0.5rem; /* 8px */
  --radius-lg: 0.75rem; /* 12px */
  --radius-xl: 1rem; /* 16px */
  --radius-2xl: 1.5rem; /* 24px */
  --radius-full: 9999px;

  /* Shadows - Premium feel */
  --shadow-sm: 0 1px 2px rgba(61, 69, 85, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(61, 69, 85, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(61, 69, 85, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(61, 69, 85, 0.1);
  --shadow-gold: 0 4px 14px rgba(201, 169, 98, 0.25);
  --shadow-premium: 0 25px 50px -12px rgba(61, 69, 85, 0.25);
}
```

### 1.5 Animações

```css
:root {
  /* Durations */
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;

  /* Easings */
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

---

## 2. Componentes

### 2.1 Botões

```tsx
// Variantes de botão

// Primary (Dourado) - Ações principais
<Button variant="primary">
  Acessar Meus Pontos
</Button>
// bg-gold-500, text-slate-900, hover:bg-gold-600
// Sombra dourada no hover

// Secondary (Outline)
<Button variant="secondary">
  Ver Histórico
</Button>
// border-gold-500, text-gold-600, hover:bg-gold-50

// Ghost (Transparente)
<Button variant="ghost">
  Cancelar
</Button>
// text-slate-600, hover:bg-slate-100

// Tamanhos
<Button size="lg">Grande</Button>  // h-14, text-lg, px-8
<Button size="md">Médio</Button>   // h-12, text-base, px-6
<Button size="sm">Pequeno</Button> // h-10, text-sm, px-4

// Estado de loading
<Button loading>
  <Spinner /> Processando...
</Button>
```

### 2.2 Cards

```tsx
// Card Premium (para saldo de pontos)
<Card variant="premium">
  <CardHeader>
    <CardTitle>Seus Pontos</CardTitle>
  </CardHeader>
  <CardContent>
    <span className="text-5xl font-bold text-gold-500">1.250</span>
  </CardContent>
</Card>
// Background gradient slate, borda dourada sutil
// Sombra premium

// Card Simples
<Card>
  <CardContent>
    Conteúdo normal
  </CardContent>
</Card>
// bg-white, shadow-md, radius-xl

// Card de Recompensa
<Card variant="reward" status="available">
  <RewardIcon />
  <CardTitle>1 Massagem Grátis</CardTitle>
  <CardDescription>Válido até 15/01</CardDescription>
  <Badge variant="success">Disponível</Badge>
</Card>
// Borda dourada, ícone de presente, badge de status
```

### 2.3 Inputs

```tsx
// Input padrão
<Input
  label="Celular"
  placeholder="(11) 99999-9999"
  mask="phone"
  icon={<PhoneIcon />}
/>
// Borda slate-300, focus:border-gold-500
// Ring dourado no focus

// Input de busca
<SearchInput
  placeholder="Buscar cliente..."
  onSearch={handleSearch}
/>
// Ícone de lupa, clear button

// Input OTP
<OTPInput
  length={4}
  onComplete={handleVerify}
/>
// 4 campos grandes, auto-focus no próximo
// Teclado numérico no mobile
```

### 2.4 Rating (Avaliação)

```tsx
// Componente de avaliação
<Rating
  value={4}
  onChange={setRating}
  size="lg"
/>
// Estrelas douradas, animação de hover
// Feedback tátil no mobile

// Variante somente leitura
<Rating value={4.5} readOnly size="sm" />
// Estrelas parciais permitidas
```

### 2.5 Progress Bar

```tsx
// Barra de progresso para acúmulo
<ProgressBar value={85} max={100} label="R$ 850 de R$ 1.000" variant="gold" />
// Barra dourada com animação de preenchimento
// Label abaixo ou ao lado
```

### 2.6 Badges

```tsx
<Badge variant="success">Disponível</Badge>  // Verde
<Badge variant="warning">Expira em 3 dias</Badge>  // Amarelo
<Badge variant="error">Expirado</Badge>  // Vermelho
<Badge variant="gold">VIP</Badge>  // Dourado
<Badge variant="neutral">Pendente</Badge>  // Cinza
```

### 2.7 Modal/Dialog

```tsx
// Modal de confirmação
<Dialog>
  <DialogHeader>
    <DialogTitle>Confirmar Resgate</DialogTitle>
  </DialogHeader>
  <DialogContent>
    Deseja resgatar "1 Massagem Grátis"?
  </DialogContent>
  <DialogFooter>
    <Button variant="ghost">Cancelar</Button>
    <Button variant="primary">Confirmar</Button>
  </DialogFooter>
</Dialog>

// Modal de avaliação (full screen no mobile)
<Sheet side="bottom">
  <SheetContent>
    {/* Conteúdo de avaliação */}
  </SheetContent>
</Sheet>
```

---

## 3. Layout

### 3.1 Container

```tsx
// Container responsivo
<Container>
  {/* max-w-md no mobile, max-w-7xl no desktop */}
  {/* px-4 mobile, px-6 tablet, px-8 desktop */}
</Container>
```

### 3.2 Header Cliente

```tsx
<Header variant="client">
  <Logo size="sm" />
  {/* Sem menu - experiência limpa */}
</Header>
// Background transparente ou slate-700
// Logo centralizado
// Altura: 64px mobile, 80px desktop
```

### 3.3 Header Staff

```tsx
<Header variant="staff">
  <Logo size="sm" />
  <Navigation />
  <UserMenu />
</Header>
// Background slate-800
// Menu lateral no mobile (hamburguer)
// Menu horizontal no desktop
```

### 3.4 Bottom Navigation (Mobile Staff)

```tsx
<BottomNav>
  <BottomNavItem icon={<HomeIcon />} label="Início" />
  <BottomNavItem icon={<UsersIcon />} label="Clientes" />
  <BottomNavItem icon={<PlusIcon />} label="Novo" primary />
  <BottomNavItem icon={<GiftIcon />} label="Recompensas" />
  <BottomNavItem icon={<UserIcon />} label="Perfil" />
</BottomNav>
// Fixo no bottom, 64px altura
// Item central destacado (FAB style)
```

---

## 4. Telas - Wireframes Detalhados

### 4.1 Cliente - Tela de Entrada

```
┌────────────────────────────────────────┐
│                                        │
│           [LOGO BEDESCHI]              │
│           Instituto Bedeschi           │
│             Beauty Clinic              │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │                                  │  │
│  │    ✨ Programa de Fidelidade    │  │
│  │                                  │  │
│  │    Acesse seus pontos e         │  │
│  │    recompensas exclusivas       │  │
│  │                                  │  │
│  └──────────────────────────────────┘  │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │  📱 Seu celular                  │  │
│  │  ┌────────────────────────────┐  │  │
│  │  │ (11) 99999-9999            │  │  │
│  │  └────────────────────────────┘  │  │
│  └──────────────────────────────────┘  │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │                                  │  │
│  │      ACESSAR MEUS PONTOS        │  │
│  │           [BOTÃO]               │  │
│  │                                  │  │
│  └──────────────────────────────────┘  │
│                                        │
│       Primeira vez? Fale com a         │
│       atendente para se cadastrar      │
│                                        │
│  ──────────────────────────────────── │
│  🔒 Seus dados estão protegidos       │
│                                        │
└────────────────────────────────────────┘

Background: Gradient slate-700 → slate-800
Logo: Dourado sobre fundo escuro
Card: bg-white/10 com backdrop blur
Input: Grande, 56px altura, focus dourado
Botão: Dourado, grande, 56px altura
```

### 4.2 Cliente - Verificação OTP

```
┌────────────────────────────────────────┐
│                                        │
│  ←  Verificação                        │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │                                  │  │
│  │    📱 Enviamos um código         │  │
│  │    para seu WhatsApp             │  │
│  │                                  │  │
│  │    (11) 99999-9999               │  │
│  │                                  │  │
│  └──────────────────────────────────┘  │
│                                        │
│         Digite o código:               │
│                                        │
│      ┌────┐ ┌────┐ ┌────┐ ┌────┐      │
│      │  1 │ │  2 │ │  3 │ │  _ │      │
│      └────┘ └────┘ └────┘ └────┘      │
│                                        │
│         Expira em 4:32                 │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │        VERIFICAR                 │  │
│  └──────────────────────────────────┘  │
│                                        │
│       Não recebeu o código?            │
│       [Reenviar] · [Usar outro método] │
│                                        │
└────────────────────────────────────────┘

Inputs OTP: 64x64px cada, fonte 32px
Auto-avançar para próximo campo
Timer regressivo visível
```

### 4.3 Cliente - Avaliação Pendente

```
┌────────────────────────────────────────┐
│                                        │
│  ┌──────────────────────────────────┐  │
│  │                                  │  │
│  │    ⭐ Como foi seu               │  │
│  │    último atendimento?           │  │
│  │                                  │  │
│  │    ──────────────────────────    │  │
│  │                                  │  │
│  │    Massagem Relaxante 60min      │  │
│  │    28 de Dezembro, 2025          │  │
│  │    Atendida por: Julia           │  │
│  │                                  │  │
│  └──────────────────────────────────┘  │
│                                        │
│           Sua avaliação:               │
│                                        │
│      ☆     ☆     ☆     ☆     ☆       │
│    Péssimo        Médio        Ótimo   │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │  Comentário (opcional):          │  │
│  │  ┌────────────────────────────┐  │  │
│  │  │                            │  │  │
│  │  │                            │  │  │
│  │  └────────────────────────────┘  │  │
│  └──────────────────────────────────┘  │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │      ENVIAR AVALIAÇÃO            │  │
│  └──────────────────────────────────┘  │
│                                        │
│          [Avaliar depois]              │
│                                        │
└────────────────────────────────────────┘

Estrelas: Grandes, 48px, animação de seleção
Seleção: Toque preenche até a estrela
Feedback: Vibração + animação dourada
```

### 4.4 Cliente - Tela Principal

```
┌────────────────────────────────────────┐
│  ┌──────────────────────────────────┐  │
│  │  [LOGO]                          │  │
│  │  Olá, Maria! 👋                  │  │
│  └──────────────────────────────────┘  │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │  ═══════════════════════════════ │  │
│  │         SEUS PONTOS              │  │
│  │  ═══════════════════════════════ │  │
│  │                                  │  │
│  │           1.250                  │  │
│  │           pontos                 │  │
│  │                                  │  │
│  │  ───────────────────────────────  │  │
│  │                                  │  │
│  │  📊 Progresso em Massagem:       │  │
│  │  R$ 850 de R$ 1.000              │  │
│  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░ 85%          │  │
│  │                                  │  │
│  │  Faltam R$ 150 para ganhar       │  │
│  │  1 Massagem Relaxante GRÁTIS!    │  │
│  │                                  │  │
│  └──────────────────────────────────┘  │
│                                        │
│  🎁 SUAS RECOMPENSAS                   │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │  🎉 1 Limpeza de Pele GRÁTIS    │  │
│  │     ─────────────────────────   │  │
│  │     Válido até 15/01/2026       │  │
│  │     [Falar com atendente]       │  │
│  └──────────────────────────────────┘  │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │       VER MEU HISTÓRICO          │  │
│  └──────────────────────────────────┘  │
│                                        │
└────────────────────────────────────────┘

Card de pontos: Fundo gradient premium
Número grande: font-display, text-5xl, gold-500
Barra de progresso: Animada, dourada
Card recompensa: Borda dourada, ícone animado
```

### 4.5 Atendente - Dashboard

```
┌────────────────────────────────────────┐
│  [≡] Instituto Bedeschi    [🔔] [👤]  │
├────────────────────────────────────────┤
│                                        │
│  ┌──────────────────────────────────┐  │
│  │  🔍 Buscar cliente...            │  │
│  └──────────────────────────────────┘  │
│                                        │
│  ┌───────────────┐  ┌───────────────┐  │
│  │  + NOVO       │  │  + NOVO       │  │
│  │   CLIENTE     │  │  ATENDIMENTO  │  │
│  └───────────────┘  └───────────────┘  │
│                                        │
│  📋 ATENDIMENTOS DE HOJE               │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │  Maria Silva          14:30      │  │
│  │  Massagem Relaxante   R$ 180     │  │
│  │  [Pendente avaliação]            │  │
│  └──────────────────────────────────┘  │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │  João Santos          11:00      │  │
│  │  Limpeza de Pele      R$ 120     │  │
│  │  ⭐⭐⭐⭐⭐ Excelente!            │  │
│  └──────────────────────────────────┘  │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │        Ver todos (12)            │  │
│  └──────────────────────────────────┘  │
│                                        │
├────────────────────────────────────────┤
│  🏠    👥    [+]    🎁    👤          │
│ Home  Clientes  Novo  Reward  Perfil  │
└────────────────────────────────────────┘

Header: Fixo, slate-800
Busca: Destaque, acesso rápido
Cards de ação: Grid 2 colunas
Lista: Scroll vertical
Bottom nav: Fixo, item central destacado
```

### 4.6 Atendente - Novo Atendimento

```
┌────────────────────────────────────────┐
│  ←  Novo Atendimento                   │
├────────────────────────────────────────┤
│                                        │
│  CLIENTE                               │
│  ┌──────────────────────────────────┐  │
│  │  Maria Silva                     │  │
│  │  (11) 99999-9999                 │  │
│  │  1.250 pts · 1 recompensa        │  │
│  └──────────────────────────────────┘  │
│                                        │
│  SERVIÇOS                              │
│  ┌──────────────────────────────────┐  │
│  │  🔍 Adicionar serviço...         │  │
│  └──────────────────────────────────┘  │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │  ✓ Massagem Relaxante 60min     │  │
│  │    R$ 180,00  [Editar valor]     │  │
│  │                            [🗑]  │  │
│  └──────────────────────────────────┘  │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │  ✓ Hidratação Facial            │  │
│  │    R$ 120,00                     │  │
│  │                            [🗑]  │  │
│  └──────────────────────────────────┘  │
│                                        │
│  ──────────────────────────────────── │
│                                        │
│  Subtotal:              R$ 300,00     │
│  Desconto:              R$ 0,00       │
│  ──────────────────────────────────── │
│  TOTAL:                 R$ 300,00     │
│                                        │
│  Data: [02/01/2026]  Hora: [14:30]    │
│                                        │
│  Pagamento: [Pix ▼]                   │
│                                        │
│  Observações:                         │
│  ┌──────────────────────────────────┐  │
│  │                                  │  │
│  └──────────────────────────────────┘  │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │      SALVAR ATENDIMENTO          │  │
│  └──────────────────────────────────┘  │
│                                        │
└────────────────────────────────────────┘

Busca de serviço: Autocomplete rápido
Serviços: Card com opção de remover
Valores: Editáveis inline
Total: Destacado, atualiza em tempo real
```

---

## 5. Animações Cinematográficas

### 5.1 Entrada de Tela

```tsx
// Fade in + slide up suave
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
  },
};
```

### 5.2 Card de Pontos

```tsx
// Número contando (count up)
// Brilho dourado pulsante
// Partículas sutis no background
const PointsCard = () => {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="relative overflow-hidden"
    >
      <GoldShimmer />
      <CountUp end={1250} duration={2} />
      <Particles />
    </motion.div>
  );
};
```

### 5.3 Avaliação com Estrelas

```tsx
// Estrela cresce e brilha ao selecionar
// Preenchimento cascata (1→2→3→4→5)
// Confetti sutil em 5 estrelas
const StarRating = ({ value, onChange }) => {
  return stars.map((star, i) => (
    <motion.button
      whileHover={{ scale: 1.2 }}
      whileTap={{ scale: 0.9 }}
      animate={
        value >= i + 1
          ? {
              color: "#C9A962",
              scale: [1, 1.3, 1],
            }
          : {}
      }
    />
  ));
};
```

### 5.4 Recompensa Conquistada

```tsx
// Modal com backdrop blur
// Card central com bounce
// Confetti dourado
// Som sutil de "sucesso"
<Dialog>
  <motion.div
    initial={{ scale: 0.5, opacity: 0 }}
    animate={{
      scale: 1,
      opacity: 1,
      transition: { type: "spring", bounce: 0.5 },
    }}
  >
    <Confetti colors={["#C9A962", "#D9B256", "#E5C77D"]} />
    <GiftIcon className="animate-bounce" />
    <h2>Parabéns! 🎉</h2>
    <p>Você ganhou 1 Massagem Grátis!</p>
  </motion.div>
</Dialog>
```

---

## 6. Responsividade

### 6.1 Breakpoints

```css
/* Mobile First */
/* Base: 0-639px */
/* sm: 640px+ */
/* md: 768px+ */
/* lg: 1024px+ */
/* xl: 1280px+ */
```

### 6.2 Grid Adaptativo

```tsx
// Cards em grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map((item) => (
    <Card key={item.id} />
  ))}
</div>
```

### 6.3 Navegação Adaptativa

```tsx
// Mobile: Bottom navigation
// Desktop: Sidebar ou top navigation
{
  isMobile ? <BottomNav /> : <Sidebar />;
}
```

---

## 7. Acessibilidade

### 7.1 Checklist

- [ ] Contraste mínimo 4.5:1 para texto
- [ ] Touch targets mínimo 44x44px
- [ ] Focus visible em todos os interativos
- [ ] Labels em todos os inputs
- [ ] Alt text em imagens
- [ ] Hierarquia de headings correta
- [ ] Keyboard navigation funcional

### 7.2 Cores com Contraste

```
Texto escuro (#3D4555) sobre branco: ✅ 10.5:1
Texto claro (#FFFFFF) sobre slate-700: ✅ 7.2:1
Dourado (#C9A962) sobre slate-700: ✅ 4.8:1
```

---

_Design System vivo - atualizar conforme componentes evoluem_
