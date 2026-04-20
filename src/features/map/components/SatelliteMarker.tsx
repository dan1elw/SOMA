import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import type { ActiveSatellite, SatellitePosition } from '../../../types/satellite.ts'
import { useUIStore } from '../../../store/uiStore.ts'

interface Props {
  map: maplibregl.Map
  satellite: ActiveSatellite
  position: SatellitePosition | undefined
}

function createMarkerEl(name: string): HTMLDivElement {
  // The dot IS the marker element so MapLibre's center-anchor stays on the
  // satellite coordinate. The label hangs to the right via absolute positioning.
  const dot = document.createElement('div')
  dot.style.cssText = [
    'position:relative',
    'width:10px',
    'height:10px',
    'border-radius:50%',
    'background:#7dd3fc',
    'border:1.5px solid rgba(255,255,255,0.8)',
    'box-shadow:0 0 6px 2px rgba(125,211,252,0.55)',
    'cursor:pointer',
  ].join(';')
  dot.setAttribute('aria-label', name)

  const label = document.createElement('span')
  label.textContent = name
  label.style.cssText = [
    'position:absolute',
    'left:14px',
    'top:50%',
    'transform:translateY(-50%)',
    'font-size:11px',
    'font-family:system-ui,sans-serif',
    'color:#e6e9ef',
    'text-shadow:0 1px 3px rgba(0,0,0,0.9)',
    'white-space:nowrap',
    'pointer-events:none',
    'user-select:none',
  ].join(';')

  dot.appendChild(label)
  return dot
}

export function SatelliteMarker({ map, satellite, position }: Props) {
  const markerRef = useRef<maplibregl.Marker | null>(null)
  const setSelected = useUIStore((s) => s.setSelected)

  // Create the marker hidden; shown once the first position arrives.
  useEffect(() => {
    const el = createMarkerEl(satellite.name)
    el.style.visibility = 'hidden'
    el.style.cursor = 'pointer'
    el.addEventListener('click', () => setSelected(satellite.noradId))
    const marker = new maplibregl.Marker({ element: el }).setLngLat([0, 0]).addTo(map)
    markerRef.current = marker

    return () => {
      marker.remove()
      markerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, satellite.noradId])

  // Update position on every tick
  useEffect(() => {
    if (position && markerRef.current) {
      markerRef.current.setLngLat([position.longitude, position.latitude])
      markerRef.current.getElement().style.visibility = 'visible'
    }
  }, [position])

  return null
}
