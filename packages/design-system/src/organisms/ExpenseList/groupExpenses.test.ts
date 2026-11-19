import { describe, expect, it } from 'vitest'
import { groupExpenses } from './groupExpenses'

const item = (id: string, date: string, balance?: number) => ({ id, date, balance })

describe('groupExpenses', () => {
  it('returns no groups and a zero net for empty input', () => {
    expect(groupExpenses([])).toEqual({ groups: [], net: 0 })
  })

  it('sorts groups newest day first', () => {
    const { groups } = groupExpenses([
      item('a', '2026-11-16'),
      item('b', '2026-11-19'),
      item('c', '2026-11-18'),
    ])
    expect(groups.map((g: { date: string }) => g.date)).toEqual(['2026-11-19', '2026-11-18', '2026-11-16'])
  })

  it('keeps input order within a day', () => {
    const { groups } = groupExpenses([
      item('a', '2026-11-19'),
      item('b', '2026-11-18'),
      item('c', '2026-11-19'),
      item('d', '2026-11-19'),
    ])
    expect(groups[0].items.map((i: { id: string }) => i.id)).toEqual(['a', 'c', 'd'])
    expect(groups[1].items.map((i: { id: string }) => i.id)).toEqual(['b'])
  })

  it('sums only defined balances, ignoring undefined', () => {
    const { net } = groupExpenses([item('a', '2026-11-19', -1533), item('b', '2026-11-19'), item('c', '2026-11-18', 4013)])
    expect(net).toBe(2480)
  })

  it('stays exact in integer minor units (no float drift)', () => {
    const { net } = groupExpenses([item('a', '2026-11-19', 10), item('b', '2026-11-19', 20)])
    expect(net).toBe(30)
    expect(Number.isInteger(net)).toBe(true)
  })

  it('does not mutate the input', () => {
    const input = [item('a', '2026-11-16'), item('b', '2026-11-19')]
    groupExpenses(input)
    expect(input.map((i) => i.id)).toEqual(['a', 'b'])
  })
})
