import type { Preview } from '@storybook/react-vite'
import '../src/tokens/tokens.scss'
import './preview.scss'

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
      document.documentElement.dataset.theme = context.globals.theme
      return (
      <div
        data-theme={context.globals.theme}
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
