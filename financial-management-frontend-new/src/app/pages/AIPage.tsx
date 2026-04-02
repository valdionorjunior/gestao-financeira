import { FC, useState, useEffect } from 'react'
import { Zap, TrendingUp, AlertCircle, Lightbulb } from 'lucide-react'

interface Insight {
  id: string
  title: string
  description: string
  type: 'tip' | 'warning' | 'opportunity'
  icon: typeof Lightbulb
}

export const AIPage: FC = () => {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simular carregamento de insights
    setTimeout(() => {
      setInsights([
        {
          id: '1',
          title: 'Economia em Alimentação',
          description: 'Você gastou 15% menos em alimentação este mês comparado ao anterior. Continue assim!',
          type: 'opportunity',
          icon: TrendingUp,
        },
        {
          id: '2',
          title: 'Alerta de Transporte',
          description: 'Seus gastos com transporte estão 25% acima da média. Considere alternativas.',
          type: 'warning',
          icon: AlertCircle,
        },
        {
          id: '3',
          title: 'Dica de Economia',
          description: 'Baseado em seus padrões, você poderia economizar R$ 500 por mês em assinaturas não utilizadas.',
          type: 'tip',
          icon: Lightbulb,
        },
        {
          id: '4',
          title: 'Meta em Dia',
          description: 'Parabéns! Você está 85% do caminho para atingir sua meta de economias para este trimestre.',
          type: 'opportunity',
          icon: TrendingUp,
        },
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const getInsightStyles = (type: string) => {
    switch (type) {
      case 'warning':
        return 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20'
      case 'opportunity':
        return 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
      case 'tip':
      default:
        return 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20'
    }
  }

  const getIconColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400'
      case 'opportunity':
        return 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
      case 'tip':
      default:
        return 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Zap className="text-yellow-500" size={32} />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Inteligência Artificial</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Recomendações inteligentes baseadas em análise de seus dados financeiros
        </p>
      </div>

      {/* Resumo Executivo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">Taxa de Economia</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">42.6%</p>
          <p className="text-xs text-gray-500 mt-2">Acima da média</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">Categoria Top</p>
          <p className="text-2xl font-bold text-green-600 mt-2">Alimentação</p>
          <p className="text-xs text-gray-500 mt-2">29% do orçamento</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">Alertas</p>
          <p className="text-3xl font-bold text-yellow-600 mt-2">2</p>
          <p className="text-xs text-gray-500 mt-2">Requer atenção</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">Economia Potencial</p>
          <p className="text-2xl font-bold text-green-600 mt-2">R$ 500/mês</p>
          <p className="text-xs text-gray-500 mt-2">Assinaturas</p>
        </div>
      </div>

      {/* Insights Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recomendações Personalizadas</h2>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-2xl h-32 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4">
            {insights.map((insight) => {
              const Icon = insight.icon
              return (
                <div
                  key={insight.id}
                  className={`border-2 rounded-2xl p-6 transition-all hover:shadow-lg ${getInsightStyles(
                    insight.type,
                  )}`}
                >
                  <div className="flex gap-4">
                    <div className={`p-3 rounded-xl h-fit ${getIconColor(insight.type)}`}>
                      <Icon size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{insight.title}</h3>
                      <p className="text-gray-700 dark:text-gray-300 mt-2">{insight.description}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg p-8 text-white">
        <div className="max-w-2xl">
          <h3 className="text-2xl font-bold mb-3">Quer saber mais?</h3>
          <p className="mb-6 opacity-90">
            Solicite uma análise detalhada de seus dados. Nossa IA irá gerar um relatório completo com
            estratégias personalizadas para otimizar sua situação financeira.
          </p>
          <button className="px-6 py-3 bg-white text-blue-600 rounded-lg font-medium hover:shadow-lg transition-all">
            Gerar Análise Completa
          </button>
        </div>
      </div>
    </div>
  )
}
