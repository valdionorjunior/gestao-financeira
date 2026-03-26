import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { reportsService, categoriesService } from '../services/finance.service';

const fmtBRL = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const COLORS = ['#17c1e8','#82d616','#ea0606','#f53939','#344767','#627594','#cb0c9f','#dee2e6'];

const now = new Date();

export default function ReportsPage() {
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data: monthly }    = useQuery({ queryKey: ['monthly-report', year, month], queryFn: () => reportsService.monthly({ year, month }) });
  const { data: cashFlow }   = useQuery({ queryKey: ['cashflow'], queryFn: () => reportsService.cashFlow({}) });
  const { data: budgets }    = useQuery({ queryKey: ['budget-report'], queryFn: reportsService.budgetReport });
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: () => categoriesService.list() });

  // build a quick ID → name map
  const catName = (id: string) => (categories as any[]).find(c => c.id === id)?.name ?? id.slice(0, 8);

  const barData = cashFlow?.cashFlow?.map((m: any) => ({
    name:     `${String(m.month).padStart(2, '0')}/${String(m.year).slice(2)}`,
    Receitas: m.income,
    Despesas: m.expense,
  })) ?? [];

  const pieData = monthly?.expenseByCategory?.slice(0, 6).map((e: any) => ({
    name:  catName(e.categoryId),
    value: e.total,
  })) ?? [];

  const MONTHS = [
    'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
  ];

  return (
    <div className="space-y-6">
      {/* Header with month/year selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Relatórios</h1>
          <p className="text-sm text-gray-500">Análise financeira detalhada</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={month}
            onChange={e => setMonth(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            {[now.getFullYear() - 1, now.getFullYear()].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Monthly summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Receitas',       value: monthly?.income      ?? 0, color: 'text-emerald-600' },
          { label: 'Despesas',       value: monthly?.expense     ?? 0, color: 'text-red-500' },
          { label: 'Taxa de Poupança', value: `${(monthly?.savingsRate ?? 0).toFixed(1)}%`, color: 'text-blue-600' },
        ].map(item => (
          <div key={item.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <p className="text-sm text-gray-500">{item.label}</p>
            <p className={`text-2xl font-bold mt-1 ${item.color}`}>
              {typeof item.value === 'number' ? fmtBRL(item.value) : item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Bar chart */}
        {barData.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-base font-semibold text-gray-700 mb-4">Comparativo Mensal</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: any) => fmtBRL(Number(v))} />
                <Legend />
                <Bar dataKey="Receitas" fill="#10b981" radius={[4,4,0,0]} />
                <Bar dataKey="Despesas" fill="#ef4444" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Pie chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Despesas por Categoria</h2>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-sm text-gray-400">
              Nenhuma despesa registrada no período selecionado.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((_: any, index: number) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: any) => fmtBRL(Number(v))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Budget progress */}
      {Array.isArray(budgets) && budgets.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Orçamentos vs. Gastos</h2>
          <div className="space-y-4">
            {budgets.map((b: any) => (
              <div key={b.id}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{catName(b.categoryId)}</span>
                  <span className={b.isOverBudget ? 'text-red-500 font-semibold' : 'text-gray-500'}>
                    {fmtBRL(b.spentAmount)} / {fmtBRL(b.amount)} ({b.percentUsed?.toFixed(1)}%)
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all ${b.isOverBudget ? 'bg-red-500' : b.alertTriggered ? 'bg-amber-400' : 'bg-emerald-400'}`}
                    style={{ width: `${Math.min(b.percentUsed, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
