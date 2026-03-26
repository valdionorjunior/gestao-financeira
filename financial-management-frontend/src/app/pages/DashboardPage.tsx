import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Wallet, TrendingUp, TrendingDown, DollarSign, AlertTriangle } from 'lucide-react';
import { reportsService, aiService } from '../services/finance.service';
import { StatCard } from '../components/StatCard';

const fmtBRL = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export default function DashboardPage() {
  const { data: summary, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: reportsService.dashboard });
  const { data: cashFlow }           = useQuery({ queryKey: ['cashflow'], queryFn: () => reportsService.cashFlow({}) });
  const { data: insights }           = useQuery({ queryKey: ['insights'], queryFn: aiService.insights });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-slate-400">Carregando...</div>;
  }

  const chartData = cashFlow?.cashFlow?.map((m: any) => ({
    name: `${String(m.month).padStart(2, '0')}/${String(m.year).slice(2)}`,
    Receitas: m.income,
    Despesas: m.expense,
  })) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Visão geral de {summary?.month}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Saldo Total"
          value={fmtBRL(summary?.totalBalance ?? 0)}
          icon={<Wallet className="w-6 h-6" />}
          colorClass="bg-gradient-to-r from-cyan-500 to-blue-500"
        />
        <StatCard
          title="Receitas do Mês"
          value={fmtBRL(summary?.monthlyIncome ?? 0)}
          icon={<TrendingUp className="w-6 h-6" />}
          colorClass="bg-gradient-to-r from-emerald-500 to-green-500"
        />
        <StatCard
          title="Despesas do Mês"
          value={fmtBRL(summary?.monthlyExpense ?? 0)}
          icon={<TrendingDown className="w-6 h-6" />}
          colorClass="bg-gradient-to-r from-red-400 to-rose-500"
        />
        <StatCard
          title="Saldo do Mês"
          value={fmtBRL(summary?.netBalance ?? 0)}
          icon={<DollarSign className="w-6 h-6" />}
          colorClass={(summary?.netBalance ?? 0) >= 0 ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : 'bg-gradient-to-r from-orange-400 to-red-500'}
        />
      </div>

      {/* Cash Flow Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Fluxo de Caixa — Últimos 6 meses</h2>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="income" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="expense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: any) => fmtBRL(Number(v))} />
              <Legend />
              <Area type="monotone" dataKey="Receitas" stroke="#10b981" fill="url(#income)" strokeWidth={2} />
              <Area type="monotone" dataKey="Despesas" stroke="#ef4444" fill="url(#expense)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Budget Alerts + AI Insights */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Budget Alerts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-semibold text-gray-700">Alertas de Orçamento</h2>
          </div>
          {(summary?.budgetAlerts?.length ?? 0) === 0 ? (
            <p className="text-sm text-gray-400">Nenhum alerta ativo. 🎉</p>
          ) : (
            <ul className="space-y-3">
              {summary?.budgetAlerts.map((alert: any) => (
                <li key={alert.id} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${alert.percentUsed >= 100 ? 'bg-red-500' : 'bg-amber-400'}`}
                        style={{ width: `${Math.min(alert.percentUsed, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{alert.percentUsed.toFixed(1)}% utilizado</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* AI Insights */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-700 mb-4">💡 Insights de IA</h2>
          {!insights || insights.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhum insight disponível ainda.</p>
          ) : (
            <ul className="space-y-3">
              {insights.map((insight: any, i: number) => (
                <li key={i} className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-sm font-semibold text-blue-800">{insight.title}</p>
                  <p className="text-xs text-blue-600 mt-1">{insight.message}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
