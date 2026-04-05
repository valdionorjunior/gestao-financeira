/**
 * Converte uma string de data "YYYY-MM-DD" para Date preservando a data sem ajuste de timezone.
 * Importante: Evita o problema onde new Date("2026-04-01") é interpretado como UTC
 * e convertido para a data anterior em timezones negativas (ex: UTC-3).
 *
 * @param dateStr String de data no formato "YYYY-MM-DD" ou ISO completo
 * @returns Date interpretada corretamente sem ajuste de timezone localizado
 */
export function parseDateString(dateStr: string): Date {
  if (!dateStr) return new Date();
  
  // Se for data ISO completo com hora, usar normalmente
  if (dateStr.includes('T')) {
    return new Date(dateStr);
  }
  
  // Se for apenas data "YYYY-MM-DD", parsear manualmente para evitar timezone shift
  const [year, month, day] = dateStr.split('-').map(Number);
  
  // Criar Date usando UTC para manter a data exata
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Formata uma Date para string "YYYY-MM-DD" (apenas data, sem hora)
 * Útil para armazenar e comparar datas sem considerar hora/timezone.
 *
 * @param date Date a formatar
 * @returns String no formato "YYYY-MM-DD"
 */
export function formatDateOnly(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
