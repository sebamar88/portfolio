import { describe, expect, it } from 'vitest'
import { formatExpenseDate } from './formatExpenseDate'

describe('formatExpenseDate', () => {
  it('keeps the calendar day regardless of the machine timezone', () => {
    // vite.config sets TZ=America/Argentina/Buenos_Aires (UTC-3): new Date('2026-11-19')
    // would be Nov 18 at 21:00 local time and render "Nov 18".
    expect(formatExpenseDate('2026-11-19', 'en-US')).toBe('Nov 19')
  })

  it('does not drift at year boundaries', () => {
    expect(formatExpenseDate('2026-01-01', 'en-US')).toBe('Jan 1')
  })

  it('follows the locale conventions (day first in es-AR)', () => {
    const out = formatExpenseDate('2026-11-19', 'es-AR')
    expect(out).toMatch(/^19\b.*nov/i)
  })

  it('throws RangeError on malformed input', () => {
    for (const bad of ['', 'nov 19', '2026-1-9', '2026-11-19T00:00:00Z', '19/11/2026']) {
      expect(() => formatExpenseDate(bad, 'en-US')).toThrow(RangeError)
    }
  })

  it('throws RangeError on impossible dates instead of rolling over', () => {
    // new Date(Date.UTC(2026, 1, 30)) silently becomes Mar 2.
    expect(() => formatExpenseDate('2026-02-30', 'en-US')).toThrow(RangeError)
    expect(() => formatExpenseDate('2026-13-01', 'en-US')).toThrow(RangeError)
  })
})
