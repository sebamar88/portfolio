import { create } from 'storybook/theming'

// Hex literals mirror src/tokens/tokens.scss (Storybook chrome cannot read CSS custom properties).
export default create({
  base: 'dark',
  brandTitle: 'Expenses Design System',
  brandUrl: 'https://github.com/sebamar88/portfolio',
  colorPrimary: '#c084fc',
  colorSecondary: '#c084fc',
  appBg: '#0a0b14',
  appContentBg: '#0a0b14',
  appPreviewBg: '#0a0b14',
  appBorderColor: '#2a2d45',
  appBorderRadius: 8,
  textColor: '#f5f6fa',
  textMutedColor: '#a0a4bd',
  textInverseColor: '#0a0b14',
  barBg: '#141627',
  barTextColor: '#a0a4bd',
  barSelectedColor: '#c084fc',
  barHoverColor: '#f472b6',
  inputBg: '#1d2036',
  inputBorder: '#2a2d45',
  inputTextColor: '#f5f6fa',
  fontBase: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  fontCode: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
})
