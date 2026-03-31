import React from 'react';
import { cn } from '../../utils/cn';
import { formatCurrency } from '../../utils/formatters';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: number;
  currency?: 'BRL' | 'USD';
  trend?: {
    percentage: number;
    direction: 'up' | 'down';
    period: string;
  };
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  onClick?: () => void;
}

const variantClasses = {
  default: 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700',
  success: 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800',
  warning: 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800',
  danger: 'bg-rose-50 dark:bg-rose-950 border-rose-200 dark:border-rose-800',
  info: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
};

const iconVariants = {
  default: 'bg-gradient-to-r from-blue-500 to-blue-600',
  success: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
  warning: 'bg-gradient-to-r from-amber-500 to-amber-600',
  danger: 'bg-gradient-to-r from-rose-500 to-rose-600',
  info: 'bg-gradient-to-r from-cyan-500 to-blue-600',
};

const trendVariants = {
  up: 'text-emerald-600 dark:text-emerald-400',
  down: 'text-rose-600 dark:text-rose-400',
};

export function KPICard({
  title,
  value,
  currency = 'BRL',
  trend,
  icon,
  variant = 'default',
  onClick,
}: KPICardProps) {
  const formattedValue = formatCurrency(value, currency);

  return (
    <div
      onClick={onClick}
      className={cn(
        'p-6 rounded-2xl border shadow-lg hover:shadow-xl',
        'transition-all duration-200 cursor-pointer',
        variantClasses[variant]
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </h3>
        {icon && (
          <div className={cn(
            'p-3 rounded-xl text-white shadow-md',
            iconVariants[variant]
          )}>
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      <div className="mb-3">
        <p className="text-3xl font-bold text-gray-900 dark:text-white">
          {formattedValue}
        </p>
      </div>

      {/* Trend */}
      {trend && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {trend.direction === 'up' ? (
              <TrendingUp className={cn('w-4 h-4', trendVariants.up)} />
            ) : (
              <TrendingDown className={cn('w-4 h-4', trendVariants.down)} />
            )}
            <span className={cn('font-semibold text-sm', trendVariants[trend.direction])}>
              {Math.abs(trend.percentage)}%
            </span>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {trend.period}
          </span>
        </div>
      )}
    </div>
  );
}
