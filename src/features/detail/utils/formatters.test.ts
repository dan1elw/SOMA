import { describe, it, expect } from 'vitest'
import {
  formatLatLon,
  formatAltitude,
  formatVelocity,
  formatUtcTimestamp,
  formatDegrees,
} from './formatters'

describe('formatLatLon', () => {
  it('formats north latitude', () => {
    expect(formatLatLon(51.5, 'lat')).toBe('51.5000° N')
  })

  it('formats south latitude', () => {
    expect(formatLatLon(-33.9, 'lat')).toBe('33.9000° S')
  })

  it('formats east longitude', () => {
    expect(formatLatLon(0.1276, 'lon')).toBe('0.1276° E')
  })

  it('formats west longitude', () => {
    expect(formatLatLon(-74.006, 'lon')).toBe('74.0060° W')
  })

  it('formats zero as North/East', () => {
    expect(formatLatLon(0, 'lat')).toBe('0.0000° N')
    expect(formatLatLon(0, 'lon')).toBe('0.0000° E')
  })
})

describe('formatAltitude', () => {
  it('rounds and adds km suffix', () => {
    expect(formatAltitude(408.3)).toBe('408 km')
  })

  it('adds thousands separator for GEO', () => {
    expect(formatAltitude(35786)).toBe('35,786 km')
  })
})

describe('formatVelocity', () => {
  it('formats to 2 decimal places with unit', () => {
    expect(formatVelocity(7.661)).toBe('7.66 km/s')
  })

  it('pads trailing zero', () => {
    expect(formatVelocity(3.1)).toBe('3.10 km/s')
  })
})

describe('formatUtcTimestamp', () => {
  it('formats a known UTC timestamp', () => {
    const ts = new Date('2025-04-20T12:00:00Z').getTime()
    expect(formatUtcTimestamp(ts)).toBe('2025-04-20 12:00:00 UTC')
  })
})

describe('formatDegrees', () => {
  it('formats inclination', () => {
    expect(formatDegrees(51.6416)).toBe('51.6416°')
  })
})
