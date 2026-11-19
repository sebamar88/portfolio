import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { Text } from '../Text/Text'
import { Money } from './Money'

const meta = {
  title: 'Atoms/Money',
  tags: ['autodocs'],
  component: Money,
  args: { amount: 123450, currency: 'USD', locale: 'en-US' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['plain', 'balance'] },
    currency: { control: 'inline-radio', options: ['USD', 'ARS', 'EUR', 'JPY'] },
    locale: { control: 'inline-radio', options: ['en-US', 'es-AR', 'de-DE', 'ja-JP'] },
  },
} satisfies Meta<typeof Money>

export default meta
type Story = StoryObj<typeof meta>

export const Plain: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('$1,234.50')).toBeInTheDocument()
  },
}

export const ArgentinePesos: Story = {
  args: { currency: 'ARS', locale: 'es-AR' },
  play: async ({ canvasElement }) => {
    await expect(canvasElement).toHaveTextContent('$ 1.234,50')
  },
}

/**
 * Balance: sign is in the text (+/-) and a screen-reader-only phrase says what it means,
 * so the meaning never depends on color alone (color blindness, monochrome screens).
 */
export const YouAreOwed: Story = {
  args: { variant: 'balance', amount: 120000 },
  play: async ({ canvasElement, canvas }) => {
    await expect(canvas.getByText('+$1,200.00')).toBeVisible()
    await expect(canvasElement).toHaveTextContent('You are owed +$1,200.00')
  },
}

export const YouOwe: Story = {
  args: { variant: 'balance', amount: -35000 },
  play: async ({ canvasElement, canvas }) => {
    await expect(canvas.getByText('-$350.00')).toBeVisible()
    await expect(canvasElement).toHaveTextContent('You owe -$350.00')
  },
}

export const SettledUp: Story = {
  args: { variant: 'balance', amount: 0 },
  play: async ({ canvasElement }) => {
    await expect(canvasElement).toHaveTextContent('Settled up $0.00')
  },
}

/** Labels are props, so apps can translate them. */
export const Translated: Story = {
  args: {
    variant: 'balance',
    amount: -35000,
    currency: 'ARS',
    locale: 'es-AR',
    labels: { owed: 'Te deben', owe: 'Debés', settled: 'Saldado' },
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement).toHaveTextContent('Debés -$ 350,00')
  },
}

export const InsideText: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
      <Text size="3xl" weight="bold">
        <Money {...args} variant="balance" amount={120000} />
      </Text>
      <Text tone="muted">
        Ana paid <Money {...args} amount={4599} /> for dinner
      </Text>
    </div>
  ),
}

export const Balances: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 'var(--space-2)', fontSize: 'var(--text-lg)' }}>
      <Money {...args} variant="balance" amount={120000} />
      <Money {...args} variant="balance" amount={-35000} />
      <Money {...args} variant="balance" amount={0} />
    </div>
  ),
}

export const BalancesLight: Story = { ...Balances, globals: { theme: 'light' } }
