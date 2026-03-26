import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Wallet } from 'lucide-react';
import { accountsService } from '../services/finance.service';
import type { Account } from '../types';

const fmtBRL = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const ACCOUNT_TYPE_LABEL: Record<string, string> = {
  CHECKING:    'Conta Corrente',
  SAVINGS:     'Poupança',
  CREDIT_CARD: 'Cartão de Crédito',
  INVESTMENT:  'Investimento',
  CASH:        'Dinheiro',
  OTHER:       'Outro',
};

const ACCOUNT_TYPES = ['CHECKING', 'SAVINGS', 'CREDIT_CARD', 'INVESTMENT', 'CASH', 'OTHER'];

export default function AccountsPage() {
  const qc         = useQueryClient();
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<Account | null>(null);

  const { data: accounts = [], isLoading } = useQuery({ queryKey: ['accounts'], queryFn: accountsService.list });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<any>();

  const createMut = useMutation({
    mutationFn: accountsService.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['accounts'] }); toast.success('Conta criada!'); closeModal(); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Erro ao criar conta.'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, body }: any) => accountsService.update(id, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['accounts'] }); toast.success('Conta atualizada!'); closeModal(); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Erro ao atualizar.'),
  });

  const deleteMut = useMutation({
    mutationFn: accountsService.remove,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['accounts'] }); toast.success('Conta removida.'); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Erro ao remover.'),
  });

  const openEdit = (acc: Account) => {
    setEditing(acc);
    setModal('edit');
    Object.entries(acc).forEach(([k, v]) => setValue(k as any, v));
  };

  const closeModal = () => { setModal(null); setEditing(null); reset(); };

  const onSubmit = (data: any) => {
    if (modal === 'create') createMut.mutate(data);
    else if (editing)       updateMut.mutate({ id: editing.id, body: data });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Contas</h1>
          <p className="text-sm text-gray-500">Gerencie suas contas bancárias</p>
        </div>
        <button
          onClick={() => { reset(); setModal('create'); }}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" /> Nova Conta
        </button>
      </div>

      {isLoading ? (
        <div className="text-center text-gray-400 py-12">Carregando...</div>
      ) : accounts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhuma conta cadastrada.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {accounts.map((acc) => (
            <div key={acc.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full" style={{ background: acc.color || '#17c1e8' }} />
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{acc.name}</p>
                    <p className="text-xs text-gray-400">{ACCOUNT_TYPE_LABEL[acc.type] ?? acc.type} {acc.bankName ? `· ${acc.bankName}` : ''}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(acc)} className="p-1.5 rounded hover:bg-gray-100 transition"><Pencil className="w-4 h-4 text-gray-400" /></button>
                  <button onClick={() => { if (confirm('Excluir esta conta?')) deleteMut.mutate(acc.id); }} className="p-1.5 rounded hover:bg-red-50 transition"><Trash2 className="w-4 h-4 text-red-400" /></button>
                </div>
              </div>
              <p className="text-xl font-bold text-gray-800">{fmtBRL(acc.balance)}</p>
              <p className="text-xs text-gray-400 mt-1">{acc.currency}</p>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-5">{modal === 'create' ? 'Nova Conta' : 'Editar Conta'}</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Nome *</label>
                <input {...register('name', { required: 'Obrigatório' })} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                {errors.name && <p className="text-xs text-red-500 mt-1">{(errors.name as any).message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Tipo *</label>
                <select {...register('type', { required: 'Obrigatório' })} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500">
                  {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{ACCOUNT_TYPE_LABEL[t]}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Saldo Inicial</label>
                <input type="number" step="0.01" {...register('initialBalance')} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" defaultValue={0} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Banco</label>
                <input {...register('bankName')} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 border border-gray-300 text-gray-700 font-semibold py-2.5 rounded-lg hover:bg-gray-50 transition text-sm">Cancelar</button>
                <button type="submit" className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold py-2.5 rounded-lg hover:opacity-90 transition text-sm">
                  {modal === 'create' ? 'Criar' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
