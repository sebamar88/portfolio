// Prints the Vitest coverage totals as a Markdown table (CI appends it to the job summary).
// Usage: node scripts/coverage-summary.mjs >> "$GITHUB_STEP_SUMMARY"
import { readFileSync } from 'node:fs'

const { total } = JSON.parse(readFileSync(new URL('../coverage/coverage-summary.json', import.meta.url), 'utf8'))

const rows = ['lines', 'statements', 'functions', 'branches'].map(
  (metric) => `| ${metric} | ${total[metric].pct}% | ${total[metric].covered}/${total[metric].total} |`,
)

console.log(['### Coverage', '', '| Metric | Covered | Count |', '| --- | --- | --- |', ...rows].join('\n'))
