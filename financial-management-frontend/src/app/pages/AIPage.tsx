import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bot, Lightbulb, TrendingUp } from 'lucide-react';
import { aiService } from '../services/finance.service';
import { AIChatPanel } from '../components/AIChatPanel';

type Tab = 'chat' | 'insights' | 'prediction';

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'chat',       label: 'Assistente IA',    icon: Bot },
  { id: 'insights',   label: 'Insights',          icon: Lightbulb },
  { id: 'prediction', label: 'Previsão de Gastos',icon: TrendingUp },
];

export default function AIPage() {
  const [activeTab, setActiveTab] = useState<Tab>('chat');

  const { data: insights, isLoading: insightsLoading } = useQuery({
    queryKey: ['insights'],
    queryFn: aiService.insights,
    enabled: activeTab === 'insights',
  });
  const { data: prediction, isLoading: predLoading } = useQuery({
    queryKey: ['prediction'],
    queryFn: aiService.predict,
    enabled: activeTab === 'prediction',
  });

  const fmtBRL = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div
      className="flex flex-col"
      style={{ height: 'calc(100vh - 3rem)', maxHeight: 'calc(100vh - 3rem)' }}
    >
      {/* Page header */}
      <div className="mb-5 shrink-0">
        <h1 className="text-2xl font-bold text-gray-800">IA &amp; Insights</h1>
        <p className="text-sm text-gray-500">Assistente inteligente e análises financeiras personalizadas</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 shrink-0 mb-5 bg-white border border-gray-100 rounded-xl p-1 shadow-sm w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${activeTab === id
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md shadow-blue-100'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0">
        {/* ── Assistente IA (chat) ── */}
        {activeTab === 'chat' && <AIChatPanel />}

        {/* ── Insights do Mês ── */}
        {activeTab === 'insights' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 h-full overflow-y-auto">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-700">Insights do Mês</h2>
                <p className="text-xs text-gray-400">Análises automáticas das suas movimentações</p>
              </div>
            </div>
            {insightsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 rounded-lg bg-gray-100 animate-pulse" />
                ))}
              </div>
            ) : !insights || insights.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Lightbulb className="w-12 h-12 text-gray-200 mb-3" />
                <p className="text-sm text-gray-400">Nenhum insight disponível.</p>
                <p className="text-xs text-gray-300 mt-1">Continue registrando suas transações!</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {(insights as any[]).map((ins, i) => (
                  <li
                    key={i}
                    className={`p-4 rounded-xl border ${
                      ins.type === 'overspend_alert'
                        ? 'bg-red-50 border-red-100'
                        : ins.type === 'saving_opportunity'
                        ? 'bg-emerald-50 border-emerald-100'
                        : 'bg-blue-50 border-blue-100'
                    }`}
                  >
                    <p
                      className={`text-sm font-semibold ${
                        ins.type === 'overspend_alert'
                          ? 'text-red-700'
                          : ins.type === 'saving_opportunity'
                          ? 'text-emerald-700'
                          : 'text-blue-700'
                      }`}
                    >
                      {ins.title}
                    </p>
                    <p
                      className={`text-xs mt-1 ${
                        ins.type === 'overspend_alert'
                          ? 'text-red-600'
                          : ins.type === 'saving_opportunity'
                          ? 'text-emerald-600'
                          : 'text-blue-600'
                      }`}
                    >
                      {ins.message}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* ── Previsão de Gastos ── */}
        {activeTab === 'prediction' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 h-full overflow-y-auto">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-700">Previsão de Gastos</h2>
                <p className="text-xs text-gray-400">Estimativas baseadas no seu histórico</p>
              </div>
            </div>
            {predLoading ? (
              <div className="space-y-3">
                <div className="h-24 rounded-xl bg-gray-100 animate-pulse" />
                <div className="h-40 rounded-xl bg-gray-100 animate-pulse" />
              </div>
            ) : prediction ? (
              <div className="space-y-5">
                <div className="p-5 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-100 text-center">
                  <p className="text-sm text-indigo-600 font-medium">Estimativa próximo mês</p>
                  <p className="text-4xl font-bold text-indigo-700 mt-2">
                    {fmtBRL(prediction.predictedNextMonth)}
                  </p>
                </div>
                {prediction.history?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      Histórico de Gastos
                    </p>
                    <ul className="space-y-2">
                      {(prediction.history as any[]).map((m, i) => (
                        <li
                          key={i}
                          className="flex justify-between items-center px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-sm"
                        >
                          <span className="text-gray-500">{m.month}</span>
                          <span className="font-semibold text-gray-700">{fmtBRL(m.expense)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <TrendingUp className="w-12 h-12 text-gray-200 mb-3" />
                <p className="text-sm text-gray-400">Sem dados suficientes para previsão.</p>
                <p className="text-xs text-gray-300 mt-1">
                  Registre mais transações para ativar essa análise.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
