import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, waitFor } from 'storybook/test'
import { Avatar } from './Avatar'
import { getAvatarColorIndex } from './avatarUtils'

// Inline SVG: no network, so the story is deterministic offline and in CI.
const svg =
  "<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><rect width='80' height='80' fill='#5cc8ff'/></svg>"
const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`

const meta = {
  title: 'Atoms/Avatar',
  tags: ['autodocs'],
  component: Avatar,
  args: { name: 'Ana López' },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
} satisfies Meta<typeof Avatar>

export default meta
type Story = StoryObj<typeof meta>

export const WithImage: Story = {
  args: { src: dataUri },
  play: async ({ canvas }) => {
    const img = canvas.getByRole('img', { name: 'Ana López' })
    await expect(img.tagName).toBe('IMG')
  },
}

/** The wrapper is the single "img" and announces the full name; the letters are hidden from AT. */
export const Initials: Story = {
  play: async ({ canvas, canvasElement }) => {
    const avatar = canvas.getByRole('img', { name: 'Ana López' })
    await expect(avatar.tagName).not.toBe('IMG')
    await expect(avatar).toHaveTextContent('AL')
    const letters = canvasElement.querySelector('[aria-hidden="true"]')
    await expect(letters).toHaveTextContent('AL')
  },
}

export const BrokenImage: Story = {
  args: { src: '/does-not-exist.png' },
  play: async ({ canvas, canvasElement }) => {
    await waitFor(() => expect(canvasElement.querySelector('img')).toBeNull())
    const avatar = await canvas.findByRole('img', { name: 'Ana López' })
    await expect(avatar).toHaveTextContent('AL')
  },
}

export const SameNameSameColor: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
      <Avatar {...args} data-testid="first" />
      <Avatar {...args} data-testid="second" />
    </div>
  ),
  play: async ({ canvas }) => {
    const [a, b] = canvas.getAllByRole('img')
    await expect(a.className).toBe(b.className)
  },
}

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
      <Avatar {...args} size="sm" />
      <Avatar {...args} size="md" />
      <Avatar {...args} size="lg" />
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('img')).toHaveLength(3)
  },
}

// Names are derived from the hash itself, so changing the hash can't silently break the 6-color check.
const candidates = ['Carla', 'Maria', 'Gala', 'Ana', 'Elena', 'Bruno', 'Diego', 'Lucia', 'Pablo', 'Sofia', 'Juan', 'Laura', 'Mateo', 'Julia', 'Hugo', 'Valeria', 'Tomas', 'Nora', 'Pedro', 'Irene', 'Marcos', 'Clara', 'Felipe', 'Rosa']

function namesForAllColors(count = 6): string[] {
  return Array.from({ length: count }, (_, index) => {
    const name = candidates.find((n) => getAvatarColorIndex(n, count) === index)
    if (!name) throw new Error(`No candidate name maps to avatar color ${index}; add more candidates.`)
    return name
  })
}

const names = namesForAllColors()

export const AllColors: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
      {names.map((n) => (
        <Avatar key={n} name={n} />
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    const classes = new Set(canvas.getAllByRole('img').map((e) => e.className))
    await expect(classes.size).toBe(6)
  },
}

export const AllColorsLight: Story = { ...AllColors, globals: { theme: 'light' } }
