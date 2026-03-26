import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm }   from 'react-hook-form';
import toast         from 'react-hot-toast';
import { Plus, Pencil, Trash2, Target } from 'lucide-react';
import { goalsService } from '../services/finance.service';
import type { Goal }    from '../types';

const fmtBRL = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export default function GoalsPage() {
  const qc = useQueryClient();
  const [modal, setModal]   = useState<'create' | 'contrib' | null>(null);
  const [selected, setSelected] = useState<Goal | null>(null);

  const { data: goals = [], isLoading } = useQuery({ queryKey: ['goals'], queryFn: goalsService.list });

  const { register: reg, handleSubmit: hs, reset } = useForm<any>();
  const { register: regC, handleSubmit: hsC, reset: resetC } = useForm<any>();

  const createMut = useMutation({
    mutationFn: goalsService.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['goals'] }); toast.success('Meta criada!'); setModal(null); reset(); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Erro.'),
  });

  const contribMut = useMutation({
    mutationFn: ({ id, body }: any) => goalsService.addContribution(id, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['goals'] }); toast.success('Aporte adicionado!'); setModal(null); resetC(); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Erro.'),
  });

  const deleteMut = useMutation({
    mutationFn: goalsService.remove,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['goals'] }); toast.success('Meta removida.'); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-800">Metas</h1><p className="text-sm text-gray-500">Acompanhe suas metas financeiras</p></div>
        <button onClick={() => { reset(); setModal('create'); }} className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:opacity-90 transition">
          <Plus className="w-4 h-4" /> Nova Meta
        </button>
      </div>

      {isLoading ? (
        <div className="text-center text-gray-400 py-12">Carregando...</div>
      ) : goals.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhuma meta cadastrada.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {goals.map((goal: Goal) => (
            <div key={goal.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-800">{goal.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{{ ACTIVE: 'Ativa', ACHIEVED: 'Conquistada', CANCELED: 'Cancelada', PAUSED: 'Pausada' }[goal.status] ?? goal.status}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setSelected(goal); setModal('contrib'); }} className="p-1.5 rounded hover:bg-emerald-50 transition text-emerald-500 text-xs font-bold">+</button>
                  <button onClick={() => { if (confirm('Excluir?')) deleteMut.mutate(goal.id); }} className="p-1.5 rounded hover:bg-red-50 transition"><Trash2 className="w-4 h-4 text-red-400" /></button>
                </div>
              </div>
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{fmtBRL(goal.currentAmount)}</span>
                  <span>{fmtBRL(goal.targetAmount)}</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-2.5 rounded-full transition-all" style={{ width: `${Math.min(goal.progressPercent, 100)}%`, background: goal.color || '#17c1e8' }} />
                </div>
                <p className="text-xs text-gray-400 mt-1 text-right">{goal.progressPercent?.toFixed(1)}%</p>
              </div>
              {goal.targetDate && <p className="text-xs text-gray-400">Prazo: {new Date(goal.targetDate).toLocaleDateString('pt-BR')}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      {modal === 'create' && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) { setModal(null); reset(); } }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-5">Nova Meta</h2>
            <form onSubmit={hs(d => createMut.mutate(d))} className="space-y-4">
              <div><label className="text-sm font-medium text-gray-700">Nome *</label><input {...reg('name', { required: true })} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" /></div>
              <div><label className="text-sm font-medium text-gray-700">Valor alvo *</label><input type="number" step="0.01" {...reg('targetAmount', { required: true, valueAsNumber: true })} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" /></div>
              <div><label className="text-sm font-medium text-gray-700">Prazo</label><input type="date" {...reg('targetDate')} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" /></div>
              <div><label className="text-sm font-medium text-gray-700">Cor</label><input type="color" {...reg('color')} defaultValue="#17c1e8" className="mt-1 h-9 w-full border border-gray-300 rounded-lg cursor-pointer" /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setModal(null); reset(); }} className="flex-1 border border-gray-300 text-gray-700 font-semibold py-2.5 rounded-lg hover:bg-gray-50 transition text-sm">Cancelar</button>
                <button type="submit" className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold py-2.5 rounded-lg hover:opacity-90 transition text-sm">Criar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contribution modal */}
      {modal === 'contrib' && selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) { setModal(null); resetC(); } }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-1">Adicionar Aporte</h2>
            <p className="text-sm text-gray-500 mb-5">{selected.name}</p>
            <form onSubmit={hsC(d => contribMut.mutate({ id: selected.id, body: d }))} className="space-y-4">
              <div><label className="text-sm font-medium text-gray-700">Valor *</label><input type="number" step="0.01" {...regC('amount', { required: true, valueAsNumber: true })} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" /></div>
              <div><label className="text-sm font-medium text-gray-700">Data *</label><input type="date" {...regC('date', { required: true })} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" /></div>
              <div><label className="text-sm font-medium text-gray-700">Observações</label><input {...regC('notes')} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setModal(null); resetC(); }} className="flex-1 border border-gray-300 text-gray-700 font-semibold py-2.5 rounded-lg hover:bg-gray-50 transition text-sm">Cancelar</button>
                <button type="submit" className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold py-2.5 rounded-lg hover:opacity-90 transition text-sm">Aportar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
