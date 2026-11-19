import type { Meta, StoryObj } from '@storybook/react-vite'

/*
 * Every foreground/background pair the system promises is rendered here, so the a11y
 * test checks its contrast in both themes. A token change that breaks contrast fails CI.
 */

const pairs = [
  { name: 'fg on bg', bg: '--color-bg', fg: '--color-fg' },
  { name: 'fg-muted on bg', bg: '--color-bg', fg: '--color-fg-muted' },
  { name: 'fg on surface', bg: '--color-surface', fg: '--color-fg' },
  { name: 'fg-muted on surface', bg: '--color-surface', fg: '--color-fg-muted' },
  { name: 'fg on surface-raised', bg: '--color-surface-raised', fg: '--color-fg' },
  { name: 'on-primary on primary', bg: '--color-primary', fg: '--color-on-primary' },
  { name: 'on-accent on accent', bg: '--color-accent', fg: '--color-on-accent' },
  { name: 'on-danger on danger', bg: '--color-danger', fg: '--color-on-danger' },
  { name: 'on-success on success', bg: '--color-success', fg: '--color-on-success' },
  { name: 'danger on bg', bg: '--color-bg', fg: '--color-danger' },
  { name: 'success on bg', bg: '--color-bg', fg: '--color-success' },
  { name: 'accent on bg', bg: '--color-bg', fg: '--color-accent' },
  ...[1, 2, 3, 4, 5, 6].map((n) => ({
    name: `on-avatar on avatar-${n}`,
    bg: `--color-avatar-${n}`,
    fg: '--color-on-avatar',
  })),
]

const glows = ['--glow-accent', '--glow-success', '--glow-danger']

const spaces = ['--space-1', '--space-2', '--space-3', '--space-4', '--space-6', '--space-8']

function TokenSheet() {
  return (
    <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
      <section>
        <h2 style={{ fontSize: 'var(--text-lg)' }}>Color pairs</h2>
        <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
          {pairs.map((p) => (
            <div
              key={p.name}
              style={{
                background: `var(${p.bg})`,
                color: `var(${p.fg})`,
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-3)',
                fontSize: 'var(--text-sm)',
              }}
            >
              {p.name} <code style={{ fontFamily: 'var(--font-mono)' }}>{p.fg} / {p.bg}</code>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 'var(--text-lg)' }}>Effects</h2>
        <div
          aria-hidden="true"
          style={{ height: 'var(--space-2)', borderRadius: 'var(--radius-full)', background: 'var(--gradient-accent)' }}
        />
        <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
          {glows.map((g) => (
            <div
              key={g}
              style={{
                boxShadow: `var(${g})`,
                background: 'var(--color-surface)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-4)',
                fontSize: 'var(--text-sm)',
              }}
            >
              <code style={{ fontFamily: 'var(--font-mono)' }}>{g}</code>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 'var(--text-lg)' }}>Spacing</h2>
        {spaces.map((s) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <code style={{ fontFamily: 'var(--font-mono)', width: '6rem' }}>{s}</code>
            <div style={{ width: `var(${s})`, height: 'var(--space-4)', background: 'var(--color-primary)' }} />
          </div>
        ))}
      </section>
    </div>
  )
}

const meta = {
  title: 'Foundations/Tokens',
  component: TokenSheet,
} satisfies Meta<typeof TokenSheet>

export default meta
type Story = StoryObj<typeof meta>

export const Dark: Story = { globals: { theme: 'dark' } }
export const Light: Story = { globals: { theme: 'light' } }
