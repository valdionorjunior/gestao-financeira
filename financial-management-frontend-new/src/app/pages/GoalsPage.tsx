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

  const GOAL_STATUS_LABELS: Record<string, string> = {
    ACTIVE: 'Ativa', COMPLETED: 'Concluída', CANCELLED: 'Cancelada',
  }

  const columns = [
    { key: 'name' as const, label: 'Nome' },
    {
      key: 'targetAmount' as const,
      label: 'Meta',
      render: (amount: number) => formatCurrency(amount),
    },
    {
      key: 'currentAmount' as const,
      label: 'Progresso',
      render: (amount: number, item: Goal) => (
        <div>
          <span className="font-medium text-green-600">
            {formatCurrency(amount)} ({item.progressPercent?.toFixed(0) ?? 0}%)
          </span>
          <div className="w-32 h-2 bg-gray-200 rounded-full mt-2">
            <div
              className={`h-full rounded-full ${item.isAchieved ? 'bg-green-500' : 'bg-blue-500'}`}
              style={{ width: `${Math.min(item.progressPercent ?? 0, 100)}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      // Backend usa targetDate (não dueDate)
      key: 'targetDate' as const,
      label: 'Prazo',
      render: (date: string) => date ? formatDate(date) : '—',
    },
    {
      key: 'status' as const,
      label: 'Status',
      render: (status: string) => {
        const colors: Record<string, string> = {
          ACTIVE:    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
          COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
          CANCELLED: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
        }
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] ?? 'bg-gray-100 text-gray-600'}`}>
            {GOAL_STATUS_LABELS[status] ?? status}
          </span>
        )
      },
    },
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
