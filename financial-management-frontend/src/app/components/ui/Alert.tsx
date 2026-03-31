import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '../../utils/cn';

type AlertVariant = 'success' | 'error' | 'warning' | 'info';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  closable?: boolean;
}

const variantClasses: Record<AlertVariant, string> = {
  success:
    'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300',
  error:
    'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300',
  warning:
    'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300',
  info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300',
};

const iconMap: Record<AlertVariant, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5 flex-shrink-0" />,
  error: <AlertCircle className="w-5 h-5 flex-shrink-0" />,
  warning: <AlertTriangle className="w-5 h-5 flex-shrink-0" />,
  info: <Info className="w-5 h-5 flex-shrink-0" />,
};

export function Alert({
  variant = 'info',
  title,
  children,
  onClose,
  closable = true,
}: AlertProps) {
  return (
    <div className={cn('p-4 rounded-lg border flex gap-3', variantClasses[variant])}>
      <div className="flex-shrink-0">{iconMap[variant]}</div>
      <div className="flex-1">
        {title && <p className="font-semibold mb-1">{title}</p>}
        <p className="text-sm">{children}</p>
      </div>
      {closable && onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
