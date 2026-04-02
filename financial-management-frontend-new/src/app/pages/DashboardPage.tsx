import { FC, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Wallet, TrendingUp, Zap, CreditCard, Sparkles, TrendingDown, ArrowRightLeft } from 'lucide-react'
import { KPICard } from '../components/KPICard'
import { Chart } from '../components/Chart'
import { apiClient } from '../services/api'
import { FinancialSummary, MonthlyReport, Transaction, FinancialInsight, ExpensePrediction } from '../types'
import { formatDate, formatCurrency } from '../utils/formatters'

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function txTypeBadge(type: string) {
  if (type === 'INCOME')   return { label: 'Receita',   cls: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' }
  if (type === 'EXPENSE')  return { label: 'Despesa',   cls: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' }
  if (type === 'TRANSFER') return { label: 'Transfer.', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' }
  return { label: type, cls: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' }
}

function insightStyle(type: string) {
  if (type === 'WARNING') return { bg: 'bg-amber-50 dark:bg-amber-900/20',  border: 'border-amber-200 dark:border-amber-700/40',  icon: '⚠️' }
  if (type === 'SUCCESS') return { bg: 'bg-green-50 dark:bg-green-900/20',  border: 'border-green-200 dark:border-green-700/40',  icon: '✅' }
  return                         { bg: 'bg-blue-50  dark:bg-blue-900/20',   border: 'border-blue-200  dark:border-blue-700/40',   icon: '💡' }
}

function formatPredictMonth(month: string) {
  const [year, m] = month.split('-')
  return `${MONTH_NAMES[Number(m) - 1]}/${year.slice(2)}`
}

export const DashboardPage: FC = () => {
  const [summary, setSummary] = useState<FinancialSummary | null>(null)
  const [monthlyReports, setMonthlyReports] = useState<{ name: string; Receita: number; Despesa: number }[]>([])
  const [recentTx, setRecentTx] = useState<Transaction[]>([])
  const [insights, setInsights] = useState<FinancialInsight[]>([])
  const [prediction, setPrediction] = useState<ExpensePrediction | null>(null)
  const [loadingCashFlow, setLoadingCashFlow] = useState(true)
  const [loadingTx, setLoadingTx] = useState(true)
  const [loadingInsights, setLoadingInsights] = useState(true)
  const [loadingPredict, setLoadingPredict] = useState(true)

  useEffect(() => {
    const now = new Date()

    apiClient.getFinancialSummary().then(setSummary).catch(console.error)

    const monthPromises: Promise<MonthlyReport>[] = []
    for (let i = 4; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      monthPromises.push(apiClient.getMonthlyReport(d.getFullYear(), d.getMonth() + 1))
    }
    Promise.all(monthPromises)
      .then(reports =>
        setMonthlyReports(reports.map(r => ({
          name: MONTH_NAMES[r.period.month - 1],
          Receita: r.income,
          Despesa: r.expense,
        })))
      )
      .catch(console.error)
      .finally(() => setLoadingCashFlow(false))

    apiClient.getTransactions({ limit: 5, page: 1 })
      .then(res => setRecentTx(res.data ?? []))
      .catch(() => setRecentTx([]))
      .finally(() => setLoadingTx(false))

    apiClient.getFinancialInsights()
      .then(data => setInsights(Array.isArray(data) ? data : []))
      .catch(() => setInsights([]))
      .finally(() => setLoadingInsights(false))

    apiClient.getExpensePrediction()
      .then(setPrediction)
      .catch(() => setPrediction(null))
      .finally(() => setLoadingPredict(false))
  }, [])

  const categoryPieData = summary?.budgetAlerts?.length
    ? summary.budgetAlerts.map(b => ({ name: b.categoryId, value: b.percentUsed }))
    : []

  return (
    <div className="space-y-6">

      {/* ── KPI Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Saldo Total"     value={summary?.totalBalance   ?? 0} icon={Wallet}    variant="default" />
        <KPICard title="Receita (Mês)"   value={summary?.monthlyIncome  ?? 0} icon={TrendingUp} variant="success" />
        <KPICard title="Despesa (Mês)"   value={summary?.monthlyExpense ?? 0} icon={CreditCard} variant="danger" />
        <KPICard title="Contas Ativas"   value={summary?.accountsCount  ?? 0} icon={Zap}        variant="warning" />
      </div>

      {/* ── Economia do mês + Metas ─────────────────────────── */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-800">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Economia (Mês)</p>
            <p className={`text-3xl font-bold mt-2 ${summary.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(summary.netBalance)}
            </p>
            <p className="text-xs text-gray-500 mt-2">{formatDate(summary.month + '-01')}</p>
          </div>

          {summary.goalsSummary.total > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-800">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Metas Ativas</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{summary.goalsSummary.total}</p>
              {summary.goalsSummary.nearDue.length > 0 && (
                <p className="text-xs text-yellow-600 mt-2">
                  {summary.goalsSummary.nearDue.length} vencendo em 30 dias
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Charts ──────────────────────────────────────────── */}
      {!loadingCashFlow && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Chart
              title="Receita vs Despesa (Últimos 5 Meses)"
              data={monthlyReports}
              type="bar"
              dataKey={['Receita', 'Despesa']}
              xAxisKey="name"
              colors={['#16a34a', '#ef4444']}
            />
          </div>
          <div>
            <Chart
              title="Alertas de Orçamento"
              data={categoryPieData.length > 0 ? categoryPieData : [{ name: 'Sem alertas', value: 1 }]}
              type="pie"
              dataKey="value"
              colors={['#ef4444', '#f59e0b', '#0284c7', '#16a34a']}
            />
          </div>
        </div>
      )}

      {!loadingCashFlow && monthlyReports.length > 0 && (
        <Chart
          title="Tendência de Receita e Despesa"
          data={monthlyReports}
          type="line"
          dataKey={['Receita', 'Despesa']}
          xAxisKey="name"
          colors={['#16a34a', '#ef4444']}
        />
      )}

      {/* ── Últimas Transações + Insights IA ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Últimas Transações */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <h3 className="font-bold text-gray-800 dark:text-gray-100">Últimas Transações</h3>
            <Link to="/transactions" className="text-sm text-violet-600 font-semibold hover:underline flex items-center gap-1">
              Ver todas <ArrowRightLeft size={13} />
            </Link>
          </div>

          {loadingTx ? (
            <div className="p-6 space-y-3">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : recentTx.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-gray-400">
              <ArrowRightLeft size={32} />
              <p className="text-sm">Nenhuma transação encontrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/60 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    <th className="px-6 py-3 text-left font-semibold">Data</th>
                    <th className="px-6 py-3 text-left font-semibold">Descrição</th>
                    <th className="px-6 py-3 text-left font-semibold">Tipo</th>
                    <th className="px-6 py-3 text-right font-semibold">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {recentTx.map(tx => {
                    const badge = txTypeBadge(tx.type)
                    return (
                      <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                        <td className="px-6 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDate(tx.date)}</td>
                        <td className="px-6 py-3 text-gray-700 dark:text-gray-200 max-w-[180px] truncate">{tx.description || '—'}</td>
                        <td className="px-6 py-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge.cls}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className={`px-6 py-3 text-right font-bold whitespace-nowrap ${
                          tx.type === 'INCOME' ? 'text-green-600' : tx.type === 'EXPENSE' ? 'text-red-600' : 'text-blue-600'
                        }`}>
                          {tx.type === 'INCOME' ? '+' : tx.type === 'EXPENSE' ? '-' : ''}
                          {formatCurrency(tx.amount)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Insights IA */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <Sparkles size={16} className="text-violet-500" />
            <h3 className="font-bold text-gray-800 dark:text-gray-100">Insights IA</h3>
          </div>

          {loadingInsights ? (
            <div className="p-6 space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : insights.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-gray-400">
              <Sparkles size={32} />
              <p className="text-sm">Nenhum insight disponível</p>
            </div>
          ) : (
            <div className="p-4 flex flex-col gap-3">
              {insights.map((ins, i) => {
                const s = insightStyle(ins.type)
                return (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${s.bg} ${s.border}`}>
                    <span className="text-base shrink-0 mt-0.5">{s.icon}</span>
                    <p className="text-xs text-gray-700 dark:text-gray-200 leading-relaxed">{ins.message}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>

      {/* ── Previsão de Gastos ──────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <TrendingDown size={16} className="text-violet-500" />
            <h3 className="font-bold text-gray-800 dark:text-gray-100">Previsão de Gastos</h3>
          </div>
          <Link to="/ai" className="text-sm text-violet-600 font-semibold hover:underline flex items-center gap-1">
            Ver IA <Sparkles size={13} />
          </Link>
        </div>

        {loadingPredict ? (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-28 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
            <div className="h-28 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          </div>
        ) : !prediction ? (
          <div className="flex flex-col items-center gap-2 py-12 text-gray-400">
            <TrendingDown size={32} />
            <p className="text-sm text-center px-8">Dados insuficientes para previsão. Continue registrando suas transações!</p>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Estimativa destaque */}
            <div className="flex flex-col items-center justify-center text-center gap-2 p-6 rounded-xl bg-gradient-to-br from-violet-50 to-cyan-50 dark:from-violet-900/20 dark:to-cyan-900/20 border border-violet-200/60 dark:border-violet-700/30">
              <p className="text-xs font-semibold text-violet-600 uppercase tracking-wide">Estimativa para o próximo mês</p>
              <p className="text-3xl font-bold text-violet-700 dark:text-violet-400">
                {formatCurrency(prediction.predictedNextMonth)}
              </p>
            </div>

            {/* Histórico */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Histórico</p>
              <div className="flex flex-col gap-2">
                {prediction.history.map(h => (
                  <div key={h.month} className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">{formatPredictMonth(h.month)}</span>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{formatCurrency(h.expense)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}

