import React from 'react';
import { cn } from '../../utils/cn';

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
}

const variantClasses = {
  default: 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200',
  success: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300',
  warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300',
  danger: 'bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300',
  info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
};

export function Badge({
  variant = 'default',
  size = 'md',
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-block font-semibold rounded-full',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {children}
    </span>
  );
}
