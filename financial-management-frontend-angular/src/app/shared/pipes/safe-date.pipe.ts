import { Pipe, PipeTransform } from '@angular/core'

/**
 * Safe date pipe that handles ISO date strings without timezone conversion
 * Formats as dd/MM/yyyy
 */
@Pipe({
  name: 'safeDate',
  standalone: true,
})
export class SafeDatePipe implements PipeTransform {
  transform(value: string | Date | null | undefined, format?: string): string | null {
    if (!value) return null

    let date: Date

    if (typeof value === 'string') {
      // Extract date part if it's an ISO string
      const dateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
      if (dateMatch) {
        const [, year, month, day] = dateMatch
        // Use UTC to avoid timezone shift
        date = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)))
      } else {
        date = new Date(value)
      }
    } else {
      date = value
    }

    // Format using UTC to avoid timezone conversion
    const year = date.getUTCFullYear()
    const month = String(date.getUTCMonth() + 1).padStart(2, '0')
    const day = String(date.getUTCDate()).padStart(2, '0')

    return `${day}/${month}/${year}`
  }
}
