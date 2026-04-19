import { useMemo } from 'react'
import type { RawTrackPoint } from '../../orbit/worker/types.ts'
import type { GroundTrackSegment } from '../../../types/satellite.ts'

// Instead of cutting the polyline into separate features at ±180 °, we
// unwrap the longitude sequence so it stays continuous (e.g. 170 → −175
// becomes 170 → 185). MapLibre handles coordinates outside [−180, 180]
// correctly, rendering the crossing as a short hop rather than a line
// across the whole map. A single continuous feature also lets line-gradient
// work across the full 90-minute track rather than restarting per segment.
export function unwrapTrack(points: RawTrackPoint[]): GroundTrackSegment[] {
  if (points.length < 2) return []

  const coords: Array<[number, number]> = [[points[0]!.lon, points[0]!.lat]]

  for (let i = 1; i < points.length; i++) {
    const prevLon = coords[coords.length - 1]![0]
    let lon = points[i]!.lon

    // Bring lon within 180° of prevLon to avoid a cross-world line segment
    while (lon - prevLon > 180) lon -= 360
    while (prevLon - lon > 180) lon += 360

    coords.push([lon, points[i]!.lat])
  }

  return [{ coordinates: coords }]
}

/** @deprecated use unwrapTrack — name kept for test compatibility */
export const splitAtAntimeridian = unwrapTrack

export function useAntimeridianSplit(points: RawTrackPoint[]): GroundTrackSegment[] {
  return useMemo(() => unwrapTrack(points), [points])
}
