/**
 * Formatadores para valores financeiros
 */

export function formatCurrency(
  value: number,
  currency: 'BRL' | 'USD' = 'BRL',
  decimals: number = 2
): string {
  const locale = currency === 'BRL' ? 'pt-BR' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatNumber(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function parseCurrencyInput(value: string): number {
  const cleaned = value.replace(/[^\d,.-]/g, '').replace('.', '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

export function getCurrencySymbol(currency: 'BRL' | 'USD' = 'BRL'): string {
  return currency === 'BRL' ? 'R$' : '$';
}

export function abbreviateNumber(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}k`;
  }
  return value.toString();
}
