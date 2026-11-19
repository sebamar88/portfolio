import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'
import { Input } from './Input'

/**
 * Bare field, no label. Use it directly only when the label is provided another way
 * (aria-label, or an external <label htmlFor>). For forms, use TextField.
 */
const meta = {
  title: 'Atoms/Input',
  tags: ['autodocs'],
  component: Input,
  args: { 'aria-label': 'Search expenses', placeholder: 'Search…', onChange: fn() },
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    const input = canvas.getByRole('textbox', { name: 'Search expenses' })
    await userEvent.type(input, 'pizza')
    await expect(input).toHaveValue('pizza')
    await expect(args.onChange).toHaveBeenCalledTimes(5)
  },
}

/** Prefix/suffix are visual only (aria-hidden); the meaning must live in the label or hint. */
export const PrefixAndSuffix: Story = {
  args: { 'aria-label': 'Amount in US dollars', prefix: '$', suffix: 'USD', placeholder: '0.00', inputMode: 'decimal' },
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox', { name: 'Amount in US dollars' })
    await expect(canvas.getByText('$')).toHaveAttribute('aria-hidden', 'true')
    await expect(canvas.getByText('USD')).toHaveAttribute('aria-hidden', 'true')
    await expect(input).toHaveAttribute('inputmode', 'decimal')
  },
}

/** Clicking an adornment still lands the cursor in the field. */
export const ClickAdornmentFocuses: Story = {
  args: { 'aria-label': 'Amount', prefix: '$' },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByText('$'))
    await expect(canvas.getByRole('textbox', { name: 'Amount' })).toHaveFocus()
  },
}

export const Invalid: Story = {
  args: { 'aria-invalid': true, prefix: '$', defaultValue: '-5' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('textbox')).toBeInvalid()
  },
}

export const Disabled: Story = {
  args: { disabled: true, prefix: '$', defaultValue: '120' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('textbox')).toBeDisabled()
  },
}

export const AllStates: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--space-4)', maxWidth: '20rem' }}>
      <Input aria-label="Search expenses" placeholder="Search…" />
      <Input aria-label="Amount" prefix="$" suffix="USD" defaultValue="1200" />
      <Input aria-label="Invalid amount" aria-invalid prefix="$" defaultValue="-5" />
      <Input aria-label="Locked amount" disabled prefix="$" defaultValue="120" />
    </div>
  ),
}

export const AllStatesLight: Story = { ...AllStates, globals: { theme: 'light' } }
