export interface FormatMoneyOptions {
  /** Show "+" on positive amounts (never on zero). Negative amounts always show "-". */
  sign?: boolean
}

// Building an Intl.NumberFormat is expensive; lists of expenses format hundreds of amounts.
const formatters = new Map<string, Intl.NumberFormat>()

function getFormatter(currency: string, locale: string, sign: boolean) {
  const key = `${locale}|${currency}|${sign}`
  let formatter = formatters.get(key)
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      signDisplay: sign ? 'exceptZero' : 'auto',
    })
    formatters.set(key, formatter)
  }
  return formatter
}

/**
 * Formats an amount given in minor units (cents) as a localized currency string.
 *
 * Money is stored as integers because floats cannot represent most decimals exactly
 * (0.1 + 0.2 === 0.30000000000000004). The division below happens only for display,
 * and Intl rounds the result to the currency's own number of decimals.
 */
export function formatMoney(
  amount: number,
  currency: string,
  locale: string,
  { sign = false }: FormatMoneyOptions = {},
): string {
  if (!Number.isInteger(amount)) {
    throw new RangeError(`formatMoney expects an integer amount in minor units, got ${amount}`)
  }
  const formatter = getFormatter(currency, locale, sign)
  // USD → 2, JPY → 0, KWD → 3: the currency decides, not our code.
  const decimals = formatter.resolvedOptions().maximumFractionDigits ?? 2
  return formatter.format(amount / 10 ** decimals)
}
