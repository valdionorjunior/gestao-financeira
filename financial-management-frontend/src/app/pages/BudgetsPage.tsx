import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm }  from 'react-hook-form';
import toast        from 'react-hot-toast';
import { Plus, Trash2, PiggyBank } from 'lucide-react';
import { budgetsService, categoriesService } from '../services/finance.service';

const fmtBRL = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export default function BudgetsPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const { data: budgets = [], isLoading } = useQuery({ queryKey: ['budgets'], queryFn: () => budgetsService.list() });
  const { data: categories = [] }         = useQuery({ queryKey: ['categories'], queryFn: () => categoriesService.list() });

  const { register, handleSubmit, reset } = useForm<any>();

  const createMut = useMutation({
    mutationFn: budgetsService.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['budgets'] }); toast.success('Orçamento criado!'); setModal(false); reset(); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Erro.'),
  });

  const deleteMut = useMutation({
    mutationFn: budgetsService.remove,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['budgets'] }); toast.success('Removido.'); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-800">Orçamentos</h1><p className="text-sm text-gray-500">Controle seus gastos por categoria</p></div>
        <button onClick={() => { reset(); setModal(true); }} className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:opacity-90 transition">
          <Plus className="w-4 h-4" /> Novo Orçamento
        </button>
      </div>

      {isLoading ? (
        <div className="text-center text-gray-400 py-12">Carregando...</div>
      ) : budgets.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <PiggyBank className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhum orçamento cadastrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {budgets.map((b: any) => (
            <div key={b.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{categories.find((c: any) => c.id === b.categoryId)?.name ?? b.categoryId.slice(0,8)}</p>
                  <p className="text-xs text-gray-400">{{ MONTHLY: 'Mensal', QUARTERLY: 'Trimestral', YEARLY: 'Anual' }[b.period as string] ?? b.period}</p>
                </div>
                <button onClick={() => { if (confirm('Excluir?')) deleteMut.mutate(b.id); }} className="p-1.5 rounded hover:bg-red-50"><Trash2 className="w-4 h-4 text-red-400" /></button>
              </div>
              <div className="mb-2">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{fmtBRL(b.spentAmount ?? 0)}</span>
                  <span>{fmtBRL(b.amount)}</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all ${b.isOverBudget ? 'bg-red-500' : b.alertTriggered ? 'bg-amber-400' : 'bg-cyan-400'}`}
                    style={{ width: `${Math.min(b.percentUsed ?? 0, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1 text-right">{(b.percentUsed ?? 0).toFixed(1)}% utilizado</p>
              </div>
              {b.isOverBudget && <p className="text-xs text-red-500 font-semibold">⚠ Orçamento excedido</p>}
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) { setModal(false); reset(); } }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-5">Novo Orçamento</h2>
            <form onSubmit={handleSubmit(d => createMut.mutate(d))} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Categoria *</label>
                <select {...register('categoryId', { required: true })} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500">
                  <option value="">Selecione</option>
                  {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Período *</label>
                <select {...register('period', { required: true })} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500">
                  <option value="MONTHLY">Mensal</option>
                  <option value="QUARTERLY">Trimestral</option>
                  <option value="YEARLY">Anual</option>
                </select>
              </div>
              <div><label className="text-sm font-medium text-gray-700">Valor limite *</label><input type="number" step="0.01" {...register('amount', { required: true, valueAsNumber: true })} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" /></div>
              <div><label className="text-sm font-medium text-gray-700">Data Início *</label><input type="date" {...register('startDate', { required: true })} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" /></div>
              <div><label className="text-sm font-medium text-gray-700">Data Fim *</label><input type="date" {...register('endDate', { required: true })} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" /></div>
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
