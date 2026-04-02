import { FC, useEffect, useState } from 'react'
import { Wallet, TrendingUp, Zap, CreditCard } from 'lucide-react'
import { KPICard } from '../components/KPICard'
import { Chart } from '../components/Chart'
import { apiClient } from '../services/api'
import { FinancialSummary } from '../types'

export const DashboardPage: FC = () => {
  const [summary, setSummary] = useState<FinancialSummary | null>(null)

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const data = await apiClient.getFinancialSummary()
        setSummary(data)
      } catch (error) {
        console.error('Erro ao carregar resumo:', error)
      }
    }

    loadSummary()
  }, [])

  const mockChartData = [
    { name: 'Jan', income: 5000, expense: 3000 },
    { name: 'Fev', income: 5500, expense: 3200 },
    { name: 'Mar', income: 6000, expense: 3100 },
    { name: 'Abr', income: 5800, expense: 3500 },
    { name: 'Mai', income: 6200, expense: 3300 },
  ]

  const mockPieData = [
    { name: 'Alimentação', value: 1500 },
    { name: 'Transporte', value: 800 },
    { name: 'Saúde', value: 400 },
    { name: 'Outros', value: 400 },
  ]

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Saldo Total"
          value={summary?.balance || 0}
          icon={Wallet}
          variant="default"
          trend={{
            percentage: 12.5,
            direction: 'up',
            period: 'vs mês anterior',
          }}
        />
        <KPICard
          title="Receita (Mês)"
          value={summary?.totalIncome || 0}
          icon={TrendingUp}
          variant="success"
          trend={{
            percentage: 8.2,
            direction: 'up',
            period: 'vs mês anterior',
          }}
        />
        <KPICard
          title="Despesa (Mês)"
          value={summary?.totalExpense || 0}
          icon={CreditCard}
          variant="danger"
          trend={{
            percentage: 5.1,
            direction: 'down',
            period: 'vs mês anterior',
          }}
        />
        <KPICard
          title="Contas Ativas"
          value={summary?.accountsCount || 0}
          icon={Zap}
          variant="warning"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Chart
            title="Receita vs Despesa (Últimos 5 Meses)"
            data={mockChartData}
            type="bar"
            dataKey={['income', 'expense']}
            xAxisKey="name"
            colors={['#16a34a', '#ef4444']}
          />
        </div>

        <div>
          <Chart
            title="Despesas por Categoria"
            data={mockPieData}
            type="pie"
            dataKey="value"
            colors={['#0284c7', '#16a34a', '#f59e0b', '#ef4444']}
          />
        </div>
      </div>

      {/* Line Chart */}
      <div>
        <Chart
          title="Tendência de Saldo (Últimos 6 Meses)"
          data={mockChartData}
          type="line"
          dataKey="expense"
          xAxisKey="name"
        />
      </div>
    </div>
  )
}
