export function formatCurrency(value: number, currency: string = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(value)
}

export function formatDate(date: string | Date): string {
  let dateObj: Date;
  
  if (typeof date === 'string') {
    // Parse ISO string without timezone conversion
    // If it's "2026-04-01T00:00:00.000Z", extract just the date part
    const dateMatch = date.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (dateMatch) {
      const [, year, month, day] = dateMatch
      // Use UTC to avoid timezone shift
      dateObj = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)))
    } else {
      dateObj = new Date(date)
    }
  } else {
    dateObj = date
  }
  
  // Format using UTC to avoid timezone conversion
  const year = dateObj.getUTCFullYear()
  const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0')
  const day = String(dateObj.getUTCDate()).padStart(2, '0')
  
  return `${day}/${month}/${year}`
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`
}

export function truncateText(text: string, length: number): string {
  return text.length > length ? `${text.substring(0, length)}...` : text
}
