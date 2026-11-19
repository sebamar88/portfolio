import { useId, type HTMLAttributes } from 'react'
import { Money, type BalanceLabels } from '../../atoms/Money/Money'
import { Text } from '../../atoms/Text/Text'
import { ExpenseRow, type ExpenseRowProps, type ExpenseStatusLabels } from '../../molecules/ExpenseRow/ExpenseRow'
import { formatExpenseDate } from '../../molecules/ExpenseRow/formatExpenseDate'
import { groupExpenses } from './groupExpenses'
import styles from './ExpenseList.module.scss'

/** One expense of the list: the row props the list does not own, plus a stable key. */
export type ExpenseItem = Omit<ExpenseRowProps, 'currency' | 'locale' | 'as' | 'balanceLabels' | 'statusLabels' | 'paidLabel'> & {
  /** Stable identity, used as the React key. */
  id: string
}

export interface ExpenseListLabels {
  /** Text for the muted counter, e.g. `(n) => n === 1 ? '1 expense' : `${n} expenses``. */
  count?: (count: number) => string
  /** Screen-reader phrases for every balance (the net and each row). */
  balance?: BalanceLabels
  /** Status badge texts of the rows. */
  status?: ExpenseStatusLabels
  /** The word between payer and amount in each row ("Ana paid $45"). */
  paid?: string
}

export interface ExpenseListProps extends Omit<HTMLAttributes<HTMLElement>, 'title' | 'children'> {
  /** Heading of the list, usually the group name. It also names the section for screen readers. */
  title: string
  /** Heading level of the title; date headings use the next level. Default `h2`. */
  headingLevel?: 'h2' | 'h3'
  /** The expenses, in any order: they are grouped by day, newest first. */
  expenses: ExpenseItem[]
  /** ISO 4217 code shared by every expense. */
  currency: string
  /** BCP 47 locale used for money and dates. */
  locale?: string
  /** Shown instead of the list when there are no expenses. Default "No expenses yet". */
  emptyMessage?: string
  /** Texts to translate: counter, balance phrases, status badges and the "paid" word. */
  labels?: ExpenseListLabels
}

const defaultCount = (count: number) => (count === 1 ? '1 expense' : `${count} expenses`)

/**
 * A group's expense feed: a titled section with the viewer's net balance and the number of
 * expenses, followed by the rows grouped by day (newest first).
 *
 * The section is labelled by its heading, so it is a navigable landmark. Each day gets a
 * heading one level below the title, and its rows form a real list.
 */
export function ExpenseList({
  title,
  headingLevel = 'h2',
  expenses,
  currency,
  locale = 'en-US',
  emptyMessage = 'No expenses yet',
  labels,
  className,
  ...rest
}: ExpenseListProps) {
  const headingId = useId()
  const dateLevel = headingLevel === 'h2' ? 'h3' : 'h4'
  const { groups, net } = groupExpenses(expenses)
  const count = labels?.count ?? defaultCount

  return (
    <section
      aria-labelledby={headingId}
      className={[styles.list, className].filter(Boolean).join(' ')}
      {...rest}
    >
      <div>
        <Text as={headingLevel} id={headingId}>
          {title}
        </Text>
        <div className={styles.summary}>
          <Money amount={net} currency={currency} locale={locale} variant="balance" labels={labels?.balance} />
          {expenses.length > 0 && (
            <Text as="span" size="sm" tone="muted">
              {count(expenses.length)}
            </Text>
          )}
        </div>
      </div>
      {expenses.length === 0 ? (
        <Text tone="muted" className={styles.empty}>
          {emptyMessage}
        </Text>
      ) : (
        groups.map((group) => (
          <div key={group.date}>
            <Text as={dateLevel} size="sm" tone="muted" weight="medium" className={styles.dateHeading}>
              {formatExpenseDate(group.date, locale)}
            </Text>
            <ul className={styles.rows}>
              {group.items.map(({ id, ...item }) => (
                <ExpenseRow
                  key={id}
                  as="li"
                  currency={currency}
                  locale={locale}
                  balanceLabels={labels?.balance}
                  statusLabels={labels?.status}
                  paidLabel={labels?.paid}
                  {...item}
                />
              ))}
            </ul>
          </div>
        ))
      )}
    </section>
  )
}
