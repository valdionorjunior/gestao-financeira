import { formatDateOnly, parseDateString } from './date.utils';

/**
 * Convert all Date fields to 'YYYY-MM-DD' strings before saving to database
 * This prevents timezone conversion issues when storing dates
 */
export function convertDatesToStrings<T>(data: Partial<T>, dateFields: (keyof T)[]): Partial<T> {
  const converted = { ...data };
  
  dateFields.forEach((field) => {
    if (field in converted) {
      const value = converted[field];
      if (value instanceof Date) {
        (converted[field] as any) = formatDateOnly(value);
      }
    }
  });
  
  return converted;
}

/**
 * Convert date strings from database back to Date objects
 * This ensures dates are properly serialized as ISO strings in JSON responses
 */
export function convertStringsToDate<T>(data: Partial<T>, dateFields: (keyof T)[]): Partial<T> {
  const converted = { ...data };
  
  dateFields.forEach((field) => {
    if (field in converted) {
      const value = converted[field];
      // If it's a string that looks like a YYYY-MM-DD date, parse it
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        (converted[field] as any) = parseDateString(value);
      }
    }
  });
  
  return converted;
}
