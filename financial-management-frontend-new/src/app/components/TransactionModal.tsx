import { FC, useState, useEffect } from 'react'
import { apiClient } from '../services/api'
import { Category, Subcategory, Account, Transaction } from '../types'

interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (transaction: Partial<Transaction>) => void
  transaction?: Partial<Transaction>
  isLoading?: boolean
}

export const TransactionModal: FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  transaction,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<Partial<Transaction>>({
    description: '',
    amount: 0,
    type: 'EXPENSE',
    categoryId: '',
    subcategoryId: '',
    accountId: '',
    destinationAccountId: '',
    date: new Date().toISOString().split('T')[0],
    // Backend usa CONFIRMED (não COMPLETED)
    status: 'CONFIRMED',
  })

  const [categories, setCategories] = useState<Category[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [loadingData, setLoadingData] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadData()
      if (transaction) {
        // Normaliza status legado "COMPLETED" → "CONFIRMED"
        const validStatuses = ['PENDING', 'CONFIRMED', 'CANCELED']
        const normalizedStatus = validStatuses.includes(transaction.status ?? '')
          ? transaction.status
          : 'CONFIRMED'
        setFormData({ ...transaction, status: normalizedStatus as any })
      } else {
        setFormData({
          description: '',
          amount: 0,
          type: 'EXPENSE',
          categoryId: '',
          subcategoryId: '',
          accountId: '',
          destinationAccountId: '',
          date: new Date().toISOString().split('T')[0],
          status: 'CONFIRMED',
        })
      }
    }
  }, [isOpen, transaction])

  useEffect(() => {
    if (formData.categoryId) {
      const selected = categories.find(c => c.id === formData.categoryId)
      setSubcategories(selected?.subcategories || [])
    } else {
      setSubcategories([])
    }
  }, [formData.categoryId, categories])

  const loadData = async () => {
    try {
      setLoadingData(true)
      const [categoriesData, accountsData] = await Promise.all([
        apiClient.getCategories(),
        apiClient.getAccounts(),
      ])
      setCategories(categoriesData)
      setAccounts(accountsData)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validação básica
    if (!formData.description || !formData.accountId || !formData.amount || formData.amount <= 0) {
      alert('Por favor, preencha: Descrição, Conta e Valor')
      return
    }
    
    // Validação específica por tipo
    if (formData.type === 'TRANSFER') {
      if (!formData.destinationAccountId) {
        alert('Selecione a conta de destino para transferências')
        return
      }
      if (formData.accountId === formData.destinationAccountId) {
        alert('A conta de origem não pode ser igual à conta de destino')
        return
      }
    } else {
      if (!formData.categoryId) {
        alert('Selecione uma categoria')
        return
      }
    }
    
    // Preparar dados para envio (não enviar destinationAccountId se não for transferência)
    const dataToSend = { ...formData }
    if (formData.type !== 'TRANSFER') {
      delete dataToSend.destinationAccountId
    }
    // Não enviar subcategoryId se estiver vazio
    if (!dataToSend.subcategoryId || dataToSend.subcategoryId === '') {
      delete dataToSend.subcategoryId
    }
    // Normalizar date para YYYY-MM-DD (remover parte de tempo se vier ISO completo)
    if (dataToSend.date && typeof dataToSend.date === 'string') {
      dataToSend.date = dataToSend.date.split('T')[0] as any
    }
    // Normalizar status legado
    const validStatuses = ['PENDING', 'CONFIRMED', 'CANCELED']
    if (!validStatuses.includes(dataToSend.status ?? '')) {
      dataToSend.status = 'CONFIRMED' as any
    }

    onSave(dataToSend)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between p-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {transaction?.id ? 'Editar Transação' : 'Nova Transação'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descrição *
            </label>
            <input
              type="text"
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              placeholder="Ex: Compra no supermercado"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Valor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Valor *
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount || ''}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo *
            </label>
            <select
              name="type"
              value={formData.type || 'EXPENSE'}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="EXPENSE">Despesa</option>
              <option value="INCOME">Receita</option>
              <option value="TRANSFER">Transferência</option>
            </select>
          </div>

          {/* Data */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Data *
            </label>
            <input
              type="date"
              name="date"
              value={formData.date?.split('T')[0] || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Conta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Conta *
            </label>
            <select
              name="accountId"
              value={formData.accountId || ''}
              onChange={handleChange}
              disabled={loadingData}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="">Selecione uma conta</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Conta Destino (apenas para transferências) */}
          {formData.type === 'TRANSFER' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Conta Destino *
              </label>
              <select
                name="destinationAccountId"
                value={formData.destinationAccountId || ''}
                onChange={handleChange}
                disabled={loadingData}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="">Selecione a conta destino</option>
                {accounts
                  .filter(acc => acc.id !== formData.accountId) // Não mostrar a conta de origem
                  .map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Categoria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Categoria
            </label>
            <select
              name="categoryId"
              value={formData.categoryId || ''}
              onChange={handleChange}
              disabled={loadingData}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="">Selecione uma categoria</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subcategoria */}
          {subcategories.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subcategoria
              </label>
              <select
                name="subcategoryId"
                value={formData.subcategoryId || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sem subcategoria</option>
                {subcategories.map(sub => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              name="status"
              value={formData.status || 'CONFIRMED'}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="PENDING">Pendente</option>
              <option value="CONFIRMED">Confirmada</option>
              <option value="CANCELED">Cancelada</option>
            </select>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isLoading ? 'Salvando...' : transaction?.id ? 'Atualizar' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
