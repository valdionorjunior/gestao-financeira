---
mode: agent
description: "Cria o projeto financial-management-frontend-angular com Angular 19+, PrimeNG 19+, Tailwind CSS v4, tema duplo claro/escuro e integração com o backend NestJS existente."
tools: [read, edit, search, execute, todo]
---

Crie o projeto `financial-management-frontend-angular` dentro da pasta `gestao-financeira/`, no mesmo nível do `financial-management-backend`. Use o Angular CLI para inicializar:

```
ng new financial-management-frontend-angular --routing --style=css --standalone
```

---

## Stack Obrigatória

| Tecnologia | Versão |
|---|---|
| Angular | 19+ (Standalone Components) |
| PrimeNG | 19+ (Tema Aura com Tailwind Preset) |
| Tailwind CSS | v4 via `@tailwindcss/vite` |
| TypeScript | 5.x strict mode |
| PrimeIcons | latest |
| Chart.js + ng2-charts | para gráficos (ou PrimeNG Charts) |
| ngx-translate | internacionalização pt-BR |

---

## Design System — Tema Duplo (Claro + Escuro)

Configure o `providePrimeNG` com tema Aura e suporte a `darkModeSelector: 'class'`, alternável por botão na navbar.

### Paleta de Cores CSS Custom Properties

```css
/* styles.css */
@import "tailwindcss";
@import "primeicons/primeicons.css";

:root {
  /* Light Mode */
  --color-bg:          #F4F6FA;
  --color-surface:     #FFFFFF;
  --color-border:      #E2E8F0;
  --color-text:        #1A202C;
  --color-text-muted:  #64748B;
  --color-primary:     #635BFF;
  --color-accent:      #00E5E5;
  --color-success:     #22C55E;
  --color-danger:      #EF4444;
  --color-warning:     #F59E0B;
  --color-shadow:      rgba(99, 91, 255, 0.10);
}

.dark {
  /* Dark Mode */
  --color-bg:          #101214;
  --color-surface:     #1C1F22;
  --color-border:      #2D3139;
  --color-text:        #FFFFFF;
  --color-text-muted:  #8892A4;
  --color-primary:     #635BFF;
  --color-accent:      #00E5E5;
  --color-success:     #22C55E;
  --color-danger:      #EF4444;
  --color-warning:     #F59E0B;
  --color-shadow:      rgba(0, 229, 229, 0.08);
}
```

### Tipografia e Espaçamento
- Font: `Inter` (Google Fonts via `@import`)
- Heading: `font-bold tracking-tight`
- Body: `text-sm leading-relaxed`
- Border radius padrão: `rounded-xl` (12px) para cards, `rounded-lg` (8px) para inputs/botões
- Padding de cards: `p-6`
- Espaçamento entre seções: `gap-6`

---

## Arquitetura Angular — Estrutura de Pastas

```
src/
├── app/
│   ├── core/
│   │   ├── guards/          # auth.guard.ts, role.guard.ts
│   │   ├── interceptors/    # jwt.interceptor.ts, error.interceptor.ts
│   │   ├── services/        # auth.service.ts, api.service.ts
│   │   └── models/          # interfaces TypeScript (User, Account, Transaction…)
│   ├── shared/
│   │   ├── components/      # AppSidebar, AppNavbar, StatCard, ConfirmDialog
│   │   ├── pipes/           # currency-brl.pipe.ts, transaction-type.pipe.ts
│   │   └── directives/      # theme-toggle.directive.ts
│   ├── features/
│   │   ├── auth/            # login, register (rotas públicas)
│   │   ├── dashboard/
│   │   ├── transactions/
│   │   ├── accounts/
│   │   ├── categories/
│   │   ├── budgets/
│   │   ├── goals/
│   │   ├── reports/
│   │   ├── bank-statements/
│   │   └── ai/
│   ├── app.routes.ts        # lazy loading por feature
│   ├── app.config.ts        # provideRouter, provideHttpClient, providePrimeNG
│   └── app.component.ts
└── assets/
    └── i18n/pt-BR.json
```

---

## Integração PrimeNG + Tailwind

**`app.config.ts`:**
```typescript
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([jwtInterceptor, errorInterceptor])),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: { preset: Aura, options: { darkModeSelector: '.dark', cssLayer: false } },
      ripple: true,
    }),
  ],
};
```

**Estratégia Pass-through (PT) — injetar Tailwind no PrimeNG:**
```html
<!-- Botão primário com classes Tailwind via PT -->
<p-button
  label="Salvar"
  [pt]="{ root: { class: 'bg-[#635BFF] hover:bg-[#4f46e5] text-white rounded-lg px-5 py-2.5 font-semibold transition-all duration-200 shadow-md hover:shadow-[#635BFF]/30' } }"
/>
```

---

## Páginas a Implementar

### 1. Login (`/login`) e Registro (`/register`)
- Card centralizado, fullscreen gradient background
- Logo + nome do app no topo
- Inputs do PrimeNG (`p-inputtext`, `p-password`) com validação reativa (`ReactiveFormsModule`)
- Botão com loading spinner durante requisição
- Link para alternar entre login/registro
- Mensagem de erro com `p-message severity="error"`

### 2. Layout Principal (AppShell)
- **Sidebar** colapsável (64px ↔ 256px) com transição suave
  - Logo no topo
  - Menu com `p-panelmenu` ou links com ícones PrimeIcons
  - Avatar + nome do usuário no footer
  - Botão de logout
