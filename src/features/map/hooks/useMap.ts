import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'

const CARTO_DARK_MATTER = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

export function useMap(
  container: React.RefObject<HTMLDivElement | null>,
): React.RefObject<maplibregl.Map | null> {
  const mapRef = useRef<maplibregl.Map | null>(null)

  useEffect(() => {
    if (!container.current || mapRef.current) return

    mapRef.current = new maplibregl.Map({
      container: container.current,
      style: CARTO_DARK_MATTER,
      center: [0, 20],
      zoom: 1.5,
      minZoom: 1,
      attributionControl: { compact: true },
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [container])

  return mapRef
}
