import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'
import { Button } from './Button'

const meta = {
  title: 'Atoms/Button',
  tags: ['autodocs'],
  component: Button,
  args: { children: 'Settle up', onClick: fn() },
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'accent', 'danger'] },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  play: async ({ canvas, userEvent, args }) => {
    const button = canvas.getByRole('button', { name: 'Settle up' })
    await userEvent.click(button)
    await expect(args.onClick).toHaveBeenCalledTimes(1)
  },
}

export const Secondary: Story = { args: { variant: 'secondary', children: 'Cancel' } }
export const Accent: Story = { args: { variant: 'accent', children: 'Get started' } }
export const Danger: Story = { args: { variant: 'danger', children: 'Delete expense' } }
export const Small: Story = { args: { size: 'sm', children: 'Edit' } }

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvas, userEvent, args }) => {
    const button = canvas.getByRole('button', { name: 'Settle up' })
    await expect(button).toBeDisabled()
    await userEvent.click(button)
    await expect(args.onClick).not.toHaveBeenCalled()
  },
}

/** Keyboard users must be able to reach and activate it. */
export const Keyboard: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.tab()
    await expect(canvas.getByRole('button')).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await userEvent.keyboard(' ')
    await expect(args.onClick).toHaveBeenCalledTimes(2)
  },
}

/** Defaults to type="button" so it never submits a surrounding form by accident. */
export const InsideForm: Story = {
  render: (args) => (
    <form onSubmit={(e) => { e.preventDefault(); args.onClick?.(e as never) }}>
      <Button {...args} onClick={undefined} />
    </form>
  ),
  play: async ({ canvas, userEvent, args }) => {
    await expect(canvas.getByRole('button')).toHaveAttribute('type', 'button')
    await userEvent.click(canvas.getByRole('button'))
    await expect(args.onClick).not.toHaveBeenCalled()
  },
}

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="accent">Accent</Button>
      <Button variant="danger">Danger</Button>
      <Button disabled>Disabled</Button>
    </div>
  ),
}

export const AllVariantsLight: Story = { ...AllVariants, globals: { theme: 'light' } }