- **Topbar** com:
  - Breadcrumb da página atual
  - Toggle Claro/Escuro (ícone `pi-sun` / `pi-moon`)
  - Notificações (badge)
  - Avatar com dropdown (perfil, sair)

### 3. Dashboard (`/dashboard`)
- 4 **StatCards** com gradiente na borda esquerda (animados com `@keyframes fadeInUp`):
  - Saldo Total
  - Receitas do Mês (verde)
  - Despesas do Mês (vermelho)
  - Saldo Líquido (azul/verde/vermelho conforme valor)
- **Gráfico de Área** (PrimeNG Chart / Chart.js): Fluxo de caixa 6 meses
- **Alertas de Orçamento** com `p-progressbar`
- **Insights de IA** em cards com ícone `pi-lightbulb`

### 4. Transações (`/transactions`)
- **`p-table`** com paginação, ordenação e filtro por tipo/período
- Badges coloridos por tipo (Receita=verde, Despesa=vermelho, Transferência=azul)
- `p-tag` para status
- Ações com `p-confirmDialog`
- Botão **Nova Transação** abre `p-dialog` com formulário reativo:
  - `p-select` (tipo, conta, categoria)
  - `p-inputnumber` com locale `pt-BR`
  - `p-datepicker` para data

### 5. Contas (`/accounts`)
- Cards em grid com barra colorida dinâmica
- Saldo formatado em BRL
- `p-dialog` para criar/editar com `p-colorpicker`

### 6. Categorias (`/categories`)
- Lista agrupada por tipo com `p-accordion`
- Subcategorias em lista aninhada
- Badge de tipo traduzido para PT-BR

### 7. Orçamentos (`/budgets`)
- Cards com `p-progressbar` colorido (verde → amarelo → vermelho)
- Período em PT-BR
- Seletor de categoria, período e valor no formulário

### 8. Metas (`/goals`)
- Cards com `p-knob` ou progress bar circular
- Badge de status em PT-BR
- `p-dialog` para adicionar aporte

### 9. Relatórios (`/reports`)
- Seletor de Mês/Ano no header
- 3 cards de resumo (Receitas, Despesas, Taxa de Poupança)
- Gráfico de Barras: Comparativo mensal
- Gráfico de Pizza/Donut: Despesas por categoria com nomes reais
- Tabela: Orçamentos vs. Gastos

### 10. Extrato Bancário (`/bank-statements`)
- `p-fileupload` com drag & drop para OFX/CSV
- Seletor de conta
- Listagem de extratos importados com status

### 11. IA (`/ai`)
- Insights com chips coloridos por tipo
- Previsão de gastos com valor destacado e histórico
- Formulário de categorização automática

---

## Comunicação com o Backend

Base URL: `http://localhost:3000/api/v1` (via `environment.ts`)

**`jwt.interceptor.ts`** — `HttpInterceptorFn` que:
1. Adiciona `Authorization: Bearer <token>` a todas as requests
2. Em 401, tenta refresh automático via `POST /auth/refresh`
3. Em falha do refresh, limpa localStorage e redireciona para `/login`

**Estado global:** Angular Signals (`signal`, `computed`, `effect`) + `localStorage` para persistir `accessToken`, `refreshToken` e `user`.

**Serviços (padrão `inject(HttpClient)`):**
- `AuthService` — login, register, logout, me
- `AccountsService`, `CategoriesService`, `TransactionsService`
- `BudgetsService`, `GoalsService`
- `ReportsService` — dashboard, monthly(year, month), cashFlow, budgetReport
- `AIService` — insights, predict

---

## Pipes de Tradução (PT-BR)

```typescript
// transaction-type.pipe.ts
const TX_TYPE: Record<string, string> = {
  INCOME: 'Receita', EXPENSE: 'Despesa', TRANSFER: 'Transferência'
};
@Pipe({ name: 'txType', pure: true, standalone: true })
export class TransactionTypePipe implements PipeTransform {
  transform(value: string) { return TX_TYPE[value] ?? value; }
}
```

Criar o mesmo padrão para: status de transação, tipo de conta, período de orçamento, status de meta.

---

## Dockerfile

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration production

FROM nginx:alpine
COPY --from=build /app/dist/financial-management-frontend-angular/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

---

## Constraints de Implementação

- **Standalone Components** em todos os componentes (sem `NgModule`)
- **Lazy loading** em todas as features via `loadComponent` / `loadChildren`
- Acessibilidade: `aria-label` em todos os botões de ícone
- Responsivo: mobile-first com breakpoints `sm:`, `md:`, `lg:`
- **NUNCA** hardcode de credenciais — usar `environment.ts`
- Erros globais com `p-toast` via `MessageService`
- Componente `AppErrorBoundary` para capturar erros de renderização

---

## Ordem de Implementação

Implementar na seguinte sequência, confirmando build limpo após cada etapa:

1. Setup + configuração PrimeNG + Tailwind + tema duplo
2. Auth (Login + Register + Guards + Interceptors)
3. AppShell (Sidebar + Topbar + Layout)
4. Dashboard
5. Transactions
6. Accounts
7. Categories
8. Budgets
9. Goals
10. Reports
11. Bank Statements
12. AI
