import type { HTMLAttributes } from 'react'
import { Avatar } from '../../atoms/Avatar/Avatar'
import { Badge } from '../../atoms/Badge/Badge'
import { Money, type BalanceLabels } from '../../atoms/Money/Money'
import { Text } from '../../atoms/Text/Text'
import { formatExpenseDate } from './formatExpenseDate'
import styles from './ExpenseRow.module.scss'

export interface ExpenseStatusLabels {
  pending: string
  settled: string
}

export interface ExpenseRowProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** What the money was spent on. Single line; the full text is in the `title` tooltip. */
  description: string
  /** Who paid. The avatar falls back to initials when there is no photo. */
  paidBy: { name: string; avatarUrl?: string }
  /** Calendar day of the expense, 'YYYY-MM-DD' (not an instant: no timezone shifts). */
  date: string
  /** Total amount of the expense, integer minor units (cents). */
  amount: number
  /** ISO 4217 code: USD, ARS, EUR... */
  currency: string
  /** BCP 47 locale used for money and date. */
  locale?: string
  /** The viewer's share: positive = you are owed, negative = you owe. Absent → total is shown. */
  balance?: number
  /** Screen-reader phrases for the balance, passed to Money `labels`. */
  balanceLabels?: BalanceLabels
  /** Optional status badge: pending (accent) or settled (success). */
  status?: 'pending' | 'settled'
  /** Badge texts; pass translations here. */
  statusLabels?: ExpenseStatusLabels
  /** The word between the payer and the amount ("Ana paid $45.99"); pass a translation. */
  paidLabel?: string
  /** Rendered element: use `li` inside a `ul` so lists are announced as lists. Default `div`. */
  as?: 'div' | 'li'
}

const defaultStatusLabels: ExpenseStatusLabels = { pending: 'Pending', settled: 'Settled' }

/**
 * One expense in a list: payer avatar, description, who paid how much and when, and the
 * viewer's balance (or the total) with an optional status badge.
 *
 * The row is intentionally non-interactive: apps wrap it in a link or button as needed.
 * That avoids nested interactive elements, which are invalid HTML and break keyboard use.
 */
export function ExpenseRow({
  description,
  paidBy,
  date,
  amount,
  currency,
  locale = 'en-US',
  balance,
  balanceLabels,
  status,
  statusLabels = defaultStatusLabels,
  paidLabel = 'paid',
  as: Tag = 'div',
  className,
  ...rest
}: ExpenseRowProps) {
  return (
    <Tag className={[styles.row, className].filter(Boolean).join(' ')} {...rest}>
      <Avatar name={paidBy.name} src={paidBy.avatarUrl} />
      {/* min-width: 0 on the column lets the grid shrink it, so the ellipsis can kick in. */}
      <div className={styles.main}>
        <Text as="span" weight="medium" className={styles.description} title={description}>
          {description}
        </Text>
        <Text as="span" size="sm" tone="muted">
          {paidBy.name} {paidLabel} <Money amount={amount} currency={currency} locale={locale} /> ·{' '}
          <time dateTime={date}>{formatExpenseDate(date, locale)}</time>
        </Text>
      </div>
      <div className={styles.side}>
        {balance === undefined ? (
          <Money amount={amount} currency={currency} locale={locale} />
        ) : (
          <Money amount={balance} currency={currency} locale={locale} variant="balance" labels={balanceLabels} />
        )}
        {status && (
          <Badge tone={status === 'pending' ? 'accent' : 'success'}>{statusLabels[status]}</Badge>
        )}
      </div>
    </Tag>
  )
}
