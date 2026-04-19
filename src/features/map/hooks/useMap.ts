import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'

const CARTO_DARK_MATTER = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

export function useMap(container: React.RefObject<HTMLDivElement | null>): maplibregl.Map | null {
  const instanceRef = useRef<maplibregl.Map | null>(null)
  const [map, setMap] = useState<maplibregl.Map | null>(null)

  useEffect(() => {
    if (!container.current || instanceRef.current) return

    let mounted = true

    const m = new maplibregl.Map({
      container: container.current,
      style: CARTO_DARK_MATTER,
      center: [0, 20],
      zoom: 1.5,
      minZoom: 1,
      attributionControl: { compact: true },
    })
    instanceRef.current = m

    const onLoad = () => {
      if (mounted) setMap(m)
    }

    if (m.loaded()) {
      onLoad()
    } else {
      m.once('load', onLoad)
    }

    return () => {
      mounted = false
      m.off('load', onLoad)
      m.remove()
      instanceRef.current = null
      setMap(null)
    }
  }, [container])

  return map
}
