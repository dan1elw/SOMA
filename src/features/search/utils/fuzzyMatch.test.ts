import { describe, it, expect } from 'vitest'
import { fuzzyMatch } from './fuzzyMatch'

describe('fuzzyMatch', () => {
  it('exact match scores 1.0', () => {
    expect(fuzzyMatch('iss', 'ISS')).toBe(1.0)
  })

  it('starts-with match scores 0.8', () => {
    expect(fuzzyMatch('star', 'Starlink-1234')).toBe(0.8)
  })

  it('contains match scores 0.6', () => {
    expect(fuzzyMatch('link', 'Starlink-1234')).toBe(0.6)
  })

  it('subsequence match scores 0.3', () => {
    expect(fuzzyMatch('slk', 'Starlink-1234')).toBe(0.3)
  })

  it('no match scores 0', () => {
    expect(fuzzyMatch('zzz', 'Hubble')).toBe(0)
  })

  it('is case-insensitive', () => {
    expect(fuzzyMatch('HUBBLE', 'hubble space telescope')).toBe(0.8)
  })

  it('empty query matches starts-with (prefix of everything)', () => {
    expect(fuzzyMatch('', 'ISS')).toBe(0.8)
  })
})
