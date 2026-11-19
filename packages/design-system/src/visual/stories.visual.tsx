/*
 * Visual regression: renders real stories (portable stories + .storybook/preview.tsx, so the
 * theme decorator and tokens.scss apply) and compares them pixel-by-pixel with committed baselines.
 *
 * Pixels differ between machines (fonts, antialiasing), so this project only runs inside the pinned
 * Playwright Docker image: `pnpm test:visual` / `pnpm test:visual:update` (see scripts/visual-docker.sh).
 * It is enabled by VISUAL=1 (see vite.config.ts), so plain `pnpm test` never picks it up.
 */
import { setProjectAnnotations, composeStories } from '@storybook/react-vite'
import { page } from 'vitest/browser'
import { render } from 'vitest-browser-react'
import { describe, expect, it } from 'vitest'
import preview from '../../.storybook/preview'
import * as Tokens from '../tokens/Tokens.stories'
import * as Button from '../atoms/Button/Button.stories'
import * as Input from '../atoms/Input/Input.stories'
import * as Text from '../atoms/Text/Text.stories'
import * as Money from '../atoms/Money/Money.stories'
import * as Avatar from '../atoms/Avatar/Avatar.stories'
import * as Badge from '../atoms/Badge/Badge.stories'
import * as TextField from '../molecules/TextField/TextField.stories'
import * as ExpenseRow from '../molecules/ExpenseRow/ExpenseRow.stories'
import * as ExpenseList from '../organisms/ExpenseList/ExpenseList.stories'

// A story renders with its own `globals: { theme }`, falling back to the project's initial dark.
setProjectAnnotations([preview])

type Renderable = () => unknown
interface Group { name: string; stories: Record<string, Renderable>; picks: string[] }

const groups: Group[] = [
  { name: 'Tokens', stories: composeStories(Tokens), picks: ['Dark', 'Light'] },
  { name: 'Button', stories: composeStories(Button), picks: ['AllVariants', 'AllVariantsLight'] },
  { name: 'Input', stories: composeStories(Input), picks: ['AllStates', 'AllStatesLight'] },
  { name: 'TextField', stories: composeStories(TextField), picks: ['AllStates', 'AllStatesLight'] },
  { name: 'Text', stories: composeStories(Text), picks: ['Scale', 'Tones', 'TonesLight'] },
  { name: 'Money', stories: composeStories(Money), picks: ['Balances', 'BalancesLight'] },
  { name: 'Avatar', stories: composeStories(Avatar), picks: ['AllColors', 'AllColorsLight'] },
  { name: 'Badge', stories: composeStories(Badge), picks: ['AllTones', 'AllTonesLight'] },
  { name: 'ExpenseRow', stories: composeStories(ExpenseRow), picks: ['List', 'ListLight'] },
  { name: 'ExpenseList', stories: composeStories(ExpenseList), picks: ['Default', 'DefaultLight'] },
] as unknown as Group[]

// Tight on purpose: a changed token color moves whole areas of pixels, anti-aliasing noise does not
// exist in the pinned image. threshold is YIQ per-pixel distance (default 0.1 is too lenient).
const comparatorOptions = { threshold: 0.02, allowedMismatchedPixelRatio: 0.0005 }

// Fixed width, but tall stories (Tokens) need a taller viewport or the element renders cut off.
const WIDTH = 800
const MIN_HEIGHT = 600

describe.each(groups)('visual: $name', ({ name, stories, picks }) => {
  it.each(picks)('%s', async (pick) => {
    const Story = stories[pick] as unknown as () => React.JSX.Element
    await page.viewport(WIDTH, MIN_HEIGHT)
    const { container } = await render(<Story />)
    await document.fonts.ready
    await page.viewport(WIDTH, Math.max(MIN_HEIGHT, Math.ceil(container.scrollHeight)))
    await expect
      .element(page.elementLocator(container))
      .toMatchScreenshot(`${name}-${pick}`, { comparatorName: 'pixelmatch', comparatorOptions })
  })
})
