import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';
import { accountsService, categoriesService } from '../services/finance.service';
import type { Account, Category, Transaction } from '../types';

interface TransactionModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
  editingTransaction?: Partial<Transaction>;
}

export function TransactionModal({ open, onClose, onSubmit, isLoading = false, editingTransaction }: TransactionModalProps) {
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<any>({
    defaultValues: editingTransaction || {
      type: 'EXPENSE',
      status: 'CONFIRMED',
      date: new Date().toISOString().split('T')[0],
      destinationAccountId: '',
    },
  });

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const categoryId = watch('categoryId');
  const type = watch('type');
  const accountId = watch('accountId');
  const destinationAccountId = watch('destinationAccountId');

  const handleFormSubmit = (data: any) => {
    if (data.type === 'TRANSFER') {
      if (!data.destinationAccountId) {
        toast.error('Selecione a conta de destino para transferências');
        return;
      }
      if (data.accountId === data.destinationAccountId) {
        toast.error('A conta de origem não pode ser igual à conta de destino');
        return;
      }
    } else {
      if (!data.categoryId) {
        toast.error('Selecione uma categoria');
        return;
      }
      // Não enviar destinationAccountId se não for transferência
      delete data.destinationAccountId;
    }
    onSubmit(data);
  };

  useEffect(() => {
    if (!open) return;
    
    const loadData = async () => {
      try {
        setLoading(true);
        const [accs, cats] = await Promise.all([
          accountsService.list(),
          categoriesService.list(),
        ]);
        setAccounts(accs);
        setCategories(cats);
      } catch (err) {
        toast.error('Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [open]);

  useEffect(() => {
    if (categoryId) {
      const selected = categories.find(c => c.id === categoryId);
      setSubcategories(selected?.subcategories || []);
    } else {
      setSubcategories([]);
    }
  }, [categoryId, categories]);

  const handleClose = () => {
    reset({
      type: 'EXPENSE',
      status: 'CONFIRMED',
      date: new Date().toISOString().split('T')[0],
      destinationAccountId: '',
    });
    setSubcategories([]);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) handleClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-800">
            {editingTransaction?.id ? 'Editar Transação' : 'Nova Transação'}
          </h2>
          <button onClick={handleClose} className="p-1 rounded hover:bg-gray-100 transition">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Description */}
          <div>
            <label className="text-sm font-medium text-gray-700">Descrição *</label>
            <input
              {...register('description', { required: 'Campo obrigatório' })}
              placeholder="Ex: Compra no supermercado"
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
          </div>

          {/* Amount */}
          <div>
            <label className="text-sm font-medium text-gray-700">Valor *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              {...register('amount', { required: 'Campo obrigatório', min: 0 })}
              placeholder="0.00"
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount.message}</p>}
          </div>

          {/* Type */}
          <div>
            <label className="text-sm font-medium text-gray-700">Tipo *</label>
            <select
              {...register('type', { required: 'Campo obrigatório' })}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="INCOME">Receita</option>
              <option value="EXPENSE">Despesa</option>
              <option value="TRANSFER">Transferência</option>
            </select>
            {errors.type && <p className="text-xs text-red-500 mt-1">{errors.type.message}</p>}
          </div>

          {/* Date */}
          <div>
            <label className="text-sm font-medium text-gray-700">Data *</label>
            <input
              type="date"
              {...register('date', { required: 'Campo obrigatório' })}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date.message}</p>}
          </div>

          {/* Account */}
          <div>
            <label className="text-sm font-medium text-gray-700">Conta *</label>
            <select
              {...register('accountId', { required: 'Campo obrigatório' })}
              disabled={loading}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
            >
              <option value="">Selecione uma conta</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
            {errors.accountId && <p className="text-xs text-red-500 mt-1">{errors.accountId.message}</p>}
          </div>

          {/* Destination Account (for TRANSFER) */}
          {type === 'TRANSFER' && (
            <div>
              <label className="text-sm font-medium text-gray-700">Conta de Destino *</label>
              <select
                {...register('destinationAccountId')}
                disabled={loading}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
              >
                <option value="">Selecione a conta de destino</option>
                {accounts.filter(acc => acc.id !== accountId).map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Category */}
          <div>
            <label className="text-sm font-medium text-gray-700">Categoria</label>
            <select
              {...register('categoryId')}
              disabled={loading}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
            >
              <option value="">Sem categoria</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Subcategory */}
          {subcategories.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-700">Subcategoria</label>
              <select
                {...register('subcategoryId')}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">Sem subcategoria</option>
                {subcategories.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Status */}
          <div>
            <label className="text-sm font-medium text-gray-700">Status</label>
            <select
              {...register('status')}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="PENDING">Pendente</option>
              <option value="CONFIRMED">Confirmada</option>
              <option value="CANCELED">Cancelada</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 border border-gray-300 text-gray-700 font-semibold py-2.5 rounded-lg hover:bg-gray-50 transition text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || loading}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold py-2.5 rounded-lg hover:opacity-90 transition text-sm disabled:opacity-50"
            >
              {isLoading ? 'Salvando...' : editingTransaction?.id ? 'Atualizar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
