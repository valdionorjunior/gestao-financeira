import { FC, useEffect, useState } from 'react'
import { DataTable } from '../components/DataTable'
import { TransactionModal } from '../components/TransactionModal'
import { apiClient } from '../services/api'
import { Transaction } from '../types'
import { formatCurrency, formatDate } from '../utils/formatters'

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
      const data = await apiClient.getTransactions()
      setTransactions(data)
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
        await apiClient.updateTransaction(editingTransaction.id, formData)
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

  const columns = [
    { key: 'date' as const, label: 'Data', render: (date: string) => formatDate(date) },
    { key: 'description' as const, label: 'Descrição' },
    { key: 'type' as const, label: 'Tipo' },
    {
      key: 'amount' as const,
      label: 'Valor',
      render: (amount: number, item: Transaction) => (
        <span className={item.type === 'INCOME' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
          {item.type === 'INCOME' ? '+' : '-'} {formatCurrency(amount)}
        </span>
      ),
    },
    { key: 'status' as const, label: 'Status' },
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
