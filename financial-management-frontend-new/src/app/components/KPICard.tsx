import { FC } from 'react'
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '../utils/cn'
import { formatCurrency } from '../utils/formatters'

interface KPICardProps {
  title: string
  value: number
  currency?: string
  trend?: {
    percentage: number
    direction: 'up' | 'down'
    period: string
  }
  icon?: LucideIcon
  variant?: 'default' | 'success' | 'warning' | 'danger'
  className?: string
}

export const KPICard: FC<KPICardProps> = ({
  title,
  value,
  currency = 'BRL',
  trend,
  icon: Icon,
  variant = 'default',
  className,
}) => {
  const variantClasses = {
    default: 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800',
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    danger: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  }

  const iconVariantClasses = {
    default: 'bg-gradient-to-r from-blue-500 to-blue-600',
    success: 'bg-gradient-to-r from-green-500 to-green-600',
    warning: 'bg-gradient-to-r from-yellow-500 to-yellow-600',
    danger: 'bg-gradient-to-r from-red-500 to-red-600',
  }

  return (
    <div
      className={cn(
        'p-6 rounded-2xl border shadow-lg transition-all duration-200 hover:shadow-xl',
        variantClasses[variant],
        className,
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
        </div>
        {Icon && (
          <div className={cn(
            'p-3 rounded-xl text-white',
            iconVariantClasses[variant],
          )}>
            <Icon size={24} />
          </div>
        )}
      </div>

      <div className="mb-4">
        <p className="text-3xl font-bold text-gray-900 dark:text-white">
          {formatCurrency(value, currency)}
        </p>
      </div>

      {trend && (
        <div className="flex items-center gap-2 text-sm">
          <div
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-lg',
              trend.direction === 'up'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
            )}
          >
            {trend.direction === 'up' ? (
              <TrendingUp size={16} />
            ) : (
              <TrendingDown size={16} />
            )}
            <span className="font-medium">{Math.abs(trend.percentage)}%</span>
          </div>
          <span className="text-gray-500 dark:text-gray-400">{trend.period}</span>
        </div>
      )}
    </div>
  )
}
