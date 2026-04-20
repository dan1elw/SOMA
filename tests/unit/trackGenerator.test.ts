import { describe, it, expect } from 'vitest'
import { ommToSatrec } from '../../src/features/orbit/worker/parser.ts'
import { generatePastTrack } from '../../src/features/orbit/worker/trackGenerator.ts'
import type { OMM } from '../../src/types/omm.ts'

const ISS_OMM: OMM = {
  OBJECT_NAME: 'ISS (ZARYA)',
  OBJECT_ID: '1998-067A',
  EPOCH: '2025-01-15T12:00:00.000000',
  MEAN_MOTION: 15.4956,
  ECCENTRICITY: 0.0006,
  INCLINATION: 51.6431,
  RA_OF_ASC_NODE: 200.3015,
  ARG_OF_PERICENTER: 114.0597,
  MEAN_ANOMALY: 120.4512,
  EPHEMERIS_TYPE: 0,
  CLASSIFICATION_TYPE: 'U',
  NORAD_CAT_ID: 25544,
  ELEMENT_SET_NO: 999,
  REV_AT_EPOCH: 136900,
  BSTAR: 0.00013278,
  MEAN_MOTION_DOT: 0.00014553,
  MEAN_MOTION_DDOT: 0,
}

const NOW = new Date('2025-01-15T13:30:00.000Z') // 90 min after epoch

describe('generatePastTrack', () => {
  it('returns ~540 points for a 90-min track at 10s steps', () => {
    const satrec = ommToSatrec(ISS_OMM)
    const points = generatePastTrack(satrec, 25544, NOW)
    expect(points.length).toBeGreaterThanOrEqual(538)
    expect(points.length).toBeLessThanOrEqual(542)
  })

  it('all points have valid lat/lon ranges', () => {
    const satrec = ommToSatrec(ISS_OMM)
    const points = generatePastTrack(satrec, 25544, NOW)
    for (const p of points) {
      expect(p.lat).toBeGreaterThanOrEqual(-90)
      expect(p.lat).toBeLessThanOrEqual(90)
      expect(p.lon).toBeGreaterThanOrEqual(-180)
      expect(p.lon).toBeLessThanOrEqual(180)
    }
  })

  it('points are ordered chronologically', () => {
    const satrec = ommToSatrec(ISS_OMM)
    const points = generatePastTrack(satrec, 25544, NOW)
    for (let i = 1; i < points.length; i++) {
      expect(points[i]!.timestamp).toBeGreaterThan(points[i - 1]!.timestamp)
    }
  })

  it('last point is within one step of now', () => {
    const satrec = ommToSatrec(ISS_OMM)
    const points = generatePastTrack(satrec, 25544, NOW)
    const last = points[points.length - 1]!
    expect(NOW.getTime() - last.timestamp).toBeLessThanOrEqual(10_000)
  })
})
