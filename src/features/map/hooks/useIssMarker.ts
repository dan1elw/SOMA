import { useEffect } from 'react'
import maplibregl from 'maplibre-gl'

// Hardcoded ISS position — Phase 2 sanity check only.
// Real propagation replaces this in Phase 3+.
const ISS_HARDCODED: [number, number] = [-87.6298, 41.8781]

function createMarkerElement(): HTMLDivElement {
  const el = document.createElement('div')
  el.style.cssText = [
    'width:12px',
    'height:12px',
    'border-radius:50%',
    'background:#e8c547',
    'border:2px solid #fff',
    'box-shadow:0 0 8px 2px rgba(232,197,71,0.6)',
    'cursor:pointer',
  ].join(';')
  el.setAttribute('aria-label', 'ISS (hardcoded)')
  return el
}

export function useIssMarker(mapRef: React.RefObject<maplibregl.Map | null>): void {
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    let marker: maplibregl.Marker | null = null

    function addMarker() {
      marker = new maplibregl.Marker({ element: createMarkerElement() })
        .setLngLat(ISS_HARDCODED)
        .setPopup(new maplibregl.Popup().setText('ISS (hardcoded — Phase 2)'))
        .addTo(map!)
    }

    if (map.loaded()) {
      addMarker()
    } else {
      map.once('load', addMarker)
    }

    return () => {
      marker?.remove()
    }
  }, [mapRef])
}
