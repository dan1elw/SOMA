import { Fragment, useRef } from 'react'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useMap } from '../hooks/useMap'
import { SatelliteMarker } from './SatelliteMarker'
import { GroundTrackLayer } from './GroundTrackLayer'
import { useActiveSatellitesStore } from '../../../store/activeSatellitesStore'
import { usePositionsStore } from '../../../store/positionsStore'
import { useUIStore } from '../../../store/uiStore'

export function MapView() {
  const containerRef = useRef<HTMLDivElement>(null)
  const map = useMap(containerRef)
  const satellites = useActiveSatellitesStore((s) => s.satellites)
  const positions = usePositionsStore((s) => s.positions)
  const tracks = usePositionsStore((s) => s.tracks)
  const selectedNoradId = useUIStore((s) => s.selectedNoradId)

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100vh' }}>
      {map &&
        satellites.map((sat) => (
          <Fragment key={sat.noradId}>
            {sat.orbitClass === 'GEO' ? (
              // GEO: stationary DOM marker — no antimeridian concern
              <SatelliteMarker map={map} satellite={sat} position={positions[sat.noradId]} />
            ) : (
              // Non-GEO: dot lives inside GroundTrackLayer so its coordinate
              // always matches the unwrapped track endpoint exactly
              <GroundTrackLayer
                map={map}
                noradId={sat.noradId}
                satelliteName={sat.name}
                points={tracks[sat.noradId] ?? []}
                currentPosition={positions[sat.noradId]}
                highlighted={sat.noradId === selectedNoradId}
                onSelect={() => useUIStore.getState().setSelected(sat.noradId)}
              />
            )}
          </Fragment>
        ))}
    </div>
  )
}
