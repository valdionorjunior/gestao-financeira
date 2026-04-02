import { FC, useState } from 'react'
import { Chart } from '../components/Chart'

export const ReportsPage: FC = () => {
  const [period, setPeriod] = useState('6m')

  const mockIncomeExpenseData = [
    { month: 'Jan', income: 5000, expense: 3000, savings: 2000 },
    { month: 'Fev', income: 5500, expense: 3200, savings: 2300 },
    { month: 'Mar', income: 6000, expense: 3100, savings: 2900 },
    { month: 'Abr', income: 5800, expense: 3500, savings: 2300 },
    { month: 'Mai', income: 6200, expense: 3300, savings: 2900 },
    { month: 'Jun', income: 6500, expense: 3200, savings: 3300 },
  ]

  const mockCategoryData = [
    { name: 'Alimentação', value: 5000 },
    { name: 'Transporte', value: 2000 },
    { name: 'Saúde', value: 1000 },
    { name: 'Entretenimento', value: 800 },
    { name: 'Outros', value: 700 },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Relatórios</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Análise completa de suas finanças</p>
      </div>

      {/* Filtro de período */}
      <div className="flex gap-2">
        {['1m', '3m', '6m', '1a'].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              period === p
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {p === '1m' ? '1 Mês' : p === '3m' ? '3 Meses' : p === '6m' ? '6 Meses' : '1 Ano'}
          </button>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Chart
          title="Receita, Despesa e Economias"
          data={mockIncomeExpenseData}
          type="line"
          dataKey={['income', 'expense', 'savings']}
          xAxisKey="month"
          colors={['#16a34a', '#ef4444', '#0284c7']}
        />

        <Chart
          title="Despesas por Categoria"
          data={mockCategoryData}
          type="pie"
          dataKey="value"
          colors={['#0284c7', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6']}
        />
      </div>

      {/* Resumo de Relatório */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-800">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Receita</p>
          <p className="text-3xl font-bold text-green-600 mt-2">R$ 34.500</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Período selecionado</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-800">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Despesa</p>
          <p className="text-3xl font-bold text-red-600 mt-2">R$ 19.300</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Período selecionado</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-800">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Economizado</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">R$ 14.700</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Taxa: 42.6%</p>
        </div>
      </div>
    </div>
  )
}
