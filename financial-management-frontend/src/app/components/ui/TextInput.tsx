import React from 'react';
import { cn } from '../../utils/cn';

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export function TextInput({
  label,
  error,
  helperText,
  icon,
  ...props
}: TextInputProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      <div className={cn(
        'relative flex items-center rounded-xl border-2 transition-all duration-200',
        'bg-white dark:bg-slate-800',
        error
          ? 'border-rose-300 dark:border-rose-600'
          : 'border-gray-300 dark:border-slate-600 hover:border-gray-400 dark:hover:border-slate-500 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10'
      )}>
        {icon && (
          <div className="pl-4 text-gray-500 dark:text-gray-400">
            {icon}
          </div>
        )}
        <input
          className={cn(
            'flex-1 px-4 py-3 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400',
            'focus:outline-none',
            props.disabled && 'opacity-50 cursor-not-allowed'
          )}
          {...props}
        />
      </div>

      {error ? (
        <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
      ) : helperText ? (
        <p className="text-sm text-gray-600 dark:text-gray-400">{helperText}</p>
      ) : null}
    </div>
  );
}
