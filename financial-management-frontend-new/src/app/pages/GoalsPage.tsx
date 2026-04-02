import { FC, useEffect, useState } from 'react'
import { DataTable } from '../components/DataTable'
import { apiClient } from '../services/api'
import { Goal } from '../types'
import { formatCurrency, formatDate } from '../utils/formatters'

export const GoalsPage: FC = () => {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadGoals = async () => {
      try {
        setLoading(true)
        const data = await apiClient.getGoals()
        setGoals(data)
      } catch (error) {
        console.error('Erro ao carregar metas:', error)
      } finally {
        setLoading(false)
      }
    }

    loadGoals()
  }, [])

  const columns = [
    { key: 'name' as const, label: 'Nome' },
    {
      key: 'targetAmount' as const,
      label: 'Meta',
      render: (amount: number) => formatCurrency(amount),
    },
    {
      key: 'currentAmount' as const,
      label: 'Atual',
      render: (amount: number, item: Goal) => (
        <div>
          <span className="font-medium text-green-600">{formatCurrency(amount)}</span>
          <div className="w-32 h-2 bg-gray-200 rounded-full mt-2">
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${Math.min((amount / item.targetAmount) * 100, 100)}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'dueDate' as const,
      label: 'Prazo',
      render: (date: string) => formatDate(date),
    },
    { key: 'status' as const, label: 'Status' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Metas Financeiras</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Acompanhe suas metas de economias</p>
        </div>
        <button className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition-all">
          + Adicionar Meta
        </button>
      </div>

      <DataTable
        title="Metas Ativas"
        columns={columns}
        data={goals}
        loading={loading}
        pageSize={10}
      />
    </div>
  )
}
