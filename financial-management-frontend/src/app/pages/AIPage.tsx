import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsService, aiService } from '../services/finance.service';

export default function AIPage() {
  const { data: insights, isLoading: insightsLoading } = useQuery({ queryKey: ['insights'], queryFn: aiService.insights });
  const { data: prediction, isLoading: predLoading }   = useQuery({ queryKey: ['prediction'], queryFn: aiService.predict });

  const fmtBRL = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Inteligência Artificial</h1>
        <p className="text-sm text-gray-500">Insights e previsões financeiras</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Insights */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-700 mb-4">💡 Insights do Mês</h2>
          {insightsLoading ? (
            <p className="text-sm text-gray-400">Analisando seus dados...</p>
          ) : !insights || insights.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhum insight disponível. Continue registrando suas transações!</p>
          ) : (
            <ul className="space-y-3">
              {insights.map((ins: any, i: number) => (
                <li key={i} className={`p-4 rounded-lg border ${ins.type === 'overspend_alert' ? 'bg-red-50 border-red-100' : 'bg-blue-50 border-blue-100'}`}>
                  <p className={`text-sm font-semibold ${ins.type === 'overspend_alert' ? 'text-red-700' : 'text-blue-700'}`}>{ins.title}</p>
                  <p className={`text-xs mt-1 ${ins.type === 'overspend_alert' ? 'text-red-600' : 'text-blue-600'}`}>{ins.message}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Prediction */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-700 mb-4">📈 Previsão de Gastos</h2>
          {predLoading ? (
            <p className="text-sm text-gray-400">Calculando previsão...</p>
          ) : prediction ? (
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 text-center">
                <p className="text-sm text-indigo-600 font-medium">Estimativa próximo mês</p>
                <p className="text-3xl font-bold text-indigo-700 mt-1">{fmtBRL(prediction.predictedNextMonth)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Histórico</p>
                <ul className="space-y-2">
                  {prediction.history?.map((m: any, i: number) => (
                    <li key={i} className="flex justify-between text-sm">
                      <span className="text-gray-500">{m.month}</span>
                      <span className="font-medium text-gray-700">{fmtBRL(m.expense)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
