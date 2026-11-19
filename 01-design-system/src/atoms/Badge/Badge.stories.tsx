import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { Badge } from './Badge'

const meta = {
  title: 'Atoms/Badge',
  tags: ['autodocs'],
  component: Badge,
  args: { children: 'Settled' },
  argTypes: { tone: { control: 'inline-radio', options: ['neutral', 'accent', 'success', 'danger'] } },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Settled')).toBeVisible()
  },
}

/** The pulsing dot is decoration: hidden from AT so the badge reads just "Live". */
export const Live: Story = {
  args: { tone: 'danger', dot: true, children: 'Live' },
  play: async ({ canvas, canvasElement }) => {
    const dot = canvasElement.querySelector('[aria-hidden="true"]')
    await expect(dot).not.toBeNull()
    await expect(canvas.getByText('Live')).toBeVisible()
    await expect(canvasElement).toHaveTextContent(/^Live$/)
  },
}

export const AllTones: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
      <Badge tone="neutral">Neutral</Badge>
      <Badge tone="accent">Accent</Badge>
      <Badge tone="success">Success</Badge>
      <Badge tone="danger">Danger</Badge>
    </div>
  ),
  play: async ({ canvas }) => {
    for (const t of ['Neutral', 'Accent', 'Success', 'Danger']) await expect(canvas.getByText(t)).toBeVisible()
  },
}

export const AllTonesLight: Story = { ...AllTones, globals: { theme: 'light' } }
