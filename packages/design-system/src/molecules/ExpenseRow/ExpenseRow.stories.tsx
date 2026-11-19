import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { ExpenseRow } from './ExpenseRow'

const meta = {
  title: 'Molecules/ExpenseRow',
  tags: ['autodocs'],
  component: ExpenseRow,
  args: {
    description: 'Dinner at Mario’s',
    paidBy: { name: 'Ana López' },
    date: '2026-11-19',
    amount: 4599,
    currency: 'USD',
  },
} satisfies Meta<typeof ExpenseRow>

export default meta
type Story = StoryObj<typeof meta>

const photo =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#6366f1"/><circle cx="32" cy="26" r="12" fill="#fff"/></svg>',
  )

/** Without a balance the row shows the total amount. */
export const Default: Story = {
  args: { paidBy: { name: 'Ana' } },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByText('Dinner at Mario’s')).toBeVisible()
    await expect(canvasElement.textContent).toContain('Ana paid $45.99')
    const time = canvasElement.querySelector('time')
    await expect(time).toHaveAttribute('datetime', '2026-11-19')
    await expect(time).toHaveTextContent('Nov 19')
  },
}

export const YouOwe: Story = {
  args: { balance: -1533 },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.textContent).toContain('You owe -$15.33')
  },
}

export const YouAreOwed: Story = {
  args: { balance: 3066 },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.textContent).toContain('You are owed +$30.66')
  },
}

export const Pending: Story = {
  args: { status: 'pending', balance: -1533 },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Pending')).toBeVisible()
  },
}

export const Settled: Story = {
  args: { status: 'settled' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Settled')).toBeVisible()
  },
}

/** One line with an ellipsis; the full text stays available through the title tooltip. */
export const LongDescription: Story = {
  args: {
    description: 'Shared taxi from the airport to the cabin, including the tip and the toll we forgot about',
  },
  decorators: [(Story) => <div style={{ maxWidth: '22rem' }}><Story /></div>],
  play: async ({ canvas, args }) => {
    const el = canvas.getByText(args.description)
    await expect(el).toHaveAttribute('title', args.description)
  },
}

export const WithPhoto: Story = {
  args: { paidBy: { name: 'Ana López', avatarUrl: photo } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('img', { name: 'Ana López' })).toBeVisible()
  },
}

export const Spanish: Story = {
  args: {
    description: 'Cena en lo de Mario',
    paidBy: { name: 'Ana' },
    locale: 'es-AR',
    currency: 'ARS',
    amount: 4599000,
    balance: -1533000,
    status: 'pending',
    paidLabel: 'pagó',
    balanceLabels: { owed: 'Te deben', owe: 'Debés', settled: 'Saldado' },
    statusLabels: { pending: 'Pendiente', settled: 'Saldado' },
  },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByText('Pendiente')).toBeVisible()
    await expect(canvasElement.textContent).toContain('Debés')
    await expect(canvasElement.textContent).toContain('pagó')
    await expect(canvasElement.querySelector('time')).toHaveAttribute('datetime', '2026-11-19')
  },
}

const rows = [
  { description: 'Dinner at Mario’s', paidBy: { name: 'Ana López' }, date: '2026-11-19', amount: 4599, balance: -1533, status: 'pending' as const },
  { description: 'Groceries', paidBy: { name: 'Bruno Díaz' }, date: '2026-11-18', amount: 12040, balance: 4013, status: 'pending' as const },
  { description: 'Taxi', paidBy: { name: 'Carla Ruiz' }, date: '2026-11-17', amount: 2300, balance: 0, status: 'settled' as const },
  { description: 'Museum tickets', paidBy: { name: 'Ana López' }, date: '2026-11-16', amount: 6000, status: 'settled' as const },
]

/** In a list the rows are `<li>` inside a `<ul>`, so screen readers announce "list, 4 items". */
export const List: Story = {
  render: () => (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0, maxWidth: '32rem' }}>
      {rows.map((row) => (
        <ExpenseRow key={row.description} as="li" currency="USD" {...row} />
      ))}
    </ul>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('listitem')).toHaveLength(4)
  },
}

export const ListLight: Story = { ...List, globals: { theme: 'light' } }
