import { useEffect, useMemo } from 'react'
import type maplibregl from 'maplibre-gl'
import type { GroundTrackSegment, SatellitePosition } from '../../../types/satellite.ts'
import type { RawTrackPoint } from '../../orbit/worker/types.ts'
import { useAntimeridianSplit } from '../hooks/useAntimeridianSplit.ts'

const SELECTED_COLOR = '#7dd3fc'
const UNSELECTED_COLOR = '#94a3b8'

interface Props {
  map: maplibregl.Map
  noradId: number
  satelliteName: string
  points: RawTrackPoint[]
  currentPosition?: SatellitePosition | undefined
  highlighted?: boolean
  onSelect: () => void
}

function buildTrackGeojson(segments: GroundTrackSegment[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: segments.map((seg) => ({
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: seg.coordinates },
    })),
  }
}

function buildDotGeojson(coord: [number, number] | null, name: string): GeoJSON.FeatureCollection {
  if (coord === null) return { type: 'FeatureCollection', features: [] }
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { name },
        geometry: { type: 'Point', coordinates: coord },
      },
    ],
  }
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
  const trackSourceId = `track-source-${noradId}`
  const dotSourceId = `dot-source-${noradId}`
  const layerId = `track-layer-${noradId}`
  const circleLayerId = `track-dot-${noradId}`
  const labelLayerId = `track-label-${noradId}`

  // Append the live position so the track terminates exactly at the dot.
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
  // so the circle is always pixel-perfect aligned with the track tip.
  const dotCoord = useMemo((): [number, number] | null => {
    const seg = segments[0]
    if (!seg) return null
    const last = seg.coordinates[seg.coordinates.length - 1]
    return last ?? null
  }, [segments])

  // Create sources + layers once
  useEffect(() => {
    // Track source needs lineMetrics for line-gradient; keep it LineString-only.
    map.addSource(trackSourceId, {
      type: 'geojson',
      data: buildTrackGeojson([]),
      lineMetrics: true,
    })
    // Dot source is a plain Point source — no lineMetrics so the circle layer
    // receives the feature correctly regardless of MapLibre version.
    map.addSource(dotSourceId, {
      type: 'geojson',
      data: buildDotGeojson(null, ''),
    })

    map.addLayer({
      id: layerId,
      type: 'line',
      source: trackSourceId,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-width': 1.5,
        'line-gradient': [
          'interpolate',
          ['linear'],
          ['line-progress'],
          0,
          'rgba(148, 163, 184, 0)',
          0.2,
          UNSELECTED_COLOR,
          1,
          UNSELECTED_COLOR,
        ],
      },
    })

    map.addLayer({
      id: circleLayerId,
      type: 'circle',
      source: dotSourceId,
      paint: {
        'circle-radius': 5,
        'circle-color': UNSELECTED_COLOR,
        'circle-stroke-width': 1.5,
        'circle-stroke-color': 'rgba(255,255,255,0.8)',
        'circle-pitch-alignment': 'viewport',
      },
    })

    map.addLayer({
      id: labelLayerId,
      type: 'symbol',
      source: dotSourceId,
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
      if (map.getSource(dotSourceId)) map.removeSource(dotSourceId)
      if (map.getSource(trackSourceId)) map.removeSource(trackSourceId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, noradId])

  // Update line-width, color, and z-order on highlight change
  useEffect(() => {
    const color = highlighted ? SELECTED_COLOR : UNSELECTED_COLOR
    const fadeRgba = highlighted ? 'rgba(125, 211, 252, 0)' : 'rgba(148, 163, 184, 0)'
    if (map.getLayer(layerId)) {
      map.setPaintProperty(layerId, 'line-width', highlighted ? 3 : 1.5)
      map.setPaintProperty(layerId, 'line-gradient', [
        'interpolate',
        ['linear'],
        ['line-progress'],
        0,
        fadeRgba,
        0.2,
        color,
        1,
        color,
      ])
      if (highlighted) map.moveLayer(layerId)
    }
    if (map.getLayer(circleLayerId)) {
      map.setPaintProperty(circleLayerId, 'circle-color', color)
      if (highlighted) map.moveLayer(circleLayerId)
    }
    if (highlighted && map.getLayer(labelLayerId)) {
      map.moveLayer(labelLayerId)
    }
  }, [map, layerId, circleLayerId, labelLayerId, highlighted])

  // Push updated track data
  useEffect(() => {
    const source = map.getSource(trackSourceId) as maplibregl.GeoJSONSource | undefined
    source?.setData(buildTrackGeojson(segments))
  }, [map, trackSourceId, segments])

  // Push updated dot data
  useEffect(() => {
    const source = map.getSource(dotSourceId) as maplibregl.GeoJSONSource | undefined
    source?.setData(buildDotGeojson(dotCoord, satelliteName))
  }, [map, dotSourceId, dotCoord, satelliteName])

  return null
}
