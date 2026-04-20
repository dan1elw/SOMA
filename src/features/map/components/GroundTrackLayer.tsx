import { useEffect, useMemo } from 'react'
import type maplibregl from 'maplibre-gl'
import type { GroundTrackSegment, SatellitePosition } from '../../../types/satellite.ts'
import type { RawTrackPoint } from '../../orbit/worker/types.ts'
import { useAntimeridianSplit } from '../hooks/useAntimeridianSplit.ts'

const TRACK_COLOR = '#7dd3fc'

interface Props {
  map: maplibregl.Map
  noradId: number
  satelliteName: string
  points: RawTrackPoint[]
  currentPosition?: SatellitePosition
  highlighted?: boolean
  onSelect: () => void
}

function buildGeojson(
  segments: GroundTrackSegment[],
  dotCoord: [number, number] | null,
  name: string,
): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = segments.map((seg) => ({
    type: 'Feature',
    properties: {},
    geometry: { type: 'LineString', coordinates: seg.coordinates },
  }))

  if (dotCoord !== null) {
    features.push({
      type: 'Feature',
      properties: { name },
      geometry: { type: 'Point', coordinates: dotCoord },
    })
  }

  return { type: 'FeatureCollection', features }
}

export function GroundTrackLayer({
  map,
  noradId,
  satelliteName,
  points,
  currentPosition,
  highlighted = false,
  onSelect,
}: Props) {
  const sourceId = `track-source-${noradId}`
  const layerId = `track-layer-${noradId}`
  const circleLayerId = `track-dot-${noradId}`
  const labelLayerId = `track-label-${noradId}`

  // Append the live position so the track terminates exactly at the marker.
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

  // unwrapTrack returns a single continuous segment; line-gradient spans
  // the full 90-minute track without restarting per feature.
  const segments = useAntimeridianSplit(effectivePoints)

  // Dot coordinate = last unwrapped track point — same value the line ends at,
  // so circle and track tip are always pixel-perfect aligned regardless of
  // antimeridian unwrapping.
  const dotCoord = useMemo((): [number, number] | null => {
    const seg = segments[0]
    if (!seg) return null
    const last = seg.coordinates[seg.coordinates.length - 1]
    return last ?? null
  }, [segments])

  // Create source + layers once
  useEffect(() => {
    map.addSource(sourceId, {
      type: 'geojson',
      data: buildGeojson([], null, ''),
      lineMetrics: true,
    })

    map.addLayer({
      id: layerId,
      type: 'line',
      source: sourceId,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-width': 1.5,
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

    map.addLayer({
      id: circleLayerId,
      type: 'circle',
      source: sourceId,
      filter: ['==', ['geometry-type'], 'Point'],
      paint: {
        'circle-radius': 5,
        'circle-color': TRACK_COLOR,
        'circle-stroke-width': 1.5,
        'circle-stroke-color': 'rgba(255,255,255,0.8)',
        'circle-pitch-alignment': 'viewport',
      },
    })

    map.addLayer({
      id: labelLayerId,
      type: 'symbol',
      source: sourceId,
      filter: ['==', ['geometry-type'], 'Point'],
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Noto Sans Regular'],
        'text-size': 11,
        'text-anchor': 'left',
        'text-offset': [1.2, 0],
        'text-allow-overlap': true,
        'text-ignore-placement': true,
      },
      paint: {
        'text-color': '#e6e9ef',
        'text-halo-color': 'rgba(0,0,0,0.9)',
        'text-halo-width': 1,
      },
    })

    const handleClick = () => onSelect()
    const setCursor = () => {
      map.getCanvas().style.cursor = 'pointer'
    }
    const clearCursor = () => {
      map.getCanvas().style.cursor = ''
    }

    map.on('click', circleLayerId, handleClick)
    map.on('mouseenter', circleLayerId, setCursor)
    map.on('mouseleave', circleLayerId, clearCursor)

    return () => {
      map.off('click', circleLayerId, handleClick)
      map.off('mouseenter', circleLayerId, setCursor)
      map.off('mouseleave', circleLayerId, clearCursor)
      if (map.getLayer(labelLayerId)) map.removeLayer(labelLayerId)
      if (map.getLayer(circleLayerId)) map.removeLayer(circleLayerId)
      if (map.getLayer(layerId)) map.removeLayer(layerId)
      if (map.getSource(sourceId)) map.removeSource(sourceId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, noradId])

  // Update line-width on highlight change
  useEffect(() => {
    if (map.getLayer(layerId)) {
      map.setPaintProperty(layerId, 'line-width', highlighted ? 3 : 1.5)
    }
  }, [map, layerId, highlighted])

  // Push updated data into the source
  useEffect(() => {
    const source = map.getSource(sourceId) as maplibregl.GeoJSONSource | undefined
    source?.setData(buildGeojson(segments, dotCoord, satelliteName))
  }, [map, sourceId, segments, dotCoord, satelliteName])

  return null
}
