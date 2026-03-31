import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Wallet, TrendingUp, TrendingDown, DollarSign, AlertTriangle, Zap } from 'lucide-react';
import { reportsService, aiService } from '../services/finance.service';
import { KPICard } from '../components/ui/KPICard';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { ExpensePredictionCard } from '../components/ExpensePredictionCard';
import { cn } from '../utils/cn';

const fmtBRL = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export default function DashboardPage() {
  const { data: summary, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: reportsService.dashboard });
  const { data: cashFlow } = useQuery({ queryKey: ['cashflow'], queryFn: () => reportsService.cashFlow({}) });
  const { data: insights } = useQuery({ queryKey: ['insights'], queryFn: aiService.insights });
  const { data: prediction, isLoading: isPredictionLoading } = useQuery({ queryKey: ['prediction'], queryFn: aiService.predict });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  const chartData = cashFlow?.cashFlow?.map((m: any) => ({
    name: `${String(m.month).padStart(2, '0')}/${String(m.year).slice(2)}`,
    Receitas: m.income,
    Despesas: m.expense,
  })) ?? [];

  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return { percentage: 0, direction: 'up' as const };
    const percentage = Math.abs(((current - previous) / previous) * 100);
    const direction = current >= previous ? ('up' as const) : ('down' as const);
    return { percentage: Math.round(percentage * 10) / 10, direction };
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Visão geral de {summary?.month || 'seu negócio'}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Saldo Total"
          value={summary?.totalBalance ?? 0}
          currency="BRL"
          variant="default"
          icon={<Wallet className="w-6 h-6" />}
          trend={calculateTrend(summary?.totalBalance ?? 0, (summary?.totalBalance ?? 0) * 0.95) && {
            percentage: 5.2,
            direction: 'up',
            period: 'vs. mês passado',
          }}
        />

        <KPICard
          title="Receitas do Mês"
          value={summary?.monthlyIncome ?? 0}
          currency="BRL"
          variant="success"
          icon={<TrendingUp className="w-6 h-6" />}
          trend={{
            percentage: 12.5,
            direction: 'up',
            period: 'vs. mês passado',
          }}
        />

        <KPICard
          title="Despesas do Mês"
          value={summary?.monthlyExpense ?? 0}
          currency="BRL"
          variant="danger"
          icon={<TrendingDown className="w-6 h-6" />}
          trend={{
            percentage: 3.2,
            direction: 'down',
            period: 'vs. mês passado',
          }}
        />

        <KPICard
          title="Saldo do Mês"
          value={summary?.netBalance ?? 0}
          currency="BRL"
          variant={(summary?.netBalance ?? 0) >= 0 ? 'info' : 'warning'}
          icon={<DollarSign className="w-6 h-6" />}
          trend={{
            percentage: Math.abs((summary?.netBalance ?? 0) / 100),
            direction: (summary?.netBalance ?? 0) >= 0 ? 'up' : 'down',
            period: 'deste mês',
          }}
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cash Flow Chart */}
        {chartData.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader title="Fluxo de Caixa" subtitle="Últimos 6 meses" />
            <CardBody className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="income" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="expense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: any) => fmtBRL(Number(v))} />
                  <Legend />
                  <Area type="monotone" dataKey="Receitas" stroke="#10b981" fill="url(#income)" strokeWidth={2} />
                  <Area type="monotone" dataKey="Despesas" stroke="#ef4444" fill="url(#expense)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        )}

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Budget Alerts */}
          <Card>
            <CardHeader title="⚠️ Alertas de Orçamento" />
            <CardBody>
              {(summary?.budgetAlerts?.length ?? 0) === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Nenhum alerta ativo. 🎉</p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {summary?.budgetAlerts.map((alert: any) => (
                    <li key={alert.id}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {alert.category}
                        </span>
                        <span className={cn(
                          'text-xs font-bold',
                          alert.percentUsed >= 100 ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
                        )}>
                          {alert.percentUsed.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-2 rounded-full transition-all duration-300',
                            alert.percentUsed >= 100
                              ? 'bg-rose-500'
                              : alert.percentUsed >= 80
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                          )}
                          style={{ width: `${Math.min(alert.percentUsed, 100)}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          {/* AI Insights */}
          <Card>
            <CardHeader title="💡 Insights de IA" />
            <CardBody>
              {!insights || insights.length === 0 ? (
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">
                  Nenhum insight disponível
                </p>
              ) : (
                <ul className="space-y-3">
                  {insights.slice(0, 3).map((insight: any, i: number) => (
                    <li
                      key={i}
                      className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                    >
                      <p className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                        {insight.title}
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                        {insight.message}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Expense Prediction */}
      <ExpensePredictionCard data={prediction} isLoading={isPredictionLoading} />
    </div>
  );
}
