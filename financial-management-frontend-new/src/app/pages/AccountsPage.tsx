import { FC, useEffect, useState } from 'react'
import { DataTable } from '../components/DataTable'
import { apiClient } from '../services/api'
import { Account } from '../types'
import { formatCurrency } from '../utils/formatters'

export const AccountsPage: FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        setLoading(true)
        const data = await apiClient.getAccounts()
        setAccounts(data)
      } catch (error) {
        console.error('Erro ao carregar contas:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAccounts()
  }, [])

  const columns = [
    { key: 'name' as const, label: 'Nome' },
    { key: 'type' as const, label: 'Tipo' },
    {
      key: 'balance' as const,
      label: 'Saldo',
      render: (balance: number) => (
        <span className="font-medium text-green-600">{formatCurrency(balance)}</span>
      ),
    },
    { key: 'currency' as const, label: 'Moeda' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Contas</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Gerencie suas contas bancárias e investimentos</p>
        </div>
        <button className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition-all">
          + Adicionar Conta
        </button>
      </div>

      <DataTable
        title="Contas Bancárias"
        columns={columns}
        data={accounts}
        loading={loading}
        pageSize={10}
      />
    </div>
  )
}
