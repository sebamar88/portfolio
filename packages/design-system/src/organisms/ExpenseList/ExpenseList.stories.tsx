import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { ExpenseList } from './ExpenseList'

const expenses = [
  { id: '1', description: 'Dinner at Mario’s', paidBy: { name: 'Ana López' }, date: '2026-11-19', amount: 4599, balance: -1533, status: 'pending' as const },
  { id: '2', description: 'Taxi home', paidBy: { name: 'Bruno Díaz' }, date: '2026-11-19', amount: 2300, balance: 767 },
  { id: '3', description: 'Groceries', paidBy: { name: 'Bruno Díaz' }, date: '2026-11-18', amount: 12040, balance: 8027, status: 'pending' as const },
  { id: '4', description: 'Coffee', paidBy: { name: 'Carla Ruiz' }, date: '2026-11-18', amount: 900, balance: 0, status: 'settled' as const },
  { id: '5', description: 'Museum tickets', paidBy: { name: 'Ana López' }, date: '2026-11-16', amount: 6000, balance: 2000 },
  { id: '6', description: 'Pharmacy', paidBy: { name: 'Carla Ruiz' }, date: '2026-11-16', amount: 1500 },
]

const meta = {
  title: 'Organisms/ExpenseList',
  tags: ['autodocs'],
  component: ExpenseList,
  args: { title: 'Trip to Bariloche', expenses, currency: 'USD' },
  decorators: [(Story) => <div style={{ maxWidth: '32rem' }}><Story /></div>],
} satisfies Meta<typeof ExpenseList>

export default meta
type Story = StoryObj<typeof meta>

/** Rows grouped by day, newest first, under a summary with the viewer's net balance. */
export const Default: Story = {
  play: async ({ canvas, canvasElement, args }) => {
    await expect(canvas.getByRole('region', { name: args.title })).toBeVisible()
    await expect(canvas.getAllByRole('heading', { level: 3 })).toHaveLength(3)
    await expect(canvas.getAllByRole('listitem')).toHaveLength(6)
    await expect(canvasElement.textContent).toContain('You are owed')
    await expect(canvas.getByText('6 expenses')).toBeVisible()
  },
}

export const Empty: Story = {
  args: { expenses: [] },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByText('No expenses yet')).toBeVisible()
    await expect(canvas.queryAllByRole('listitem')).toHaveLength(0)
    await expect(canvasElement.textContent).toContain('Settled up')
    // "No expenses yet" already says it; a "0 expenses" counter would repeat it.
    await expect(canvas.queryByText('0 expenses')).not.toBeInTheDocument()
  },
}

export const YouOweOverall: Story = {
  args: { expenses: expenses.slice(0, 1) },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvasElement.textContent).toContain('You owe -$15.33')
    await expect(canvas.getByText('1 expense')).toBeVisible()
  },
}

export const Spanish: Story = {
  args: {
    title: 'Viaje a Bariloche',
    currency: 'ARS',
    locale: 'es-AR',
    expenses: expenses.map((e) => ({ ...e, amount: e.amount * 100, balance: e.balance === undefined ? undefined : e.balance * 100 })),
    emptyMessage: 'Todavía no hay gastos',
    labels: {
      count: (n: number) => (n === 1 ? '1 gasto' : `${n} gastos`),
      balance: { owed: 'Te deben', owe: 'Debés', settled: 'Saldado' },
      status: { pending: 'Pendiente', settled: 'Saldado' },
      paid: 'pagó',
    },
  },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByRole('region', { name: 'Viaje a Bariloche' })).toBeVisible()
    await expect(canvas.getByText('6 gastos')).toBeVisible()
    await expect(canvasElement.textContent).toContain('Te deben')
    await expect(canvasElement.textContent).toContain('pagó')
  },
}

export const DefaultLight: Story = { ...Default, globals: { theme: 'light' } }
