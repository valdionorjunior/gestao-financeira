# Financial Management Frontend - React + Vite

Frontend moderno para aplicação de gestão financeira pessoal/familiar com React 19, Vite, TypeScript e Tailwind CSS v4.

## 🚀 Tecnologias

- **React 19** - UI Library
- **Vite** - Build tool
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling
- **React Router** - Navigation
- **Zustand** - State management
- **Recharts** - Data visualization
- **React Hook Form** - Form management
- **Axios** - HTTP client
- **Lucide React** - Icons

## 📋 Requisitos

- Node.js 18+
- npm ou yarn

## 🔧 Instalação

```bash
# Clonar repositório
git clone <repo-url>
cd financial-management-frontend-new

# Instalar dependências
npm install

# Copiar arquivo de ambiente
cp .env.example .env
```

## 👨‍💻 Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Abrir http://localhost:5173
```

## 🏗️ Build

```bash
# Gerar build de produção
npm run build

# Preview da build
npm run preview
```

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── components/          # Componentes reutilizáveis
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   ├── KPICard.tsx
│   │   ├── DataTable.tsx
│   │   ├── Chart.tsx
│   │   └── Layout.tsx
│   ├── pages/              # Páginas da aplicação
│   │   ├── DashboardPage.tsx
│   │   ├── TransactionsPage.tsx
│   │   ├── AccountsPage.tsx
│   │   ├── CategoriesPage.tsx
│   │   ├── BudgetsPage.tsx
│   │   ├── GoalsPage.tsx
│   │   ├── ReportsPage.tsx
│   │   └── AIPage.tsx
│   ├── services/           # Integração com API
│   │   └── api.ts
│   ├── stores/             # Zustand stores
│   │   ├── theme.store.ts
│   │   └── auth.store.ts
│   ├── types/              # Tipos TypeScript
│   │   └── index.ts
│   ├── utils/              # Utilitários
│   │   └── index.ts
│   └── hooks/              # React hooks customizados
├── App.tsx                 # Componente principal
├── main.tsx                # Entry point
└── index.css               # Estilos globais
```

## 🎨 Componentes

### KPICard
Card financeiro com indicadores de tendência.

```tsx
<KPICard
  title="Saldo Total"
  value={5000}
  variant="default"
  trend={{ percentage: 12.5, direction: 'up', period: 'vs mês anterior' }}
  icon={Wallet}
/>
```

### DataTable
Tabela reutilizável com paginação.

```tsx
<DataTable
  columns={columns}
  data={transactions}
  pageSize={10}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

### Chart
Gráficos com Recharts (line, bar, pie).

```tsx
<Chart
  title="Receita vs Despesa"
  data={chartData}
  type="bar"
  dataKey={['income', 'expense']}
/>
```

## 🎯 Funcionalidades

- ✅ Dashboard com KPIs e gráficos
- ✅ Gerenciamento de transações
- ✅ Gerenciamento de contas
- ✅ Categorias de despesas
- ✅ Orçamentos e metas
- ✅ Relatórios e análises
- ✅ Insights com IA
- ✅ Tema claro/escuro
- ✅ Design responsivo

## 🔐 Autenticação

A aplicação utiliza JWT (access token + refresh token) com Zustand para gerenciar o estado de autenticação.

```tsx
const { user, isAuthenticated, token, setUser, logout } = useAuthStore()
```

## 🌙 Tema

Tema claro/escuro gerenciado com Zustand e localStorage.

```tsx
const { theme, toggleTheme } = useThemeStore()
```

## 📡 API Integration

Cliente HTTP pre-configurado com Axios e interceptadores.

```tsx
import { apiClient } from '@services/api'

// Exemplos
const accounts = await apiClient.getAccounts()
const transactions = await apiClient.getTransactions({ filters })
await apiClient.createTransaction(data)
```

## 📱 Responsividade

Layout totalmente responsivo:
- Mobile (< 768px)
- Tablet (768px - 1024px)
- Desktop (> 1024px)

## 🧪 Testes

```bash
# Executar testes unitários
npm run test

# UI de testes
npm run test:ui

# E2E com Playwright
npm run e2e
```

## 🐳 Docker

```bash
# Build da imagem
docker build -t financial-frontend .

# Executar container
docker run -p 3000:3000 financial-frontend
```

## 📦 Variáveis de Ambiente

```env
VITE_API_URL=http://localhost:3000/api/v1
```

## 📝 Licença

MIT

## 👥 Contribuição

Contribuições são bem-vindas! Abra uma PR com suas melhorias.

---

**Desenvolvido com ❤️ para gestão financeira moderna**
