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

  const columns = [
    { key: 'name' as const, label: 'Nome' },
    { key: 'period' as const, label: 'Período' },
    {
      key: 'limit' as const,
      label: 'Limite',
      render: (limit: number) => formatCurrency(limit),
    },
    {
      key: 'spent' as const,
      label: 'Gasto',
      render: (spent: number, item: Budget) => (
        <div>
          <span className={spent > item.limit ? 'text-red-600 font-medium' : 'text-gray-900'}>
            {formatCurrency(spent)}
          </span>
          <div className="w-32 h-2 bg-gray-200 rounded-full mt-2">
            <div
              className={`h-full rounded-full ${spent > item.limit ? 'bg-red-500' : 'bg-green-500'}`}
              style={{ width: `${Math.min((spent / item.limit) * 100, 100)}%` }}
            />
          </div>
        </div>
      ),
    },
    { key: 'status' as const, label: 'Status' },
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
