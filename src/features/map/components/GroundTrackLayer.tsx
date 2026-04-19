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

export function GroundTrackLayer({ map, noradId, points, highlighted = false }: Props) {
  const sourceId = `track-source-${noradId}`
  const layerId = `track-layer-${noradId}`
  const segments = useAntimeridianSplit(points)

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
        // Fade oldest 20 % of each segment to transparent, hold opaque to current pos
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
