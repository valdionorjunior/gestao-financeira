import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700',
        'rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-200',
        'p-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function CardHeader({ children, title, subtitle, className, ...props }: CardHeaderProps) {
  return (
    <div className={cn('pb-4 border-b border-gray-200 dark:border-slate-700', className)} {...props}>
      {title && <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>}
      {subtitle && <p className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>}
      {children}
    </div>
  );
}

interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardBody({ children, className, ...props }: CardBodyProps) {
  return (
    <div className={cn('pt-4', className)} {...props}>
      {children}
    </div>
  );
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardFooter({ children, className, ...props }: CardFooterProps) {
  return (
    <div className={cn('pt-4 border-t border-gray-200 dark:border-slate-700 flex justify-end gap-2', className)} {...props}>
      {children}
    </div>
  );
}
