import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/auth.store';

interface RegisterForm {
  firstName: string; lastName: string; email: string;
  password: string; confirmPassword: string; lgpdConsent: boolean;
}

export default function RegisterPage() {
  const { register: registerUser } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>();

  const onSubmit = async (data: RegisterForm) => {
    if (data.password !== data.confirmPassword) {
      toast.error('As senhas não coincidem.');
      return;
    }
    setLoading(true);
    try {
      await registerUser({ email: data.email, password: data.password, firstName: data.firstName, lastName: data.lastName, lgpdConsent: data.lgpdConsent });
      navigate('/');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Erro ao criar conta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-cyan-500 to-blue-600" />
          <div className="px-8 py-10">
            <div className="text-center mb-8">
              <span className="text-4xl">💰</span>
              <h1 className="text-2xl font-bold text-gray-800 mt-2">Criar conta</h1>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                  <input
                    {...register('firstName', { required: 'Obrigatório' })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sobrenome</label>
                  <input
                    {...register('lastName', { required: 'Obrigatório' })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                <input
                  type="email"
                  {...register('email', { required: 'Obrigatório' })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                <input
                  type="password"
                  {...register('password', {
                    required: 'Obrigatório',
                    minLength: { value: 8, message: 'Mínimo 8 caracteres' },
                  })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar senha</label>
                <input
                  type="password"
                  {...register('confirmPassword', { required: 'Obrigatório' })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="lgpd"
                  {...register('lgpdConsent', { required: 'Consentimento obrigatório' })}
                  className="mt-0.5"
                />
                <label htmlFor="lgpd" className="text-xs text-gray-600">
                  Concordo com o tratamento dos meus dados pessoais conforme a LGPD.
                </label>
              </div>
              {errors.lgpdConsent && <p className="text-xs text-red-500">{errors.lgpdConsent.message}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold py-3 rounded-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
              >
                {loading ? 'Criando...' : 'Criar conta'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Já tem conta?{' '}
              <Link to="/login" className="text-cyan-600 font-medium hover:underline">Entrar</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
