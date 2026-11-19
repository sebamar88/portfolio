import type { Preview } from '@storybook/react-vite'
import '../src/tokens/tokens.scss'
import './preview.scss'
import theme from './theme'

const preview: Preview = {
  // Toolbar switch: light / dark. Stories can pin one with `globals: { theme: 'dark' }`.
  globalTypes: {
    theme: {
      description: 'Color theme',
      toolbar: {
        title: 'Theme',
        icon: 'mirror',
        items: [
          { value: 'dark', title: 'Dark' },
          { value: 'light', title: 'Light' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'dark' },

  decorators: [
    (Story, context) => {
      // In Docs, many stories share one page and some pin `theme: 'light'`. A pinned story can leak
      // its globals into that shared page, so Docs always uses dark as the page theme.
      const pageTheme = context.viewMode === 'docs' ? 'dark' : context.globals.theme
      // Each story's wrapper uses the theme it pins (e.g. the *Light stories), else the page theme.
      const storyTheme = context.storyGlobals?.theme ?? pageTheme
      document.documentElement.dataset.theme = pageTheme
      return (
      <div
        data-theme={storyTheme}
        style={{
          background: 'var(--color-bg)',
          color: 'var(--color-fg)',
          fontFamily: 'var(--font-sans)',
          padding: 'var(--space-4)',
        }}
      >
        <Story />
      </div>
      )
    },
  ],

  parameters: {
    layout: 'fullscreen',
    docs: { theme },
    options: {
      // Sidebar follows the atomic design order instead of alphabetical.
      storySort: { order: ['Get started', 'Foundations', 'Atoms', 'Molecules', 'Organisms'] },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'error' fails the test run on any accessibility violation (e.g. low contrast).
      test: 'error',
    },
  },
}

export default preview
