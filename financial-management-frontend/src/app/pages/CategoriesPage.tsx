import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm }         from 'react-hook-form';
import toast               from 'react-hot-toast';
import { Plus, Trash2, Tag, ChevronDown, ChevronRight } from 'lucide-react';
import { categoriesService } from '../services/finance.service';
import type { Category }     from '../types';

export default function CategoriesPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: categories = [], isLoading } = useQuery({ queryKey: ['categories'], queryFn: () => categoriesService.list() });

  const { register, handleSubmit, reset } = useForm<any>();

  const createMut = useMutation({
    mutationFn: categoriesService.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); toast.success('Categoria criada!'); setModal(false); reset(); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Erro.'),
  });

  const deleteMut = useMutation({
    mutationFn: categoriesService.remove,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); toast.success('Removida.'); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-800">Categorias</h1><p className="text-sm text-gray-500">Organize suas transações</p></div>
        <button onClick={() => { reset(); setModal(true); }} className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:opacity-90 transition">
          <Plus className="w-4 h-4" /> Nova Categoria
        </button>
      </div>

      {isLoading ? (
        <div className="text-center text-gray-400 py-12">Carregando...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {categories.length === 0 ? (
            <div className="p-12 text-center"><Tag className="w-10 h-10 text-gray-300 mx-auto mb-2" /><p className="text-gray-400">Nenhuma categoria.</p></div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {categories.map((cat: Category) => (
                <li key={cat.id}>
                  <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                    <button onClick={() => setExpanded(expanded === cat.id ? null : cat.id)} className="p-0.5 text-gray-400 hover:text-gray-600">
                      {expanded === cat.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    <div className="w-4 h-4 rounded-full shrink-0" style={{ background: cat.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{cat.name}</p>
                      <p className="text-xs text-gray-400">{{ INCOME: 'Receita', EXPENSE: 'Despesa', TRANSFER: 'Transferência' }[cat.type] ?? cat.type} {cat.isSystem ? '· Sistema' : '· Personalizada'}</p>
                    </div>
                    <p className="text-xs text-gray-400 shrink-0">{cat.subcategories?.length ?? 0} subcategorias</p>
                    {!cat.isSystem && (
                      <button onClick={() => { if (confirm('Excluir?')) deleteMut.mutate(cat.id); }} className="p-1.5 rounded hover:bg-red-50 ml-1">
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    )}
                  </div>
                  {expanded === cat.id && cat.subcategories && cat.subcategories.length > 0 && (
                    <ul className="pl-12 pr-5 pb-2 space-y-1 bg-gray-50">
                      {cat.subcategories.map(sub => (
                        <li key={sub.id} className="text-xs text-gray-500 py-1.5 border-b border-gray-100 last:border-0">
                          {sub.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) { setModal(false); reset(); } }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-5">Nova Categoria</h2>
            <form onSubmit={handleSubmit(d => createMut.mutate(d))} className="space-y-4">
              <div><label className="text-sm font-medium text-gray-700">Nome *</label><input {...register('name', { required: true })} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" /></div>
              <div>
                <label className="text-sm font-medium text-gray-700">Tipo *</label>
                <select {...register('type', { required: true })} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500">
                  <option value="EXPENSE">Despesa</option>
                  <option value="INCOME">Receita</option>
                  <option value="TRANSFER">Transferência</option>
                  <option value="INVESTMENT">Investimento</option>
                </select>
              </div>
              <div><label className="text-sm font-medium text-gray-700">Ícone</label><input {...register('icon')} placeholder="💰" className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" /></div>
              <div><label className="text-sm font-medium text-gray-700">Cor</label><input type="color" {...register('color')} defaultValue="#17c1e8" className="mt-1 h-9 w-full border border-gray-300 rounded-lg cursor-pointer" /></div>
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
