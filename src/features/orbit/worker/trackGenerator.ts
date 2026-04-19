import type { SatRec } from 'satellite.js'
import { propagatePosition } from './propagator.ts'
import type { RawTrackPoint } from './types.ts'

const TRACK_DURATION_MS = 90 * 60 * 1000
const STEP_MS = 30_000 // 180 points max

export function generatePastTrack(satrec: SatRec, noradId: number, now: Date): RawTrackPoint[] {
  const points: RawTrackPoint[] = []
  const end = now.getTime()
  const start = end - TRACK_DURATION_MS

  for (let t = start; t <= end; t += STEP_MS) {
    const pos = propagatePosition(satrec, new Date(t), noradId)
    if (pos !== null) {
      points.push({ lon: pos.longitude, lat: pos.latitude, timestamp: t })
    }
  }

  return points
}
