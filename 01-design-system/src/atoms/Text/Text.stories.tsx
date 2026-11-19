import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { Text } from './Text'

const meta = {
  title: 'Atoms/Text',
  tags: ['autodocs'],
  component: Text,
  args: { children: 'Ana paid for dinner' },
  argTypes: {
    as: { control: 'select', options: ['p', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'] },
    size: { control: 'select', options: ['sm', 'md', 'lg', 'xl', '2xl', '3xl'] },
    tone: { control: 'inline-radio', options: ['default', 'muted', 'accent', 'success', 'danger'] },
    weight: { control: 'inline-radio', options: ['regular', 'medium', 'bold'] },
  },
} satisfies Meta<typeof Text>

export default meta
type Story = StoryObj<typeof meta>

export const Paragraph: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Ana paid for dinner').tagName).toBe('P')
  },
}

export const Heading: Story = {
  args: { as: 'h2', children: 'Trip to Bariloche' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { level: 2, name: 'Trip to Bariloche' })).toBeInTheDocument()
  },
}

/** Semantics and looks are independent: still a level-2 heading, rendered small. */
export const SmallHeading: Story = {
  args: { as: 'h2', size: 'sm', children: 'Recent activity' },
  play: async ({ canvas }) => {
    const heading = canvas.getByRole('heading', { level: 2, name: 'Recent activity' })
    await expect(getComputedStyle(heading).fontSize).toBe('14px')
  },
}

export const Tones: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
      <Text>Default: Ana paid for dinner</Text>
      <Text tone="muted">Muted: 2 hours ago</Text>
      <Text tone="accent">Accent: View group</Text>
      <Text tone="success">Success: you are owed $1,200</Text>
      <Text tone="danger">Danger: you owe $350</Text>
    </div>
  ),
}

export const TonesLight: Story = { ...Tones, globals: { theme: 'light' } }

export const Scale: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
      <Text as="h1">h1 · Shared expenses</Text>
      <Text as="h2">h2 · Trip to Bariloche</Text>
      <Text as="h3">h3 · Balances</Text>
      <Text as="h4">h4 · This week</Text>
      <Text>p · Ana paid for dinner at Mario’s.</Text>
      <Text size="sm" tone="muted">sm · 2 hours ago</Text>
    </div>
  ),
}
