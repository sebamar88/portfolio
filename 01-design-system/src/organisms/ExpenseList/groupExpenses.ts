export interface ExpenseDayGroup<T> {
  /** Calendar day, 'YYYY-MM-DD'. */
  date: string
  /** Expenses of that day, in input order. */
  items: T[]
}

export interface GroupedExpenses<T> {
  /** Days sorted newest first. */
  groups: ExpenseDayGroup<T>[]
  /** Sum of the defined balances, integer minor units. */
  net: number
}

/**
 * Groups expenses by calendar day (newest first) and computes the viewer's net balance.
 *
 * ISO 'YYYY-MM-DD' strings sort correctly as text, so no Date objects (and no timezone
 * shifts) are involved. Amounts are integer minor units: plain addition is exact.
 */
export function groupExpenses<T extends { date: string; balance?: number }>(items: readonly T[]): GroupedExpenses<T> {
  const byDate = new Map<string, T[]>()
  let net = 0
  for (const item of items) {
    const day = byDate.get(item.date)
    if (day) day.push(item)
    else byDate.set(item.date, [item])
    // Expenses without a balance don't involve the viewer: they add nothing.
    net += item.balance ?? 0
  }
  const groups = [...byDate.entries()]
    .sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0))
    .map(([date, dayItems]) => ({ date, items: dayItems }))
  return { groups, net }
}
