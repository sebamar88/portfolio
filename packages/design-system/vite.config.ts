/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import type { TestProjectInlineConfiguration } from 'vitest/config';

// https://vite.dev/config/
import path from 'node:path';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
const dirname = import.meta.dirname;

const visualOnly = process.env.VISUAL === '1';

// Pure logic (formatters, helpers): plain Node, no browser, milliseconds per test.
const unitProject = {
  extends: true,
  test: {
    name: 'unit',
    include: ['src/**/*.test.ts'],
    environment: 'node',
    // Fixed UTC-3 so the date-only timezone bug is reproducible on any machine.
    env: { TZ: 'America/Argentina/Buenos_Aires' },
  },
} satisfies TestProjectInlineConfiguration;

const storybookProject = {
  extends: true,
  plugins: [
    // The plugin will run tests for the stories defined in your Storybook config
    // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
    storybookTest({
      configDir: path.join(dirname, '.storybook')
    })],
  test: {
    name: 'storybook',
    browser: {
      enabled: true,
      headless: true,
      provider: playwright({}),
      instances: [{
        browser: 'chromium'
      }]
    }
  }
} satisfies TestProjectInlineConfiguration;

// Visual regression. Pixels only match inside the pinned Playwright Docker image, so this project
// exists ONLY when VISUAL=1 (set by the test:visual* scripts); `pnpm test` / `test:coverage` never see it.
const visualProject = {
  extends: true,
  test: {
    name: 'visual',
    include: ['src/visual/**/*.visual.tsx'],
    // On failure Vitest writes actual/diff images to .vitest/attachments (gitignored, uploaded by CI).
    browser: {
      enabled: true,
      headless: true,
      // Fixed size + no animation: reduced motion switches off the Badge pulse.
      viewport: { width: 800, height: 600 },
      provider: playwright({ contextOptions: { reducedMotion: 'reduce', deviceScaleFactor: 1 } }),
      instances: [{ browser: 'chromium' }],
    },
  },
} satisfies TestProjectInlineConfiguration;

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [react()],
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.stories.{ts,tsx}', 'src/**/*.test.ts', 'src/visual/**', 'src/index.ts', 'src/**/*.d.ts'],
      reporter: ['text-summary', 'html', 'json-summary'],
      reportsDirectory: 'coverage',
      // Measured at 100% lines/functions/statements and 95.6% branches when introduced. Thresholds sit
      // a few points below so a real regression fails CI while small refactors don't. Branches is lower
      // because a few defensive branches are hard to reach from tests.
      // Raise them when coverage grows; lowering them needs a reason in the commit message.
      thresholds: { lines: 95, functions: 95, branches: 90, statements: 95 },
    },
    projects: visualOnly ? [visualProject] : [unitProject, storybookProject],
  },
});
