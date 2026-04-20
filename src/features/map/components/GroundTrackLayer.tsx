import { useEffect, useMemo } from 'react'
import type maplibregl from 'maplibre-gl'
import type { GroundTrackSegment, SatellitePosition } from '../../../types/satellite.ts'
import type { RawTrackPoint } from '../../orbit/worker/types.ts'
import { useAntimeridianSplit } from '../hooks/useAntimeridianSplit.ts'

const TRACK_COLOR = '#7dd3fc'

interface Props {
  map: maplibregl.Map
  noradId: number
  points: RawTrackPoint[]
  currentPosition?: SatellitePosition
  highlighted?: boolean
}

function buildGeojson(segments: GroundTrackSegment[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: segments.map((seg) => ({
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: seg.coordinates },
    })),
  }
}

export function GroundTrackLayer({
  map,
  noradId,
  points,
  currentPosition,
  highlighted = false,
}: Props) {
  const sourceId = `track-source-${noradId}`
  const layerId = `track-layer-${noradId}`

  // Append the live position as the final point so the track always terminates
  // at the marker rather than lagging by up to MIN_TRACK_INTERVAL_MS (25 s).
  const effectivePoints = useMemo(() => {
    if (!currentPosition) return points
    return [
      ...points,
      {
        lon: currentPosition.longitude,
        lat: currentPosition.latitude,
        timestamp: currentPosition.timestamp,
      },
    ]
  }, [points, currentPosition])

  // unwrapTrack always returns a single continuous segment, so line-gradient
  // runs once across the full 90-minute track with no per-feature restarts.
  const segments = useAntimeridianSplit(effectivePoints)

  // Create source + layer once
  useEffect(() => {
    map.addSource(sourceId, { type: 'geojson', data: buildGeojson([]), lineMetrics: true })

    map.addLayer({
      id: layerId,
      type: 'line',
      source: sourceId,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-width': 1.5,
        // Fades the oldest 20 % of the track to transparent; holds opaque to
        // the current position. Works correctly because unwrapTrack produces
        // a single LineString so line-progress spans the whole track.
        'line-gradient': [
          'interpolate',
          ['linear'],
          ['line-progress'],
          0,
          'rgba(125, 211, 252, 0)',
          0.2,
          TRACK_COLOR,
          1,
          TRACK_COLOR,
        ],
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
