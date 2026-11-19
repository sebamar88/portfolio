import { describe, expect, it } from 'vitest'
import { formatMoney } from './formatMoney'

// Intl separates symbol and number with a non-breaking space in some locales.
const nbsp = (s: string) => s.replace(/\u00a0/g, ' ')

describe('formatMoney', () => {
  it('formats minor units (cents) as major units', () => {
    expect(formatMoney(123450, 'USD', 'en-US')).toBe('$1,234.50')
  })

  it('follows the locale conventions', () => {
    expect(nbsp(formatMoney(123450, 'ARS', 'es-AR'))).toBe('$ 1.234,50')
  })

  it('takes the number of decimals from the currency, not from code', () => {
    // Yen has no minor unit: 1500 minor units are ¥1,500.
    expect(formatMoney(1500, 'JPY', 'en-US')).toBe('¥1,500')
  })

  it('avoids floating point errors by working with integers', () => {
    // 0.1 + 0.2 !== 0.3 in floats; 10 + 20 cents is exactly 30 cents.
    expect(formatMoney(10 + 20, 'USD', 'en-US')).toBe('$0.30')
  })

  it('can always show the sign, except for zero', () => {
    expect(formatMoney(120000, 'USD', 'en-US', { sign: true })).toBe('+$1,200.00')
    expect(formatMoney(-35000, 'USD', 'en-US', { sign: true })).toBe('-$350.00')
    expect(formatMoney(0, 'USD', 'en-US', { sign: true })).toBe('$0.00')
  })

  it('rejects non-integer amounts instead of silently rounding money', () => {
    expect(() => formatMoney(12.5, 'USD', 'en-US')).toThrow(RangeError)
  })
})
