import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { ProtectedLayout } from './app/components/ProtectedLayout';
import { ErrorBoundary } from './app/components/ErrorBoundary';
import { ThemeProvider } from './app/components/ThemeProvider';

const LoginPage          = lazy(() => import('./app/pages/LoginPage'));
const RegisterPage       = lazy(() => import('./app/pages/RegisterPage'));
const DashboardPage      = lazy(() => import('./app/pages/DashboardPage'));
const AccountsPage       = lazy(() => import('./app/pages/AccountsPage'));
const CategoriesPage     = lazy(() => import('./app/pages/CategoriesPage'));
const TransactionsPage   = lazy(() => import('./app/pages/TransactionsPage'));
const BudgetsPage        = lazy(() => import('./app/pages/BudgetsPage'));
const GoalsPage          = lazy(() => import('./app/pages/GoalsPage'));
const ReportsPage        = lazy(() => import('./app/pages/ReportsPage'));
const BankStatementsPage = lazy(() => import('./app/pages/BankStatementsPage'));
const AIPage             = lazy(() => import('./app/pages/AIPage'));

const qc = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

const AppLoader = () => (
  <div className="flex items-center justify-center h-screen text-slate-400">Carregando...</div>
);

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={qc}>
        <BrowserRouter>
          <ErrorBoundary>
            <Suspense fallback={<AppLoader />}>
            <Routes>
              <Route path="/login"    element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/" element={<ProtectedLayout><DashboardPage /></ProtectedLayout>} />
              <Route path="/accounts" element={<ProtectedLayout><AccountsPage /></ProtectedLayout>} />
              <Route path="/categories" element={<ProtectedLayout><CategoriesPage /></ProtectedLayout>} />
              <Route path="/transactions" element={<ProtectedLayout><TransactionsPage /></ProtectedLayout>} />
              <Route path="/budgets" element={<ProtectedLayout><BudgetsPage /></ProtectedLayout>} />
              <Route path="/goals" element={<ProtectedLayout><GoalsPage /></ProtectedLayout>} />
              <Route path="/reports" element={<ProtectedLayout><ReportsPage /></ProtectedLayout>} />
              <Route path="/bank-statements" element={<ProtectedLayout><BankStatementsPage /></ProtectedLayout>} />
              <Route path="/ai" element={<ProtectedLayout><AIPage /></ProtectedLayout>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </Suspense>
          </ErrorBoundary>
        </BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
