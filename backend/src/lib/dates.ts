/** Returns the start of the day (00:00:00.000) for a given date. */
export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Returns the end of the day (23:59:59.999) for a given date. */
export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/** Adds (or subtracts) days from a date. */
export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Formats a date as YYYY-MM-DD. */
export function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Parses a YYYY-MM-DD string (or ISO) into a Date, defaulting to now. */
export function parseDate(value?: string): Date {
  if (!value) return new Date();
  const d = new Date(value);
  if (isNaN(d.getTime())) return new Date();
  return d;
}
