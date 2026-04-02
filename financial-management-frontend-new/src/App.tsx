import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './app/stores/auth.store'
import { Layout } from './app/components/Layout'
import { DashboardPage } from './app/pages/DashboardPage'
import { TransactionsPage } from './app/pages/TransactionsPage'
import { AccountsPage } from './app/pages/AccountsPage'
import { CategoriesPage } from './app/pages/CategoriesPage'
import { BudgetsPage } from './app/pages/BudgetsPage'
import { GoalsPage } from './app/pages/GoalsPage'
import { ReportsPage } from './app/pages/ReportsPage'
import { AIPage } from './app/pages/AIPage'
import type { AuthStore } from './app/stores/auth.store'

function App() {
  const isAuthenticated = useAuthStore((state: AuthStore) => state.isAuthenticated)
  const setLoading = useAuthStore((state: AuthStore) => state.setLoading)

  useEffect(() => {
    // Simular verificação de autenticação
    setTimeout(() => {
      setLoading(false)
    }, 1000)
  }, [setLoading])

  // Se não autenticado, redireciona para login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">Finanças</h1>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              // Mock login
              useAuthStore.setState({
                isAuthenticated: true,
                user: {
                  id: '1',
                  email: 'user@example.com',
                  name: 'João Silva',
                  role: 'TITULAR',
                },
                token: 'mock-token-123',
              })
            }}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  defaultValue="user@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  defaultValue="password"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
              >
                Entrar
              </button>
            </div>
          </form>

          <p className="text-center text-gray-600 text-sm mt-4">
            Demonstração - Clique em "Entrar" para acessar o dashboard
          </p>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Layout>
              <DashboardPage />
            </Layout>
          }
        />
        <Route
          path="/transactions"
          element={
            <Layout>
              <TransactionsPage />
            </Layout>
          }
        />
        <Route
          path="/accounts"
          element={
            <Layout>
              <AccountsPage />
            </Layout>
          }
        />
        <Route
          path="/categories"
          element={
            <Layout>
              <CategoriesPage />
            </Layout>
          }
        />
        <Route
          path="/budgets"
          element={
            <Layout>
              <BudgetsPage />
            </Layout>
          }
        />
        <Route
          path="/goals"
          element={
            <Layout>
              <GoalsPage />
            </Layout>
          }
        />
        <Route
          path="/reports"
          element={
            <Layout>
              <ReportsPage />
            </Layout>
          }
        />
        <Route
          path="/ai"
          element={
            <Layout>
              <AIPage />
            </Layout>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
