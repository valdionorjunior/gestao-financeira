import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, Trash2, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { transactionsService, accountsService, categoriesService } from '../services/finance.service';
import type { Transaction } from '../types';

const fmtBRL  = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const fmtDate = (d: string) => new Date(d).toLocaleDateString('pt-BR');

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

  const params = { page, limit: 20, ...(type ? { type } : {}) };
  const { data, isLoading } = useQuery({ queryKey: ['transactions', params], queryFn: () => transactionsService.list(params) });
  const { data: accounts = [] } = useQuery({ queryKey: ['accounts'], queryFn: accountsService.list });
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: () => categoriesService.list() });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<any>();

  const createMut = useMutation({
    mutationFn: transactionsService.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['transactions'] }); qc.invalidateQueries({ queryKey: ['accounts'] }); toast.success('Transação criada!'); setModal(false); reset(); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Erro.'),
  });

  const deleteMut = useMutation({
    mutationFn: transactionsService.remove,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['transactions'] }); qc.invalidateQueries({ queryKey: ['accounts'] }); toast.success('Removida.'); },
  });

  const onSubmit = (data: any) => createMut.mutate(data);

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
          <button onClick={() => { reset(); setModal(true); }} className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:opacity-90 transition">
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

      {/* New Transaction Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) { setModal(false); reset(); } }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-5">Nova Transação</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Tipo *</label>
                <select {...register('type', { required: true })} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500">
                  {TX_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Conta *</label>
                <select {...register('accountId', { required: true })} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500">
                  <option value="">Selecione a conta</option>
                  {accounts.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Categoria</label>
                <select {...register('categoryId')} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500">
                  <option value="">Sem categoria</option>
                  {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Descrição *</label>
                <input {...register('description', { required: 'Obrigatório' })} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Valor *</label>
                <input type="number" step="0.01" {...register('amount', { required: 'Obrigatório', valueAsNumber: true })} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Data *</label>
                <input type="date" {...register('date', { required: 'Obrigatório' })} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setModal(false); reset(); }} className="flex-1 border border-gray-300 text-gray-700 font-semibold py-2.5 rounded-lg hover:bg-gray-50 transition text-sm">Cancelar</button>
                <button type="submit" className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold py-2.5 rounded-lg hover:opacity-90 transition text-sm">Criar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
