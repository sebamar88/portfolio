# Expenses Design System

Accessible React components for a shared-expenses app (groups, expenses, balances, settling debts).
Dark first, built on design tokens, and every component is tested in a real browser with
accessibility checks that fail the build.

**Live Storybook:** [sebamar88.github.io/portfolio](https://sebamar88.github.io/portfolio/) · Part of the [portfolio monorepo](https://github.com/sebamar88/portfolio) (project 1 of 10).

## What this project demonstrates

- **Atomic design** with a real hierarchy: tokens → atoms → molecules.
- **Accessibility as a test, not a review comment:** axe runs on every story in `error` mode.
- **Component tests:** every Storybook story is also a Vitest test running in headless Chromium.
- **Design tokens and theming:** dark and light themes from the same components.

## Quick start

```sh
pnpm install
pnpm storybook   # catalog at http://localhost:6006
pnpm test        # unit tests (Node) + story tests (Chromium, with a11y checks)
pnpm build       # type check
pnpm lint
```

## What's inside

| Level | Component | Highlights |
| --- | --- | --- |
| Foundations | Tokens | Two-layer tokens, dark/light themes, every color pair contrast-checked |
| Atom | `Button` | Native `<button>`, `type="button"` by default, keyboard-only focus ring |
| Atom | `Text` | `as` (semantics) and `size` (looks) are separate props |
| Atom | `Input` | Prefix/suffix adornments, styled from `aria-invalid` |
| Atom | `Money` | Integer minor units, `Intl` formatting, balance meaning not carried by color alone |
| Atom | `Avatar` | Photo with initials fallback, stable color hashed from the name |
| Atom | `Badge` | Tinted pill, "live" dot that respects reduced motion |
| Molecule | `TextField` | Label + `Input` + hint + error, wired with `aria-describedby` |
| Molecule | `ExpenseRow` | Avatar, description, who paid, date and your share of the expense |

Each component has an auto-generated **Docs** page (props table from its types and JSDoc) and the
catalog opens with a **Get started** guide written in MDX.

## Decisions and trade-offs

**Tokens in two layers.** Primitives (`$violet-400`) are Sass variables, so they only exist at
compile time and no component can use them by accident. Semantic tokens (`--color-accent`) are CSS
custom properties, because themes switch at runtime and Sass variables can't. A theme only remaps
roles; components never change.

**Accessibility checks fail the suite.** The Storybook a11y addon runs with `test: 'error'`. I
verified the gate works by breaking things on purpose (lowering a text color's contrast, removing
`type="button"`, dropping a screen-reader label) and watching the right test fail.

**Native elements first.** `Button` is a `<button>`, `Input` is an `<input>`. Focus, keyboard
activation and disabled behavior come from the browser instead of being re-implemented.

**Money as integers.** Amounts are integer minor units (`123450` → `$1,234.50`) because floats can't
represent most decimals (`0.1 + 0.2 !== 0.3`). `formatMoney` throws on non-integers instead of
silently rounding, and the currency (not the code) decides the decimals: USD has 2, JPY has 0.

**Meaning never by color alone.** A balance is green/red, but also carries a visible `+`/`-` and a
screen-reader-only phrase ("You owe -$15.33"), per WCAG 1.4.1.

**Date-only strings stay on their day.** `new Date('2026-11-19')` is UTC midnight, so in Argentina
(UTC-3) it renders as Nov 18. `formatExpenseDate` builds and formats the date in UTC. Unit tests run
with `TZ=America/Argentina/Buenos_Aires` so the bug would show up on any machine.

**Semantics separate from looks.** `<Text as="h2" size="sm">` is still a level-2 heading. Heading
levels are chosen for document structure, never because "h4 looked the right size".

**`Input` atom vs `TextField` molecule.** The bare field (with adornments) and the labeled form field
are separate, like MUI's `InputBase` and `TextField`. Adding a prefix didn't justify a new component;
it's still one job.

**SCSS + CSS Modules.** Scoped class names avoid collisions, and Sass loops (`@each`) generate the
size, tone and weight classes straight from the token scale.

**Two levels of tests.** Pure logic (`formatMoney`, `formatExpenseDate`, avatar helpers) runs as
millisecond unit tests in Node; components run as story tests in Chromium.

**Storybook + monorepo over Bit.** I considered [Bit](https://bit.dev), which versions and publishes
each component independently. It shines when many teams and repos consume components. Here there is
one consumer set (later projects in the same monorepo), and I wanted mainstream tools an interviewer
recognizes, with no platform lock-in. If the kit ever needs to be installed from other repos, the
next step is publishing it as an npm package (Vite library mode + Changesets) from the existing
`src/index.ts` entry point.

**pnpm build scripts.** pnpm blocks dependency install scripts by default. `pnpm-workspace.yaml`
allows only `esbuild` (needed by Vite) and explicitly denies `@parcel/watcher` (only used by the Sass
CLI, which Vite doesn't need).

## Known limitations

- Not published to npm; consumed from source inside the monorepo.
- `ExpenseRow` is intentionally non-interactive; apps wrap it in a link or button, which avoids
  nested interactive elements.
- The `Avatar/AllColors` story uses names picked to hit all six colors; changing the hash function
  would break it without a real bug.
- No visual regression tests yet (screenshots were checked manually).
- Storybook's Docs pages use its default light chrome, while stories default to dark.

## Project structure

```
src/
  tokens/      design tokens (SCSS) + token sheet story
  styles/      shared Sass mixins (focus ring, visually hidden)
  atoms/       Button, Text, Input, Money, Avatar, Badge
  molecules/   TextField, ExpenseRow
  index.ts     public entry point
  introduction.mdx
```
