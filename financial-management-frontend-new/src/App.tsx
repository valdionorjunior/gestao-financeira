import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
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
import { apiClient } from './app/services/api'
import type { AuthStore } from './app/stores/auth.store'

// ─── Rotas autenticadas ────────────────────────────────────────────
function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout><DashboardPage /></Layout>} />
      <Route path="/transactions" element={<Layout><TransactionsPage /></Layout>} />
      <Route path="/accounts" element={<Layout><AccountsPage /></Layout>} />
      <Route path="/categories" element={<Layout><CategoriesPage /></Layout>} />
      <Route path="/budgets" element={<Layout><BudgetsPage /></Layout>} />
      <Route path="/goals" element={<Layout><GoalsPage /></Layout>} />
      <Route path="/reports" element={<Layout><ReportsPage /></Layout>} />
      <Route path="/ai" element={<Layout><AIPage /></Layout>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

// ─── Login Form ────────────────────────────────────────────────────
function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    setLoginLoading(true)
    try {
      const response = await apiClient.login(email, password)
      // Persiste o token no localStorage via action do store
      useAuthStore.getState().setToken(response.accessToken)
      useAuthStore.setState({
        isAuthenticated: true,
        user: response.user,
      })
    } catch (error: any) {
      const msg = error.response?.data?.message
      setLoginError(Array.isArray(msg) ? msg.join(', ') : (msg || 'Erro ao fazer login'))
    } finally {
      setLoginLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Finanças</h1>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                placeholder="email@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            {loginError && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                {loginError}
              </div>
            )}
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loginLoading ? 'Carregando...' : 'Log in'}
            </button>
          </div>
        </form>
        <p className="text-center text-gray-600 text-sm mt-6">
          Faça login com suas credenciais para acessar o dashboard
        </p>
      </div>
    </div>
  )
}

// ─── App Principal ─────────────────────────────────────────────────
function App() {
  const isAuthenticated = useAuthStore((state: AuthStore) => state.isAuthenticated)
  const isLoading = useAuthStore((state: AuthStore) => state.isLoading)
  const setLoading = useAuthStore((state: AuthStore) => state.setLoading)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      apiClient.getCurrentUser()
        .then((user) => {
          useAuthStore.setState({ isAuthenticated: true, user, token })
        })
        .catch(() => {
          localStorage.removeItem('token')
          useAuthStore.setState({ isAuthenticated: false, user: null, token: null })
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [setLoading])

  // BrowserRouter SEMPRE presente para que hooks de rota funcionem
  // (useNavigate no Header, useLocation no Sidebar)
  return (
    <BrowserRouter>
      {isLoading ? (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Carregando...</p>
          </div>
        </div>
      ) : isAuthenticated ? (
        <AppRoutes />
      ) : (
        <LoginPage />
      )}
    </BrowserRouter>
  )
}

export default App
