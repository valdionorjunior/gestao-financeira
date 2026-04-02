# Financial Management Frontend (New)

Frontend moderno para o sistema de gestão financeira pessoal/familiar, inspirado no design Adminto com temas Light e Dark.

## 🎨 Features

- ✅ **Tema Light & Dark** - Alternância de temas com localStorage
- ✅ **Dashboard Completo** - KPI cards, gráficos de fluxo de caixa
- ✅ **Gestão de Transações** - CRUD com tabelas e filtros
- ✅ **Gestão de Contas** - Visualize todas as suas contas
- ✅ **Categorias** - Organize suas transações por categoria
- ✅ **Orçamentos** - Defina e acompanhe orçamentos
- ✅ **Metas Financeiras** - Acompanhe suas metas de poupança
- ✅ **Relatórios** - Gráficos e análises detalhadas
- ✅ **IA Insights** - Recomendações inteligentes (mock)
- ✅ **Responsive** - Mobile → Tablet → Desktop
- ✅ **Autenticação** - JWT com localStorage

## 🚀 Stack Tecnológico

```
Frontend:
├── React 19.2 + TypeScript
├── React Router 7 (navegação)
├── Zustand (state management)
├── Tailwind CSS v4 (styling)
├── Recharts (gráficos)
├── React Hook Form + Zod (validação)
├── Axios (HTTP client)
└── Lucide React (ícones)

Backend: NestJS + PostgreSQL (conectar via API)
```

## 📁 Estrutura do Projeto

```
src/
├── App.tsx                 # App principal com rotas
├── main.tsx               # Entry point
├── index.css              # Estilos globais + Tailwind
├── app/
│   ├── components/        # Componentes reutilizáveis
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   ├── ThemeToggle.tsx
│   │   ├── Layout.tsx
│   │   ├── KPICard.tsx
│   │   ├── DataTable.tsx
│   │   └── Chart.tsx
│   ├── pages/             # Páginas da aplicação
│   │   ├── DashboardPage.tsx
│   │   ├── TransactionsPage.tsx
│   │   ├── AccountsPage.tsx
│   │   ├── CategoriesPage.tsx
│   │   ├── BudgetsPage.tsx
│   │   ├── GoalsPage.tsx
│   │   ├── ReportsPage.tsx
│   │   └── AIPage.tsx
│   ├── stores/            # Zustand stores
│   │   ├── themeStore.ts
│   │   └── auth.store.ts
│   ├── services/          # API client
│   │   └── api.ts
│   └── utils/             # Utilidades
│       ├── cn.ts          # Tailwind merge
│       └── formatters.ts  # Formatação (moeda, data, etc)
```

## 🎯 Páginas Implementadas

### Dashboard
- 4 KPI Cards (Saldo, Renda, Despesa, Taxa de Poupança)
- Gráfico de Fluxo de Caixa (Renda vs Despesa)
- Transações recentes

### Transações
- Tabela com transações
- Filtros por categoria/data
- Botão "Nova Transação"

### Contas
- Lista de contas bancárias
- Saldos em tempo real
- Status da conta

### Categorias
- Grid de categorias
- Contador de transações por categoria
- Cores personalizadas

### Orçamentos
- Progresso visual com barras
- Percentual gasto
- Meta e gasto atual

### Metas
- Progresso de metas financeiras
- Data limite
- Percentual concluído

### Relatórios
- Gráfico de Pizza (distribuição de despesas)
- Gráfico de Linha (tendência receita vs despesa)

### IA Insights
- Recomendações inteligentes (mock)
- Alertas de economia
- Padrões de gasto

## 🔧 Configuração & Setup

### Pré-requisitos
- Node.js 20+
- npm ou yarn

### Instalação

```bash
# Navegar para a pasta do projeto
cd financial-management-frontend-new

# Instalar dependências
npm install

# Variáveis de ambiente
cp .env.example .env
# Editar .env com URL do backend
```

### Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build

# Testar build local
npm run preview
```

## 🔗 Integração com Backend

### URL da API
```
Backend: http://localhost:3000/api/v1
```

### Endpoints Esperados

```
GET    /api/v1/auth/me           # Perfil do usuário
POST   /api/v1/auth/login        # Login
GET    /api/v1/transactions      # Listar transações
POST   /api/v1/transactions      # Criar transação
GET    /api/v1/accounts          # Listar contas
GET    /api/v1/categories        # Listar categorias
GET    /api/v1/budgets           # Listar orçamentos
GET    /api/v1/goals             # Listar metas
```

### Autenticação
- JWT Token via localStorage
- Header: `Authorization: Bearer {token}`
- Mock login integrado para testes

## 🎨 Sistema de Temas

### Dark Mode
- Ativado via botão na sidebar
- Persiste em localStorage
- Cores WCAG AA compliant

### Light Mode
- Branco/Cinzas claros
- Cores azuis/vermelhas para destaques

```tsx
// Usar tema em componentes
import { useThemeStore } from '@stores/themeStore'

const isDark = useThemeStore((s) => s.isDark)
// Aplicar: className={isDark ? 'dark:...' : '...'}
```

## 📊 Componentes Principais

### KPICard
```tsx
<KPICard
  title="Saldo Total"
  value={12500.50}
  icon={DollarSign}
  variant="primary"
  trend={{ value: 8.5, direction: 'up' }}
/>
```

### DataTable
Tabela reutilizável com paginação

### Chart
Wrapper para Recharts com temas dark/light

## 🚀 Próximas Etapas

1. **Conectar ao Backend Real**
   - Implementar chamadas de API em `services/api.ts`
   - Remover dados mock
   
2. **Autenticação Real**
   - Integrar com JWT do backend
   - Implementar refresh token
   
3. **Formulários**
   - Criar modais de criação/edição
   - Validação com React Hook Form + Zod
   
4. **Testes**
   - Testes unitários com Vitest
   - E2E com Playwright
   
5. **Otimização**
   - React Query/SWR para cache
   - Code splitting com Lazy Load
   - PWA (Progressive Web App)

## 📦 Build & Deploy

```bash
# Build para produção
npm run build

# Verificar bundle
npm run preview

# Docker
docker build -t financial-app-new .
docker run -p 80:5173 financial-app-new
```

## 🔐 Segurança

- ✅ HTTPS em produção
- ✅ Token JWT com expiration
- ✅ CORS configurado
- ✅ Validação de entrada (Zod)
- ✅ XSS Protection (React escapa HTML)
- ✅ Rate limiting (backend)

## 📝 Licença

Proprietary - Gestão Financeira Pessoal/Familiar

---

**Status:** ✅ Pronto para Desenvolvimento

Projeto criado com foco em UX/UI moderna, inspirado em templates profissionais como Adminto, com stack atual e best practices de React 19.
