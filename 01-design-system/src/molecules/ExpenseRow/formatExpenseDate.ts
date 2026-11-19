const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/

// Building an Intl.DateTimeFormat is expensive; a list formats one date per row.
const formatters = new Map<string, Intl.DateTimeFormat>()

function getFormatter(locale: string) {
  let formatter = formatters.get(locale)
  if (!formatter) {
    // timeZone UTC must match the Date.UTC below, or the formatter would shift the day again.
    formatter = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', timeZone: 'UTC' })
    formatters.set(locale, formatter)
  }
  return formatter
}

/**
 * Formats a date-only string ('YYYY-MM-DD') as a short localized date ("Nov 19").
 *
 * An expense happens on a calendar day, not at an instant. `new Date('2026-11-19')` is UTC
 * midnight, which in UTC-3 is still Nov 18: the row would show the wrong day. So we build the
 * date in UTC from its parts and format it in UTC: the day never shifts, on any machine.
 */
export function formatExpenseDate(isoDate: string, locale: string): string {
  const match = DATE_ONLY.exec(isoDate)
  if (!match) {
    throw new RangeError(`formatExpenseDate expects YYYY-MM-DD, got "${isoDate}"`)
  }
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])]
  const date = new Date(Date.UTC(year, month - 1, day))
  // Date.UTC rolls over (Feb 30 → Mar 2); a round-trip mismatch means the input was impossible.
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new RangeError(`formatExpenseDate got an impossible date "${isoDate}"`)
  }
  return getFormatter(locale).format(date)
}
