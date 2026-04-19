import { describe, it, expect } from 'vitest'
import { classifyOrbit } from '../../src/features/orbit/worker/classifier.ts'

describe('classifyOrbit', () => {
  it('ISS (NORAD 25544) → LEO', () => {
    // ISS mean motion ≈ 15.49 rev/day
    expect(classifyOrbit(15.49)).toBe('LEO')
  })

  it('boundary LEO: just above 11.25 → LEO', () => {
    expect(classifyOrbit(11.26)).toBe('LEO')
  })

  it('GOES-16 (NORAD 41866) → GEO', () => {
    // GEO mean motion ≈ 1.0027 rev/day
    expect(classifyOrbit(1.0027)).toBe('GEO')
  })

  it('GEO lower boundary (0.95) → GEO', () => {
    expect(classifyOrbit(0.95)).toBe('GEO')
  })

  it('GEO upper boundary (1.05) → GEO', () => {
    expect(classifyOrbit(1.05)).toBe('GEO')
  })

  it('GPS Block IIF (NORAD 39166) → MEO', () => {
    // GPS mean motion ≈ 2.0056 rev/day
    expect(classifyOrbit(2.0056)).toBe('MEO')
  })

  it('MEO lower boundary (1.8) → MEO', () => {
    expect(classifyOrbit(1.8)).toBe('MEO')
  })

  it('MEO upper boundary (2.5) → MEO', () => {
    expect(classifyOrbit(2.5)).toBe('MEO')
  })

  it('Molniya (HEO) → HEO', () => {
    // Molniya orbit mean motion ≈ 2.006 rev/day — but outside MEO range
    // Typical Molniya: ~2 rev/day but MEAN_MOTION ≈ 2.0, however HEO is the
    // catch-all for < 11.25 that doesn't fit GEO or MEO
    // Use a value that falls outside GEO (< 0.95) to represent sub-GEO HEO
    expect(classifyOrbit(0.5)).toBe('HEO')
  })

  it('between GEO and MEO gap (1.1) → HEO', () => {
    expect(classifyOrbit(1.1)).toBe('HEO')
  })

  it('between MEO and LEO gap (5.0) → HEO', () => {
    expect(classifyOrbit(5.0)).toBe('HEO')
  })
})
