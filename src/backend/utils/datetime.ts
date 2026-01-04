/* FILE: src/server/utils/datetime.ts */
/**
 * Jakarta Timezone Utilities
 * 
 * Centralized datetime handling for Waitless backend.
 * Currently hardcoded to Jakarta (WIB, UTC+7) timezone.
 * Future enhancement: Make timezone configurable per location.
 */

// Jakarta timezone offset in hours
const JAKARTA_OFFSET_HOURS = 7;
const JAKARTA_OFFSET_MS = JAKARTA_OFFSET_HOURS * 60 * 60 * 1000;

/**
 * Get the current time in Jakarta timezone
 */
export function getJakartaNow(): Date {
  const now = new Date();
  return new Date(now.getTime() + JAKARTA_OFFSET_MS);
}

/**
 * Get current Jakarta date as YYYY-MM-DD string
 */
export function getJakartaDateString(): string {
  const jakartaTime = getJakartaNow();
  return jakartaTime.toISOString().split('T')[0];
}

/**
 * Get current Jakarta time as HH:MM:SS string
 */
export function getJakartaTimeString(): string {
  const jakartaTime = getJakartaNow();
  return jakartaTime.toISOString().split('T')[1].slice(0, 8);
}

/**
 * Convert any date to Jakarta timezone
 */
export function toJakartaTime(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Date(d.getTime() + JAKARTA_OFFSET_MS);
}

/**
 * Get start of day in Jakarta timezone (00:00:00)
 */
export function getJakartaStartOfDay(date?: Date | string): Date {
  const jakartaDate = date ? toJakartaTime(date) : getJakartaNow();
  const dateStr = jakartaDate.toISOString().split('T')[0];
  return new Date(`${dateStr}T00:00:00.000Z`);
}

/**
 * Get end of day in Jakarta timezone (23:59:59.999)
 */
export function getJakartaEndOfDay(date?: Date | string): Date {
  const jakartaDate = date ? toJakartaTime(date) : getJakartaNow();
  const dateStr = jakartaDate.toISOString().split('T')[0];
  return new Date(`${dateStr}T23:59:59.999Z`);
}

/**
 * Get Jakarta hour (0-23)
 */
export function getJakartaHour(): number {
  return getJakartaNow().getUTCHours();
}

/**
 * Get Jakarta minute (0-59)
 */
export function getJakartaMinute(): number {
  return getJakartaNow().getUTCMinutes();
}

/**
 * Get Jakarta day of week (0 = Sunday, 6 = Saturday)
 */
export function getJakartaDayOfWeek(): number {
  return getJakartaNow().getUTCDay();
}

/**
 * Check if current Jakarta time is within business hours
 */
export function isJakartaBusinessHours(
  openTime: string = '08:00:00',
  closeTime: string = '17:00:00'
): boolean {
  const currentTime = getJakartaTimeString();
  return currentTime >= openTime && currentTime <= closeTime;
}

/**
 * Check if time string is within range
 */
export function isWithinTimeRange(
  time: string,
  startTime: string,
  endTime: string
): boolean {
  return time >= startTime && time <= endTime;
}

/**
 * Format date for display in Indonesian format
 */
export function formatJakartaDate(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    ...options,
  });
}

/**
 * Format time for display in Indonesian format
 */
export function formatJakartaTime(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  });
}

/**
 * Format datetime for display in Indonesian format
 */
export function formatJakartaDateTime(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  });
}

/**
 * Parse date string to Date object
 * Handles various input formats
 */
export function parseDate(dateStr: string): Date {
  // If it's already ISO format, parse directly
  if (dateStr.includes('T') || dateStr.includes('Z')) {
    return new Date(dateStr);
  }
  
  // If it's YYYY-MM-DD format, add time
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(`${dateStr}T00:00:00.000Z`);
  }
  
  // Try to parse as-is
  return new Date(dateStr);
}

/**
 * Get date string for database query (YYYY-MM-DD)
 * Uses Jakarta timezone
 */
export function getTodayForDb(): string {
  return getJakartaDateString();
}

/**
 * Get yesterday's date string for database query
 */
export function getYesterdayForDb(): string {
  const jakartaTime = getJakartaNow();
  jakartaTime.setDate(jakartaTime.getDate() - 1);
  return jakartaTime.toISOString().split('T')[0];
}

/**
 * Calculate duration between two dates in seconds
 */
export function getDurationSeconds(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / 1000);
}

/**
 * Calculate duration between two dates in minutes
 */
export function getDurationMinutes(start: Date, end: Date): number {
  return Math.floor(getDurationSeconds(start, end) / 60);
}

/**
 * Add minutes to a date
 */
export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

/**
 * Add hours to a date
 */
export function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

/**
 * Check if two dates are the same day (in Jakarta timezone)
 */
export function isSameJakartaDay(date1: Date, date2: Date): boolean {
  const d1 = toJakartaTime(date1).toISOString().split('T')[0];
  const d2 = toJakartaTime(date2).toISOString().split('T')[0];
  return d1 === d2;
}

/**
 * Get Jakarta timezone info
 */
export function getTimezoneInfo() {
  return {
    name: 'Asia/Jakarta',
    abbreviation: 'WIB',
    offsetHours: JAKARTA_OFFSET_HOURS,
    offsetString: '+07:00',
  };
}

// Export constants for external use
export const TIMEZONE = {
  JAKARTA: 'Asia/Jakarta',
  OFFSET: '+07:00',
  OFFSET_HOURS: JAKARTA_OFFSET_HOURS,
};
