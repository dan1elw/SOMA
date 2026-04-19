import { useEffect } from 'react'
import type maplibregl from 'maplibre-gl'
import type { GroundTrackSegment } from '../../../types/satellite.ts'
import type { RawTrackPoint } from '../../orbit/worker/types.ts'
import { useAntimeridianSplit } from '../hooks/useAntimeridianSplit.ts'

const TRACK_COLOR = '#7dd3fc'

interface Props {
  map: maplibregl.Map
  noradId: number
  points: RawTrackPoint[]
  highlighted?: boolean
}

// Per-segment opacity based on each segment's position in the total track.
// line-gradient restarts at 0 for every antimeridian-split feature, causing
// apparent gaps; discrete opacity per segment avoids this (ADR-prescribed fallback).
function buildGeojson(segments: GroundTrackSegment[]): GeoJSON.FeatureCollection {
  const totalPoints = segments.reduce((n, s) => n + s.coordinates.length, 0)
  let cursor = 0

  return {
    type: 'FeatureCollection',
    features: segments.map((seg) => {
      const start = cursor
      const end = cursor + seg.coordinates.length - 1
      cursor += seg.coordinates.length

      const midFrac = (start + end) / 2 / Math.max(totalPoints - 1, 1)
      // First 20 % of the total track fades 0 → 1; remainder stays at 1
      const opacity = Math.min(1, midFrac / 0.2)

      return {
        type: 'Feature',
        properties: { opacity },
        geometry: { type: 'LineString', coordinates: seg.coordinates },
      }
    }),
  }
}

export function GroundTrackLayer({ map, noradId, points, highlighted = false }: Props) {
  const sourceId = `track-source-${noradId}`
  const layerId = `track-layer-${noradId}`
  const segments = useAntimeridianSplit(points)

  // Create source + layer once
  useEffect(() => {
    map.addSource(sourceId, { type: 'geojson', data: buildGeojson([]) })

    map.addLayer({
      id: layerId,
      type: 'line',
      source: sourceId,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-width': 1.5,
        'line-color': TRACK_COLOR,
        'line-opacity': ['coalesce', ['get', 'opacity'], 1] as maplibregl.ExpressionSpecification,
      },
    })

    return () => {
      if (map.getLayer(layerId)) map.removeLayer(layerId)
      if (map.getSource(sourceId)) map.removeSource(sourceId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, noradId])

  // Update line width when highlight changes
  useEffect(() => {
    if (map.getLayer(layerId)) {
      map.setPaintProperty(layerId, 'line-width', highlighted ? 3 : 1.5)
    }
  }, [map, layerId, highlighted])

  // Push updated track data into the source
  useEffect(() => {
    const source = map.getSource(sourceId) as maplibregl.GeoJSONSource | undefined
    source?.setData(buildGeojson(segments))
  }, [map, sourceId, segments])

  return null
}
