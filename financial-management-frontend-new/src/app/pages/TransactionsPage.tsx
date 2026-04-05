import { FC, useEffect, useState } from 'react'
import { DataTable } from '../components/DataTable'
import { TransactionModal } from '../components/TransactionModal'
import { apiClient } from '../services/api'
import { Transaction } from '../types'
import { formatCurrency, formatDate } from '../utils/formatters'

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  CANCELED: 'Cancelado',
}

const TYPE_LABELS: Record<string, string> = {
  INCOME: 'Receita',
  EXPENSE: 'Despesa',
  TRANSFER: 'Transferência',
}

export const TransactionsPage: FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Partial<Transaction> | undefined>()

  useEffect(() => {
    loadTransactions()
  }, [])

  const loadTransactions = async () => {
    try {
      setLoading(true)
      // Backend retorna PaginatedResult<Transaction> — extrair .data
      const result = await apiClient.getTransactions({ limit: 50 })
      setTransactions(Array.isArray(result) ? result : result.data)
    } catch (error) {
      console.error('Erro ao carregar transações:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (transaction?: Transaction) => {
    setEditingTransaction(transaction)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingTransaction(undefined)
  }

  const handleSaveTransaction = async (formData: Partial<Transaction>) => {
    try {
      setIsLoading(true)
      if (editingTransaction?.id) {
        // UpdateTransactionDto: apenas estes campos são permitidos no PUT
        const { description, amount, date, dueDate, categoryId, subcategoryId, notes, tags } = formData as any
        const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'CANCELED']
        const rawStatus = (formData as any).status
        const status = VALID_STATUSES.includes(rawStatus) ? rawStatus : 'CONFIRMED'
        await apiClient.updateTransaction(editingTransaction.id, { description, amount, date, dueDate, status, categoryId, subcategoryId, notes, tags })
      } else {
        await apiClient.createTransaction(formData)
      }
      handleCloseModal()
      await loadTransactions()
    } catch (error) {
      console.error('Erro ao salvar transação:', error)
      alert('Erro ao salvar transação')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) return
    try {
      await apiClient.deleteTransaction(id)
      await loadTransactions()
    } catch (error) {
      console.error('Erro ao excluir transação:', error)
      alert('Erro ao excluir transação')
    }
  }

  const columns = [
    { key: 'date' as const, label: 'Data', render: (date: string) => formatDate(date) },
    { key: 'description' as const, label: 'Descrição' },
    {
      key: 'type' as const,
      label: 'Tipo',
      render: (type: string) => TYPE_LABELS[type] ?? type,
    },
    {
      key: 'amount' as const,
      label: 'Valor',
      render: (amount: number, item: Transaction) => (
        <span className={item.type === 'INCOME' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
          {item.type === 'INCOME' ? '+' : '-'} {formatCurrency(amount)}
        </span>
      ),
    },
    {
      key: 'status' as const,
      label: 'Status',
      render: (status: string) => {
        const colors: Record<string, string> = {
          CONFIRMED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
          PENDING:   'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
          CANCELED:  'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        }
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] ?? 'bg-gray-100 text-gray-600'}`}>
            {STATUS_LABELS[status] ?? status}
          </span>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Transações</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Gerencie todas as suas transações</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
        >
          + Adicionar Transação
        </button>
      </div>

      <DataTable
        title="Histórico de Transações"
        columns={columns}
        data={transactions}
        loading={loading}
        pageSize={10}
        onEdit={(tx: Transaction) => handleOpenModal(tx)}
        onDelete={handleDeleteTransaction}
      />

      <TransactionModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSave={handleSaveTransaction}
        transaction={editingTransaction}
        isLoading={isLoading}
      />
    </div>
  )
}
