import { propagate, gstime, eciToGeodetic, degreesLat, degreesLong } from 'satellite.js'
import type { SatRec } from 'satellite.js'
import type { SatellitePosition } from '../../../types/satellite.ts'

export function propagatePosition(
  satrec: SatRec,
  date: Date,
  noradId: number,
): SatellitePosition | null {
  const result = propagate(satrec, date)

  if (typeof result.position === 'boolean' || typeof result.velocity === 'boolean') {
    return null
  }

  const gmst = gstime(date)
  const geo = eciToGeodetic(result.position, gmst)
  const { x: vx, y: vy, z: vz } = result.velocity
  const velocity = Math.sqrt(vx * vx + vy * vy + vz * vz)

  return {
    noradId,
    timestamp: date.getTime(),
    latitude: degreesLat(geo.latitude),
    longitude: degreesLong(geo.longitude),
    altitude: geo.height,
    velocity,
  }
}
