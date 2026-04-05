import { FC, useEffect, useRef, useState } from 'react'
import { DataTable } from '../components/DataTable'
import { apiClient } from '../services/api'
import { Goal } from '../types'
import { formatCurrency, formatDate } from '../utils/formatters'

export const GoalsPage: FC = () => {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)
  const descRef = useRef<HTMLInputElement>(null)
  const targetAmountRef = useRef<HTMLInputElement>(null)
  const targetDateRef = useRef<HTMLInputElement>(null)

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

  useEffect(() => { loadGoals() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    const name = nameRef.current?.value.trim() ?? ''
    const targetAmount = parseFloat(targetAmountRef.current?.value ?? '')
    if (!name) { setFormError('Nome é obrigatório.'); return }
    if (isNaN(targetAmount) || targetAmount <= 0) { setFormError('Valor alvo deve ser maior que zero.'); return }
    try {
      setSaving(true)
      await apiClient.createGoal({
        name,
        description: descRef.current?.value.trim() || undefined,
        targetAmount,
        targetDate: targetDateRef.current?.value || undefined,
      })
      setShowModal(false)
      await loadGoals()
    } catch (err: any) {
      setFormError(err?.response?.data?.message ?? 'Erro ao criar meta.')
    } finally {
      setSaving(false)
    }
  }

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
        <button
          onClick={() => { setFormError(''); setShowModal(true) }}
          className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
        >
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

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-5">Nova Meta</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nome *</label>
                <input ref={nameRef} type="text" className="mt-1 w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Descrição</label>
                <input ref={descRef} type="text" className="mt-1 w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Valor Alvo (R$) *</label>
                <input ref={targetAmountRef} type="number" step="0.01" min="0.01" className="mt-1 w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Prazo</label>
                <input ref={targetDateRef} type="date" className="mt-1 w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              {formError && <p className="text-sm text-red-500">{formError}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 rounded-lg transition text-sm disabled:opacity-60">{saving ? 'Salvando...' : 'Criar Meta'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
