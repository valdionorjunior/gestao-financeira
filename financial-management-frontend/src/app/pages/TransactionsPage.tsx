import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, Trash2, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { transactionsService, accountsService, categoriesService } from '../services/finance.service';
import { TransactionModal } from '../components/TransactionModal';
import type { Transaction } from '../types';

const fmtBRL  = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const fmtDate = (d: string) => {
  const dateMatch = d.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (dateMatch) {
    const [, year, month, day] = dateMatch
    // Use UTC to avoid timezone shift
    const dateObj = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)))
    const y = dateObj.getUTCFullYear()
    const m = String(dateObj.getUTCMonth() + 1).padStart(2, '0')
    const day_str = String(dateObj.getUTCDate()).padStart(2, '0')
    return `${day_str}/${m}/${y}`
  }
  return new Date(d).toLocaleDateString('pt-BR')
};

const TX_TYPE_LABEL: Record<string, string> = {
  INCOME:   'Receita',
  EXPENSE:  'Despesa',
  TRANSFER: 'Transferência',
};

const TX_STATUS_LABEL: Record<string, string> = {
  CONFIRMED: 'Confirmada',
  PENDING:   'Pendente',
  CANCELED:  'Cancelada',
};

const TX_TYPES: Array<{ value: string; label: string }> = [
  { value: 'INCOME',  label: 'Receita' },
  { value: 'EXPENSE', label: 'Despesa' },
];

export default function TransactionsPage() {
  const qc = useQueryClient();
  const [page, setPage]       = useState(1);
  const [type, setType]       = useState('');
  const [modal, setModal]     = useState(false);
  const [editingTx, setEditingTx] = useState<Partial<Transaction> | undefined>();

  const params = { page, limit: 20, ...(type ? { type } : {}) };
  const { data, isLoading } = useQuery({ queryKey: ['transactions', params], queryFn: () => transactionsService.list(params) });
  const { data: accounts = [] } = useQuery({ queryKey: ['accounts'], queryFn: accountsService.list });
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: () => categoriesService.list() });

  const createMut = useMutation({
    mutationFn: transactionsService.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['transactions'] }); qc.invalidateQueries({ queryKey: ['accounts'] }); toast.success('Transação criada!'); setModal(false); setEditingTx(undefined); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Erro.'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) => transactionsService.update(id, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['transactions'] }); qc.invalidateQueries({ queryKey: ['accounts'] }); toast.success('Transação atualizada!'); setModal(false); setEditingTx(undefined); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Erro.'),
  });

  const deleteMut = useMutation({
    mutationFn: transactionsService.remove,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['transactions'] }); qc.invalidateQueries({ queryKey: ['accounts'] }); toast.success('Removida.'); },
  });

  const handleOpenModal = (tx?: Transaction) => {
    setEditingTx(tx);
    setModal(true);
  };

  const handleCloseModal = () => {
    setModal(false);
    setEditingTx(undefined);
  };

  const handleSaveTransaction = (data: any) => {
    if (editingTx?.id) {
      updateMut.mutate({ id: editingTx.id, body: data });
    } else {
      createMut.mutate(data);
    }
  };

  const transactions: Transaction[] = data?.data ?? [];
  const total      = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const typeIcon = (t: string) =>
    t === 'INCOME'   ? <ArrowDownCircle className="w-4 h-4 text-emerald-500" /> :
    t === 'EXPENSE'  ? <ArrowUpCircle   className="w-4 h-4 text-red-400" />     :
                       <ArrowLeftRight  className="w-4 h-4 text-blue-400" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Transações</h1>
          <p className="text-sm text-gray-500">{total} registros encontrados</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <Filter className="w-4 h-4 text-gray-400 ml-3" />
            <select className="text-sm px-3 py-2 bg-transparent focus:outline-none" value={type} onChange={e => { setType(e.target.value); setPage(1); }}>
              <option value="">Todos os tipos</option>
              <option value="INCOME">Receita</option>
              <option value="EXPENSE">Despesa</option>
              <option value="TRANSFER">Transferência</option>
            </select>
          </div>
          <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:opacity-90 transition">
            <Plus className="w-4 h-4" /> Nova
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400">Carregando...</div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-gray-400">Nenhuma transação encontrada.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Descrição</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Data</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Valor</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {transactions.map(tx => (
                <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">{typeIcon(tx.type)}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{tx.description}</td>
                  <td className="px-4 py-3 text-gray-500">{fmtDate(tx.date)}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${tx.type === 'INCOME' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {tx.type === 'INCOME' ? '+' : '-'}{fmtBRL(tx.amount)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full
                      ${tx.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700' :
                        tx.status === 'PENDING'   ? 'bg-amber-50 text-amber-700'     :
                                                    'bg-gray-100 text-gray-500'}`}>
                      {TX_STATUS_LABEL[tx.status] ?? tx.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => { if (confirm('Excluir?')) deleteMut.mutate(tx.id); }} className="p-1.5 rounded hover:bg-red-50 transition">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-600">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Transaction Modal */}
      <TransactionModal
        open={modal}
        onClose={handleCloseModal}
        onSubmit={handleSaveTransaction}
        isLoading={createMut.isPending || updateMut.isPending}
        editingTransaction={editingTx}
      />
    </div>
  );
}
