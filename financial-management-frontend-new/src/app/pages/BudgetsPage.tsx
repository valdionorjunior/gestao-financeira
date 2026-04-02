import { FC, useEffect, useState } from 'react'
import { DataTable } from '../components/DataTable'
import { apiClient } from '../services/api'
import { Budget } from '../types'
import { formatCurrency } from '../utils/formatters'

export const BudgetsPage: FC = () => {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadBudgets = async () => {
      try {
        setLoading(true)
        const data = await apiClient.getBudgets()
        setBudgets(data)
      } catch (error) {
        console.error('Erro ao carregar orçamentos:', error)
      } finally {
        setLoading(false)
      }
    }

    loadBudgets()
  }, [])

  const PERIOD_LABELS: Record<string, string> = {
    MONTHLY: 'Mensal', WEEKLY: 'Semanal', YEARLY: 'Anual',
  }

  const columns = [
    { key: 'name' as const, label: 'Nome' },
    {
      key: 'period' as const,
      label: 'Período',
      render: (period: string) => PERIOD_LABELS[period] ?? period,
    },
    {
      // Backend usa 'amount' (não 'limit')
      key: 'amount' as const,
      label: 'Limite',
      render: (amount: number) => formatCurrency(amount),
    },
    {
      // Backend usa 'spentAmount' (não 'spent')
      key: 'spentAmount' as const,
      label: 'Gasto',
      render: (spent: number, item: Budget) => (
        <div>
          <span className={item.isOverBudget ? 'text-red-600 font-medium' : 'text-gray-900 dark:text-gray-100'}>
            {formatCurrency(spent)} ({item.percentUsed.toFixed(0)}%)
          </span>
          <div className="w-32 h-2 bg-gray-200 rounded-full mt-2">
            <div
              className={`h-full rounded-full ${item.isOverBudget ? 'bg-red-500' : item.percentUsed >= item.alertThreshold ? 'bg-yellow-500' : 'bg-green-500'}`}
              style={{ width: `${Math.min(item.percentUsed, 100)}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'isActive' as const,
      label: 'Status',
      render: (isActive: boolean) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                   : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
        }`}>
          {isActive ? 'Ativo' : 'Inativo'}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Orçamentos</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Controle seus gastos por categoria</p>
        </div>
        <button className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition-all">
          + Adicionar Orçamento
        </button>
      </div>

      <DataTable
        title="Orçamentos Ativos"
        columns={columns}
        data={budgets}
        loading={loading}
        pageSize={10}
      />
    </div>
  )
}
