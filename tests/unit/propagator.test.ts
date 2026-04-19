import { describe, it, expect } from 'vitest'
import { ommToSatrec } from '../../src/features/orbit/worker/parser.ts'
import { propagatePosition } from '../../src/features/orbit/worker/propagator.ts'
import type { OMM } from '../../src/types/omm.ts'

// Real ISS (ZARYA) orbital elements — CelesTrak OMM, epoch 2025-01-15T12:00:00Z
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

const EPOCH_MS = new Date('2025-01-15T12:00:00.000Z').getTime()

describe('propagatePosition (ISS at known epoch)', () => {
  it('returns a non-null position at epoch', () => {
    const satrec = ommToSatrec(ISS_OMM)
    const pos = propagatePosition(satrec, new Date(EPOCH_MS), 25544)

    expect(pos).not.toBeNull()
  })

  it('position is within ISS orbital constraints', () => {
    const satrec = ommToSatrec(ISS_OMM)
    const pos = propagatePosition(satrec, new Date(EPOCH_MS), 25544)!

    // ISS inclination 51.6° — latitude never exceeds this
    expect(pos.latitude).toBeGreaterThanOrEqual(-52)
    expect(pos.latitude).toBeLessThanOrEqual(52)
    // Longitude always in valid range
    expect(pos.longitude).toBeGreaterThanOrEqual(-180)
    expect(pos.longitude).toBeLessThanOrEqual(180)
    // ISS altitude ~400–430 km
    expect(pos.altitude).toBeGreaterThan(370)
    expect(pos.altitude).toBeLessThan(450)
    // ISS orbital velocity ~7.66 km/s
    expect(pos.velocity).toBeGreaterThan(7.0)
    expect(pos.velocity).toBeLessThan(8.0)
  })

  it('attaches correct noradId and timestamp', () => {
    const satrec = ommToSatrec(ISS_OMM)
    const pos = propagatePosition(satrec, new Date(EPOCH_MS), 25544)!

    expect(pos.noradId).toBe(25544)
    expect(pos.timestamp).toBe(EPOCH_MS)
  })

  it('propagates correctly 90 minutes after epoch', () => {
    const satrec = ommToSatrec(ISS_OMM)
    const t90 = new Date(EPOCH_MS + 90 * 60 * 1000)
    const pos = propagatePosition(satrec, t90, 25544)

    // Should still be a valid LEO position one orbit later
    expect(pos).not.toBeNull()
    expect(pos!.altitude).toBeGreaterThan(370)
    expect(pos!.altitude).toBeLessThan(450)
  })
})
