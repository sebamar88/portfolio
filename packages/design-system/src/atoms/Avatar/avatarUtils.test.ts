import { describe, expect, it } from 'vitest'
import { getAvatarColorIndex, getInitials } from './avatarUtils'

describe('getInitials', () => {
  it('uses first and last word', () => {
    expect(getInitials('Ana López')).toBe('AL')
    expect(getInitials('ana maría de la cruz')).toBe('AC')
  })

  it('uses one letter for a single word', () => {
    expect(getInitials('madonna')).toBe('M')
  })

  it('trims and collapses whitespace', () => {
    expect(getInitials('   ana    lópez  ')).toBe('AL')
  })

  it('is Unicode-safe', () => {
    expect(getInitials('Ángel Núñez')).toBe('ÁN')
    // Astral code point: must not be split into a lone surrogate.
    expect(getInitials('𝒜da 𝒵ed')).toBe('𝒜𝒵')
  })

  it('returns ? for empty or blank names', () => {
    expect(getInitials('')).toBe('?')
    expect(getInitials('   ')).toBe('?')
  })
})

describe('getAvatarColorIndex', () => {
  it('is deterministic', () => {
    expect(getAvatarColorIndex('Ana López', 6)).toBe(getAvatarColorIndex('Ana López', 6))
  })

  it('ignores case and surrounding whitespace', () => {
    expect(getAvatarColorIndex('  ANA lópez ', 6)).toBe(getAvatarColorIndex('ana lópez', 6))
  })

  it('stays in range', () => {
    for (const name of ['', 'a', 'Ana', 'Bob Smith', '𝒜da', 'x'.repeat(500)]) {
      const i = getAvatarColorIndex(name, 6)
      expect(Number.isInteger(i)).toBe(true)
      expect(i).toBeGreaterThanOrEqual(0)
      expect(i).toBeLessThan(6)
    }
  })

  it('spreads different names over several indexes', () => {
    const names = ['Ana', 'Bruno', 'Carla', 'Diego', 'Elena', 'Facundo', 'Gala', 'Hugo']
    expect(new Set(names.map((n) => getAvatarColorIndex(n, 6))).size).toBeGreaterThan(1)
  })
})
