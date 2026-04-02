import { FC, useEffect, useRef, useState } from 'react'
import { DataTable } from '../components/DataTable'
import { apiClient } from '../services/api'
import { Budget, Category } from '../types'
import { formatCurrency } from '../utils/formatters'

export const BudgetsPage: FC = () => {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)
  const categoryRef = useRef<HTMLSelectElement>(null)
  const periodRef = useRef<HTMLSelectElement>(null)
  const amountRef = useRef<HTMLInputElement>(null)
  const alertThresholdRef = useRef<HTMLInputElement>(null)
  const startDateRef = useRef<HTMLInputElement>(null)
  const endDateRef = useRef<HTMLInputElement>(null)

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

  useEffect(() => {
    loadBudgets()
    apiClient.getCategories().then(setCategories).catch(() => {})
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    const name = nameRef.current?.value.trim() ?? ''
    const categoryId = categoryRef.current?.value ?? ''
    const period = periodRef.current?.value ?? ''
    const amount = parseFloat(amountRef.current?.value ?? '')
    const alertThreshold = parseFloat(alertThresholdRef.current?.value ?? '80')
    const startDate = startDateRef.current?.value ?? ''
    const endDate = endDateRef.current?.value ?? ''
    if (!name) { setFormError('Nome é obrigatório.'); return }
    if (!categoryId) { setFormError('Selecione uma categoria.'); return }
    if (isNaN(amount) || amount <= 0) { setFormError('Valor limite deve ser maior que zero.'); return }
    if (!startDate || !endDate) { setFormError('Datas de início e fim são obrigatórias.'); return }
    try {
      setSaving(true)
      await apiClient.createBudget({ name, categoryId, period, amount, alertThreshold, startDate, endDate })
      setShowModal(false)
      await loadBudgets()
    } catch (err: any) {
      setFormError(err?.response?.data?.message ?? 'Erro ao criar orçamento.')
    } finally {
      setSaving(false)
    }
  }

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
      render: (spent: number, item: Budget) => {
        const pct = item.percentUsed ?? 0
        const threshold = item.alertThreshold ?? 80
        return (
        <div>
          <span className={item.isOverBudget ? 'text-red-600 font-medium' : 'text-gray-900 dark:text-gray-100'}>
            {formatCurrency(spent ?? 0)} ({pct.toFixed(0)}%)
          </span>
          <div className="w-32 h-2 bg-gray-200 rounded-full mt-2">
            <div
              className={`h-full rounded-full ${item.isOverBudget ? 'bg-red-500' : pct >= threshold ? 'bg-yellow-500' : 'bg-green-500'}`}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
        </div>
        )
      },
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
        <button
          onClick={() => { setFormError(''); setShowModal(true) }}
          className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
        >
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

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-5">Novo Orçamento</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nome *</label>
                <input ref={nameRef} type="text" className="mt-1 w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Categoria *</label>
                <select ref={categoryRef} className="mt-1 w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Selecione...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Período *</label>
                <select ref={periodRef} className="mt-1 w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="MONTHLY">Mensal</option>
                  <option value="WEEKLY">Semanal</option>
                  <option value="YEARLY">Anual</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Valor Limite (R$) *</label>
                <input ref={amountRef} type="number" step="0.01" min="0.01" className="mt-1 w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Alerta (%) — padrão 80</label>
                <input ref={alertThresholdRef} type="number" min="1" max="100" defaultValue={80} className="mt-1 w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Data Início *</label>
                  <input ref={startDateRef} type="date" className="mt-1 w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Data Fim *</label>
                  <input ref={endDateRef} type="date" className="mt-1 w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              {formError && <p className="text-sm text-red-500">{formError}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 rounded-lg transition text-sm disabled:opacity-60">{saving ? 'Salvando...' : 'Criar Orçamento'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
