import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'
import { TextField } from './TextField'

const meta = {
  title: 'Molecules/TextField',
  tags: ['autodocs'],
  component: TextField,
  args: { label: 'Description', placeholder: 'Dinner at Mario’s', onChange: fn() },
} satisfies Meta<typeof TextField>

export default meta
type Story = StoryObj<typeof meta>

/** The label is programmatically tied to the field: clicking it or a screen reader finds the input. */
export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    const input = canvas.getByLabelText('Description')
    await userEvent.click(canvas.getByText('Description'))
    await expect(input).toHaveFocus()
    await userEvent.type(input, 'Pizza')
    await expect(input).toHaveValue('Pizza')
    await expect(args.onChange).toHaveBeenCalledTimes(5)
    await expect(input).not.toBeInvalid()
  },
}

export const WithHint: Story = {
  args: { hint: 'Shown to everyone in the group' },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText('Description')).toHaveAccessibleDescription(
      'Shown to everyone in the group',
    )
  },
}

/** The error is announced with the field (aria-describedby) and the field is marked invalid. */
export const WithError: Story = {
  args: { label: 'Amount', hint: 'In USD', error: 'Amount must be greater than 0', defaultValue: '0' },
  play: async ({ canvas }) => {
    const input = canvas.getByLabelText('Amount')
    await expect(input).toBeInvalid()
    await expect(input).toHaveAccessibleDescription('In USD Amount must be greater than 0')
  },
}

export const Required: Story = {
  args: { required: true },
  play: async ({ canvas }) => {
    // The visual asterisk is hidden from screen readers; `required` already announces it.
    const input = canvas.getByRole('textbox', { name: 'Description' })
    await expect(input).toBeRequired()
  },
}

/** Composes the Input atom: adornments pass through, label and description still work. */
export const WithPrefixAndSuffix: Story = {
  args: { label: 'Amount', prefix: '$', suffix: 'USD', hint: 'In US dollars', placeholder: '0.00' },
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox', { name: 'Amount' })
    await expect(input).toHaveAccessibleDescription('In US dollars')
    await expect(canvas.getByText('$')).toBeVisible()
  },
}

export const Disabled: Story = {
  args: { disabled: true, defaultValue: 'Locked' },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText('Description')).toBeDisabled()
  },
}

export const AllStates: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--space-4)', maxWidth: '20rem' }}>
      <TextField label="Description" placeholder="Dinner at Mario’s" />
      <TextField label="Paid by" hint="Who covered the bill" defaultValue="Ana" />
      <TextField label="Amount" prefix="$" suffix="USD" error="Amount must be greater than 0" defaultValue="0" />
      <TextField label="Group" disabled defaultValue="Trip to Bariloche" />
    </div>
  ),
}

export const AllStatesLight: Story = { ...AllStates, globals: { theme: 'light' } }
