import React from 'react';
import { TrendingUp, AlertCircle } from 'lucide-react';
import { Skeleton } from './ui/Skeleton';

const fmtBRL = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const formatPredictMonth = (month: string): string => {
  const [year, m] = month.split('-');
  const names = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${names[Number(m) - 1]}/${year.slice(2)}`;
};

interface PredictionData {
  predictedNextMonth: number;
  history: Array<{ month: string; expense: number }>;
}

interface Props {
  data: PredictionData | null;
  isLoading: boolean;
}

export function ExpensePredictionCard({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-indigo-500" />
          <h2 className="text-base font-semibold text-gray-700">Previsão de Gastos</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton height={100} />
          <Skeleton height={100} />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-indigo-500" />
          <h2 className="text-base font-semibold text-gray-700">Previsão de Gastos</h2>
        </div>
        <div className="flex items-center justify-center p-8 text-center">
          <div>
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              Dados insuficientes para previsão.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Continue registrando suas transações!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-500" />
          <h2 className="text-base font-semibold text-gray-700">Previsão de Gastos</h2>
        </div>
        <a
          href="/ai"
          className="text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
        >
          Ver IA →
        </a>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Predicted Next Month Highlight */}
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-xl p-4 text-center">
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">
            Próximo Mês
          </p>
          <p className="text-2xl font-bold text-indigo-900 mt-2">
            {fmtBRL(data.predictedNextMonth)}
          </p>
          <p className="text-xs text-indigo-600 mt-1">Estimativa de gastos</p>
        </div>

        {/* History Card */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
            Histórico (últimos 6 meses)
          </p>
          <div className="space-y-2">
            {data.history.map((month) => (
              <div key={month.month} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{formatPredictMonth(month.month)}</span>
                <span className="font-semibold text-gray-900">
                  {fmtBRL(month.expense)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
