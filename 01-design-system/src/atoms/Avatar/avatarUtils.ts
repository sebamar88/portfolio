const firstChar = (word: string) => Array.from(word)[0] ?? ''

/** First letter of the first and last word, uppercased. "?" when there is nothing to show. */
export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  const first = firstChar(words[0])
  // Array.from iterates code points, so accents/astral chars are never split into surrogates.
  const last = words.length > 1 ? firstChar(words[words.length - 1]) : ''
  return (first + last).toLocaleUpperCase()
}

/**
 * Stable color slot per name: the same person keeps the same color on every render and device.
 * Normalized first so "ANA " and "ana" match. FNV-1a hash: tiny, deterministic, well spread.
 */
export function getAvatarColorIndex(name: string, count: number): number {
  const normalized = name.trim().toLowerCase()
  let hash = 0x811c9dc5
  for (const ch of normalized) {
    hash ^= ch.codePointAt(0) ?? 0
    hash = Math.imul(hash, 0x01000193)
  }
  // >>> 0 turns the signed 32-bit result into an unsigned one so % is never negative.
  return (hash >>> 0) % count
}
