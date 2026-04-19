import { describe, it, expect } from 'vitest'
import { unwrapTrack } from '../../src/features/map/hooks/useAntimeridianSplit.ts'

// unwrapTrack normalises the longitude sequence so it stays continuous,
// allowing a single LineString feature and correct line-gradient behaviour.
// Coordinates may go outside [−180, 180]; MapLibre renders them correctly.

describe('unwrapTrack', () => {
  it('returns empty array for empty input', () => {
    expect(unwrapTrack([])).toEqual([])
  })

  it('returns empty array for a single point', () => {
    expect(unwrapTrack([{ lon: 0, lat: 0, timestamp: 0 }])).toEqual([])
  })

  it('returns one segment for a track with no antimeridian crossing', () => {
    const points = [
      { lon: -10, lat: 0, timestamp: 0 },
      { lon: 0, lat: 0, timestamp: 1 },
      { lon: 10, lat: 0, timestamp: 2 },
    ]
    const result = unwrapTrack(points)
    expect(result).toHaveLength(1)
    expect(result[0]!.coordinates).toEqual([
      [-10, 0],
      [0, 0],
      [10, 0],
    ])
  })

  it('unwraps a westward crossing (170 → −175) into one continuous segment', () => {
    const points = [
      { lon: 170, lat: 0, timestamp: 0 },
      { lon: 175, lat: 0, timestamp: 1 },
      { lon: -175, lat: 0, timestamp: 2 },
      { lon: -170, lat: 0, timestamp: 3 },
    ]
    const result = unwrapTrack(points)
    expect(result).toHaveLength(1)
    // −175 and −170 are unwrapped to 185 and 190
    expect(result[0]!.coordinates).toEqual([
      [170, 0],
      [175, 0],
      [185, 0],
      [190, 0],
    ])
  })

  it('unwraps an eastward crossing (−170 → 175) into one continuous segment', () => {
    const points = [
      { lon: -170, lat: 0, timestamp: 0 },
      { lon: -175, lat: 0, timestamp: 1 },
      { lon: 175, lat: 0, timestamp: 2 },
      { lon: 170, lat: 0, timestamp: 3 },
    ]
    const result = unwrapTrack(points)
    expect(result).toHaveLength(1)
    // 175 and 170 are unwrapped to −185 and −190
    expect(result[0]!.coordinates).toEqual([
      [-170, 0],
      [-175, 0],
      [-185, 0],
      [-190, 0],
    ])
  })

  it('handles multiple antimeridian crossings as one segment with unwrapped coords', () => {
    const points = [
      { lon: 170, lat: 50, timestamp: 0 },
      { lon: -170, lat: 50, timestamp: 1 },
      { lon: 170, lat: 50, timestamp: 2 },
      { lon: -170, lat: 50, timestamp: 3 },
    ]
    const result = unwrapTrack(points)
    expect(result).toHaveLength(1)
    expect(result[0]!.coordinates).toEqual([
      [170, 50],
      [190, 50],
      [170, 50],
      [190, 50],
    ])
  })

  it('consecutive unwrapped longitudes stay within 180° of each other', () => {
    const points = [
      { lon: 170, lat: 0, timestamp: 0 },
      { lon: 175, lat: 0, timestamp: 1 },
      { lon: -175, lat: 0, timestamp: 2 },
      { lon: -100, lat: 0, timestamp: 3 },
    ]
    const result = unwrapTrack(points)
    const coords = result[0]!.coordinates
    for (let i = 1; i < coords.length; i++) {
      expect(Math.abs(coords[i]![0] - coords[i - 1]![0])).toBeLessThanOrEqual(180)
    }
  })
})
