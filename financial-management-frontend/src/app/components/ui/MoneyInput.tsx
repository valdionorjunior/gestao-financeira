import React, { useState } from 'react';
import { cn } from '../../utils/cn';
import { parseCurrencyInput, formatCurrency } from '../../utils/formatters';

interface MoneyInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  currency?: 'BRL' | 'USD';
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export function MoneyInput({
  label,
  value,
  currency = 'BRL',
  error,
  helperText,
  icon,
  onChange,
  ...props
}: MoneyInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const normalizedValue = parseCurrencyInput(e.target.value);
    onChange?.({
      ...e,
      target: {
        ...e.target,
        value: normalizedValue.toString(),
      },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const displayValue = value ? formatCurrency(Number(value), currency) : '';

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
        {label}
      </label>

      <div
        className={cn(
          'relative flex items-center rounded-xl border-2 transition-all duration-200',
          'bg-white dark:bg-slate-800',
          isFocused
            ? 'border-blue-500 ring-2 ring-blue-500/10'
            : error
              ? 'border-rose-300 dark:border-rose-600'
              : 'border-gray-300 dark:border-slate-600 hover:border-gray-400 dark:hover:border-slate-500',
          'focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10'
        )}
      >
        {icon && (
          <div className="pl-4 text-gray-500 dark:text-gray-400">
            {icon}
          </div>
        )}
        <input
          type="text"
          value={displayValue}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            'flex-1 px-4 py-3 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400',
            'focus:outline-none text-right',
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
