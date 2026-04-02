import { FC, useEffect, useState } from 'react'
import { Wallet, TrendingUp, Zap, CreditCard } from 'lucide-react'
import { KPICard } from '../components/KPICard'
import { Chart } from '../components/Chart'
import { apiClient } from '../services/api'
import { FinancialSummary, MonthlyReport } from '../types'
import { formatDate } from '../utils/formatters'

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export const DashboardPage: FC = () => {
  const [summary, setSummary] = useState<FinancialSummary | null>(null)
  const [monthlyReports, setMonthlyReports] = useState<{ name: string; income: number; expense: number }[]>([])
  const [loadingCashFlow, setLoadingCashFlow] = useState(true)

  useEffect(() => {
    const now = new Date()

    const loadSummary = apiClient.getFinancialSummary()
      .then(setSummary)
      .catch((err) => console.error('Erro ao carregar resumo:', err))

    // Carrega os últimos 5 meses
    const monthPromises: Promise<MonthlyReport>[] = []
    for (let i = 4; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      monthPromises.push(apiClient.getMonthlyReport(d.getFullYear(), d.getMonth() + 1))
    }

    Promise.all(monthPromises)
      .then((reports) => {
        const chartData = reports.map((r) => ({
          name: MONTH_NAMES[r.period.month - 1],
          income: r.income,
          expense: r.expense,
        }))
        setMonthlyReports(chartData)
      })
      .catch((err) => console.error('Erro ao carregar relatórios mensais:', err))
      .finally(() => setLoadingCashFlow(false))

    Promise.all([loadSummary])
  }, [])

  // Dados de pizza a partir do mês atual (summary não traz breakdown por categoria neste endpoint)
  const categoryPieData = summary?.budgetAlerts?.length
    ? summary.budgetAlerts.map((b) => ({ name: b.categoryId, value: b.percentUsed }))
    : []

  return (
    <div className="space-y-6">
      {/* KPI Cards — usando campos corretos do backend */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Saldo Total"
          value={summary?.totalBalance ?? 0}
          icon={Wallet}
          variant="default"
        />
        <KPICard
          title="Receita (Mês)"
          value={summary?.monthlyIncome ?? 0}
          icon={TrendingUp}
          variant="success"
        />
        <KPICard
          title="Despesa (Mês)"
          value={summary?.monthlyExpense ?? 0}
          icon={CreditCard}
          variant="danger"
        />
        <KPICard
          title="Contas Ativas"
          value={summary?.accountsCount ?? 0}
          icon={Zap}
          variant="warning"
        />
      </div>

      {/* Saldo Líquido do mês */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-800">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Saldo Líquido do Mês</p>
            <p className={`text-3xl font-bold mt-2 ${summary.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.netBalance)}
            </p>
            <p className="text-xs text-gray-500 mt-2">{formatDate(summary.month + '-01')}</p>
          </div>

          {summary.goalsSummary.total > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-800">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Metas Ativas</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{summary.goalsSummary.total}</p>
              {summary.goalsSummary.nearDue.length > 0 && (
                <p className="text-xs text-yellow-600 mt-2">
                  {summary.goalsSummary.nearDue.length} vencendo em 30 dias
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Charts */}
      {!loadingCashFlow && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Chart
              title="Receita vs Despesa (Últimos 5 Meses)"
              data={monthlyReports}
              type="bar"
              dataKey={['income', 'expense']}
              xAxisKey="name"
              colors={['#16a34a', '#ef4444']}
            />
          </div>

          <div>
            <Chart
              title="Alertas de Orçamento"
              data={categoryPieData.length > 0 ? categoryPieData : [{ name: 'Sem alertas', value: 1 }]}
              type="pie"
              dataKey="value"
              colors={['#ef4444', '#f59e0b', '#0284c7', '#16a34a']}
            />
          </div>
        </div>
      )}

      {/* Linha de tendência */}
      {!loadingCashFlow && monthlyReports.length > 0 && (
        <div>
          <Chart
            title="Tendência de Receita e Despesa"
            data={monthlyReports}
            type="line"
            dataKey={['income', 'expense']}
            xAxisKey="name"
            colors={['#16a34a', '#ef4444']}
          />
        </div>
      )}
    </div>
  )
}

