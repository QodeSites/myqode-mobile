/**
 * Formats ISO date string to display formats.
 *
 * Timezone note: bare date strings like "2026-03-27" are parsed by `new Date()`
 * as UTC midnight, which on IST (UTC+5:30) devices renders as the *previous* day
 * (e.g. March 26 at 18:30 IST).  We detect the YYYY-MM-DD pattern and parse the
 * components manually so the displayed date always matches what the server stored.
 */

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_FULL  = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

/** Parse a value into { day, month (0-based), year }, accounting for UTC-midnight offset. */
function parseDateParts(date: string | Date): { day: number; month: number; year: number } | null {
  if (typeof date === 'string') {
    // "YYYY-MM-DD" — parse as local date to avoid UTC offset shifting the day
    const bare = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (bare) {
      return { year: +bare[1], month: +bare[2] - 1, day: +bare[3] };
    }
    // Full ISO string or other format — parse normally (has time component, offset is less of an issue)
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    return { day: d.getDate(), month: d.getMonth(), year: d.getFullYear() };
  }
  // Already a Date object — use local accessors
  if (isNaN(date.getTime())) return null;
  return { day: date.getDate(), month: date.getMonth(), year: date.getFullYear() };
}

export function formatDate(
  date: string | Date | null | undefined,
  format: 'short' | 'medium' | 'long' | 'monthYear' = 'medium',
): string {
  if (!date) return '-';
  const parts = parseDateParts(date);
  if (!parts) return '-';
  const { day, month, year } = parts;

  switch (format) {
    case 'short':
      return `${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}`;
    case 'medium':
      return `${MONTHS_SHORT[month]} ${String(day).padStart(2, '0')}, ${year}`;
    case 'long':
      return `${MONTHS_FULL[month]} ${String(day).padStart(2, '0')}, ${year}`;
    case 'monthYear':
      return `${MONTHS_SHORT[month]} ${year}`;
    default:
      return `${MONTHS_SHORT[month]} ${String(day).padStart(2, '0')}, ${year}`;
  }
}

/**
 * Returns relative time: "2 days ago", "just now", etc.
 * Uses real UTC diff so relative time is always accurate.
 */
export function timeAgo(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);

  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return formatDate(d, 'medium');
}
