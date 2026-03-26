---
name: frontend-financeiro
description: "Desenvolvimento de interfaces financeiras com React, Tailwind CSS e Soft UI Dashboard. Use when: criar componentes financeiros, dashboards de gestão, formulários de transação, tabelas de dados financeiros, gráficos, cards de resumo, layouts responsivos, validação de formulários monetários, formatação de moeda, estados de loading."
---

# Skill: Frontend de Sistemas Financeiros

## Quando Usar

Esta skill se aplica quando você está:
- Criando dashboards financeiros
- Desenvolvendo formulários de transação, orçamento ou metas
- Implementando tabelas de dados financeiros com filtros
- Criando cards de resumo (KPIs, saldos, indicadores)
- Implementando gráficos financeiros (pizza, barras, linhas)
- Formatando valores monetários e percentuais
- Validando inputs financeiros em tempo real
- Aplicando design system baseado no Soft UI Dashboard Tailwind

## Referência Obrigatória de UI/UX

**Soft UI Dashboard Tailwind**
- Demo: https://demos.creative-tim.com/soft-ui-dashboard-tailwind/
- Priorizar: cards com sombras suaves, bordas arredondadas, hierarquia visual clara
- Paleta: tons suaves, contrastes adequados, feedbacks visuais
- Componentes: botões com gradientes, inputs com focus rings, tabelas limpas

## Stack e Ferramentas

```javascript
// Core
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

// Styling
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Forms
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Charts (quando necessário)
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie, Line, Bar } from 'react-chartjs-2';

// Formatação
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
```

## Componentes Base Financeiros

### 1. Card de KPI Financeiro

```tsx
interface FinancialKPICardProps {
  title: string;
  value: number;
  currency?: string;
  trend?: {
    percentage: number;
    direction: 'up' | 'down';
    period: string;
  };
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export function FinancialKPICard({
  title,
  value,
  currency = 'BRL',
  trend,
  icon: Icon,
  variant = 'default'
}: FinancialKPICardProps) {
  const formattedValue = formatCurrency(value, currency);
  
  const variantClasses = {
    default: 'bg-white border-gray-200',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    danger: 'bg-red-50 border-red-200'
  };

  return (
    <div className={cn(
      "p-6 rounded-2xl border shadow-lg background-blur-sm",
      variantClasses[variant]
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-medium text-gray-600">
          {title}
        </div>
        {Icon && (
          <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl text-white">
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
      
      <div className="text-2xl font-bold text-gray-900 mb-2">
        {formattedValue}
      </div>
      
      {trend && (
        <div className="flex items-center text-sm">
          <span className={cn(
            "font-medium",
            trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
          )}>
            {trend.direction === 'up' ? '↗' : '↘'} {trend.percentage}%
          </span>
          <span className="text-gray-500 ml-2">{trend.period}</span>
        </div>
      )}
    </div>
  );
}
```

### 2. Input Monetário

```tsx
interface MoneyInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  currency?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}

export function MoneyInput({
  label,
  value,
  onChange,
  currency = 'BRL',
  placeholder,
  error,
  disabled
}: MoneyInputProps) {
  const [displayValue, setDisplayValue] = useState('');
  
  useEffect(() => {
    setDisplayValue(formatCurrencyInput(value));
  }, [value]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const numericValue = parseCurrencyInput(rawValue);
    
    setDisplayValue(formatCurrencyInput(numericValue));
    onChange(numericValue);
  };
  
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="text-gray-500 sm:text-sm">{getCurrencySymbol(currency)}</span>
        </div>
        
        <input
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            "block w-full pl-8 pr-3 py-3 border rounded-xl text-gray-900",
            "focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            "bg-white shadow-sm transition-all duration-200",
            error ? "border-red-300 focus:ring-red-500" : "border-gray-300",
            disabled && "bg-gray-50 text-gray-500 cursor-not-allowed"
          )}
        />
      </div>
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
```

### 3. Tabela de Transações

```tsx
interface TransactionTableProps {
  transactions: Transaction[];
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transactionId: string) => void;
  loading?: boolean;
}

export function TransactionTable({
  transactions,
  onEdit,
  onDelete,
  loading
}: TransactionTableProps) {
  if (loading) {
    return <TransactionTableSkeleton />;
  }
  
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Transações</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Descrição
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Categoria
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

## Validação e Formatação

### Schemas Zod para Formulários Financeiros

```typescript
export const transactionSchema = z.object({
  description: z.string()
    .min(1, "Descrição é obrigatória")
    .max(255, "Descrição deve ter no máximo 255 caracteres"),
    
  amount: z.number()
    .positive("Valor deve ser positivo")
    .multipleOf(0.01, "Valor deve ter no máximo 2 casas decimais")
    .max(999999999.99, "Valor muito alto"),
    
  categoryId: z.string()
    .uuid("Categoria inválida"),
    
  accountId: z.string()
    .uuid("Conta inválida"),
    
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
    
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"])
});

export type TransactionFormData = z.infer<typeof transactionSchema>;
```

### Utilitários de Formatação

```typescript
export const formatCurrency = (value: number, currency = 'BRL'): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

export const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value / 100);
};

export const parseCurrencyInput = (input: string): number => {
  const cleaned = input.replace(/[^\d,.-]/g, '');
  const normalized = cleaned.replace(',', '.');
  const parsed = parseFloat(normalized) || 0;
  return Math.round(parsed * 100) / 100;
};

export const cn = (...classes: (string | undefined | boolean)[]): string => {
  return twMerge(clsx(classes));
};
```

## Hooks Personalizados

### useFinancialData Hook

```typescript
export function useFinancialData(userId: string) {
  const [data, setData] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      const summary = await financialAPI.getSummary(userId);
      setData(summary);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [userId]);
  
  useEffect(() => {
    refreshData();
  }, [refreshData]);
  
  return { data, loading, error, refreshData };
}
```

## Layout e Navegação

### Dashboard Layout

```tsx
export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="lg:pl-64">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <TopBar />
          </div>
        </header>
        
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
```

## Estados e Loading

### Estados de Loading Consistentes

```tsx
export function LoadingCard() {
  return (
    <div className="animate-pulse">
      <div className="bg-white p-6 rounded-2xl shadow-lg">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
      </div>
    </div>
  );
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="w-24 h-24 mx-auto mb-4 text-gray-300">
        <EmptyIcon />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-6 max-w-sm mx-auto">{description}</p>
      {action}
    </div>
  );
}
```

## Checklist de Implementação

- [ ] Valores monetários sempre formatados com Intl.NumberFormat
- [ ] Inputs monetários validados em tempo real
- [ ] Esquema de cores e componentes seguem Soft UI Dashboard
- [ ] Loading states para todas as operações assíncronas
- [ ] Estados vazios informativos com CTAs claras
- [ ] Responsividade mobile-first
- [ ] Acessibilidade básica (ARIA labels, keyboard navigation)
- [ ] Formulários com validação Zod + React Hook Form
- [ ] Feedback visual para sucessos e erros
- [ ] Performance otimizada com React.memo quando necessário

## Anti-Patterns a Evitar

- **Number primitives para moeda**: Sempre usar formatação adequada
- **Hardcoded colors**: Usar classes Tailwind consistentes
- **Inline styles**: Preferir classes utilitárias
- **Loading sem skeleton**: Estados de loading devem manter layout
- **Formulários sem validação**: Todo input financeiro deve ser validado
- **Mobile afterthought**: Design mobile-first obrigatório