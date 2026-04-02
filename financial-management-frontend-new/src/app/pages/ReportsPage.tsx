import { FC, useState, useEffect, useCallback } from 'react'
import { Chart } from '../components/Chart'
import { apiClient } from '../services/api'
import { Category, MonthlyReport } from '../types'
import { formatCurrency } from '../utils/formatters'

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const PERIOD_MONTHS: Record<string, number> = { '1m': 1, '3m': 3, '6m': 6, '1a': 12 }

export const ReportsPage: FC = () => {
  const [period, setPeriod] = useState('6m')
  const [reports, setReports] = useState<MonthlyReport[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const loadReports = useCallback(async (p: string) => {
    setLoading(true)
    try {
      const count = PERIOD_MONTHS[p] ?? 6
      const now = new Date()
      const promises: Promise<MonthlyReport>[] = []
      for (let i = count - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        promises.push(apiClient.getMonthlyReport(d.getFullYear(), d.getMonth() + 1))
      }
      const data = await Promise.all(promises)
      setReports(data)
    } catch (err) {
      console.error('Erro ao carregar relatórios:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadReports(period)
    apiClient.getCategories().then(setCategories).catch(() => {})
  }, [period, loadReports])

  const lineChartData = reports.map((r) => ({
    month: MONTH_NAMES[r.period.month - 1],
    Receita: r.income,
    Despesa: r.expense,
    'Saldo Líquido': r.netBalance,
  }))

  const totalIncome  = reports.reduce((s, r) => s + r.income, 0)
  const totalExpense = reports.reduce((s, r) => s + r.expense, 0)
  const totalSavings = totalIncome - totalExpense
  const savingsRate  = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0

  // Agrupa categorias do último relatório
  const lastReport = reports[reports.length - 1]
  const categoryPieData = lastReport?.expenseByCategory?.slice(0, 6).map((c) => {
    const cat = categories.find(cat => cat.id === c.categoryId)
    return {
      name: cat?.name ?? c.categoryId.slice(0, 8),
      value: c.total,
    }
  }) ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Relatórios</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Análise completa de suas finanças</p>
      </div>

      {/* Filtro de período */}
      <div className="flex gap-2">
        {(['1m', '3m', '6m', '1a'] as const).map((p) => (
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

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Chart
              title="Receita, Despesa e Saldo Líquido"
              data={lineChartData}
              type="line"
              dataKey={['Receita', 'Despesa', 'Saldo Líquido']}
              xAxisKey="month"
              colors={['#16a34a', '#ef4444', '#0284c7']}
            />

            <Chart
              title="Despesas por Categoria (Último Mês)"
              data={categoryPieData.length > 0 ? categoryPieData : [{ name: 'Sem dados', value: 1 }]}
              type="pie"
              dataKey="value"
              colors={['#0284c7', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']}
            />
          </div>

          {/* Resumo de Relatório */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-800">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Receita</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{formatCurrency(totalIncome)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Período selecionado</p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-800">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Despesa</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{formatCurrency(totalExpense)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Período selecionado</p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-800">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Economizado</p>
              <p className={`text-3xl font-bold mt-2 ${totalSavings >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {formatCurrency(totalSavings)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                Taxa: {savingsRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

