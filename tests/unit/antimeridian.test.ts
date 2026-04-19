import { describe, it, expect } from 'vitest'
import { splitAtAntimeridian } from '../../src/features/map/hooks/useAntimeridianSplit.ts'

describe('splitAtAntimeridian', () => {
  it('returns empty array for empty input', () => {
    expect(splitAtAntimeridian([])).toEqual([])
  })

  it('returns empty array for a single point', () => {
    expect(splitAtAntimeridian([{ lon: 0, lat: 0, timestamp: 0 }])).toEqual([])
  })

  it('returns one segment when no antimeridian crossing', () => {
    const points = [
      { lon: -10, lat: 0, timestamp: 0 },
      { lon: 0, lat: 0, timestamp: 1 },
      { lon: 10, lat: 0, timestamp: 2 },
    ]
    const result = splitAtAntimeridian(points)
    expect(result).toHaveLength(1)
    expect(result[0]!.coordinates).toHaveLength(3)
  })

  it('splits into two segments on westward antimeridian crossing', () => {
    const points = [
      { lon: 170, lat: 0, timestamp: 0 },
      { lon: 175, lat: 0, timestamp: 1 },
      { lon: -175, lat: 0, timestamp: 2 },
      { lon: -170, lat: 0, timestamp: 3 },
    ]
    const result = splitAtAntimeridian(points)
    expect(result).toHaveLength(2)
    expect(result[0]!.coordinates).toEqual([
      [170, 0],
      [175, 0],
    ])
    expect(result[1]!.coordinates).toEqual([
      [-175, 0],
      [-170, 0],
    ])
  })

  it('splits into two segments on eastward antimeridian crossing', () => {
    const points = [
      { lon: -170, lat: 0, timestamp: 0 },
      { lon: -175, lat: 0, timestamp: 1 },
      { lon: 175, lat: 0, timestamp: 2 },
      { lon: 170, lat: 0, timestamp: 3 },
    ]
    const result = splitAtAntimeridian(points)
    expect(result).toHaveLength(2)
  })

  it('drops single-point segments from multiple rapid crossings', () => {
    const points = [
      { lon: 170, lat: 50, timestamp: 0 },
      { lon: -170, lat: 50, timestamp: 1 },
      { lon: 170, lat: 50, timestamp: 2 },
      { lon: -170, lat: 50, timestamp: 3 },
    ]
    const result = splitAtAntimeridian(points)
    expect(result).toHaveLength(0)
  })

  it('handles multiple points with one crossing', () => {
    const points = [
      { lon: 100, lat: 0, timestamp: 0 },
      { lon: 150, lat: 0, timestamp: 1 },
      { lon: -170, lat: 0, timestamp: 2 },
      { lon: -100, lat: 0, timestamp: 3 },
    ]
    const result = splitAtAntimeridian(points)
    expect(result).toHaveLength(2)
    expect(result[0]!.coordinates).toHaveLength(2)
    expect(result[1]!.coordinates).toHaveLength(2)
  })
})
