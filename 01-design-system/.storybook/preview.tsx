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
      // The page background follows the toolbar theme; the wrapper follows the story's own theme.
      // In Docs many stories render on one page (some pin light), so the page stays dark there and
      // only each story's own wrapper switches; tokens only define light as an override of dark.
      document.documentElement.dataset.theme = context.viewMode === 'docs' ? 'dark' : context.globals.theme
      // A story's own pinned theme wins; in Docs the shared toolbar global is unreliable.
      const storyTheme = context.storyGlobals?.theme ?? (context.viewMode === 'docs' ? 'dark' : context.globals.theme)
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
