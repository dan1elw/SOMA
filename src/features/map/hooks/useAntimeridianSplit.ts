import { useMemo } from 'react'
import type { RawTrackPoint } from '../../orbit/worker/types.ts'
import type { GroundTrackSegment } from '../../../types/satellite.ts'

export function splitAtAntimeridian(points: RawTrackPoint[]): GroundTrackSegment[] {
  if (points.length < 2) return []

  const segments: GroundTrackSegment[] = []
  let current: Array<[number, number]> = [[points[0]!.lon, points[0]!.lat]]

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]!
    const curr = points[i]!

    if (Math.abs(curr.lon - prev.lon) > 180) {
      if (current.length >= 2) segments.push({ coordinates: current })
      current = [[curr.lon, curr.lat]]
    } else {
      current.push([curr.lon, curr.lat])
    }
  }

  if (current.length >= 2) segments.push({ coordinates: current })

  return segments
}

export function useAntimeridianSplit(points: RawTrackPoint[]): GroundTrackSegment[] {
  return useMemo(() => splitAtAntimeridian(points), [points])
}
