import type { HTMLAttributes } from 'react'
import { formatMoney } from './formatMoney'
import styles from './Money.module.scss'

export interface BalanceLabels {
  owed: string
  owe: string
  settled: string
}

export interface MoneyProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** Integer amount in minor units (cents): 123450 → $1,234.50. */
  amount: number
  /** ISO 4217 code: USD, ARS, EUR, JPY... */
  currency: string
  /** BCP 47 locale. Apps should pass the user's locale. */
  locale?: string
  /**
   * `plain`: just the amount.
   * `balance`: a debt from the viewer's side. Positive = you are owed, negative = you owe.
   */
  variant?: 'plain' | 'balance'
  /** Screen-reader phrases for the balance variant; pass translations here. */
  labels?: BalanceLabels
}

const defaultLabels: BalanceLabels = { owed: 'You are owed', owe: 'You owe', settled: 'Settled up' }

/**
 * Formats money. Inherits font size from its parent, so it composes inside Text.
 * In the balance variant the meaning is carried three ways: color, a visible +/- sign, and a
 * screen-reader-only phrase. Color alone would fail color-blind users (WCAG 1.4.1).
 */
export function Money({
  amount,
  currency,
  locale = 'en-US',
  variant = 'plain',
  labels = defaultLabels,
  className,
  ...rest
}: MoneyProps) {
  const isBalance = variant === 'balance'
  const formatted = formatMoney(amount, currency, locale, { sign: isBalance })
  const state = amount > 0 ? 'owed' : amount < 0 ? 'owe' : 'settled'

  const classes = [styles.money, isBalance && styles[state], className].filter(Boolean).join(' ')

  return (
    <span className={classes} {...rest}>
      {isBalance && <span className={styles.srOnly}>{labels[state]} </span>}
      <span>{formatted}</span>
    </span>
  )
}
