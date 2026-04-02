import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatCurrency = (value: number, currency = 'BRL'): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100)
}

export const parseCurrencyInput = (input: string): number => {
  const cleaned = input.replace(/[^\d,.-]/g, '')
  const normalized = cleaned.replace(',', '.')
  const parsed = parseFloat(normalized) || 0
  return Math.round(parsed * 100) / 100
}

export const getCurrencySymbol = (currency = 'BRL'): string => {
  const symbols: Record<string, string> = {
    BRL: 'R$',
    USD: '$',
    EUR: '€',
  }
  return symbols[currency] || currency
}

export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('pt-BR')
}

export const formatDateTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('pt-BR')
}

export const isDateToday = (date: string | Date): boolean => {
  const d = typeof date === 'string' ? new Date(date) : date
  const today = new Date()
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  )
}

export const getTrendDirection = (current: number, previous: number): 'up' | 'down' | 'neutral' => {
  if (current > previous) return 'up'
  if (current < previous) return 'down'
  return 'neutral'
}

export const calculateTrendPercentage = (current: number, previous: number): number => {
  if (previous === 0) return 0
  return Math.round(((current - previous) / Math.abs(previous)) * 10000) / 100
}
