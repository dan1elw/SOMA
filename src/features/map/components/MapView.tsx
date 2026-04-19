import { Fragment, useRef } from 'react'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useMap } from '../hooks/useMap'
import { SatelliteMarker } from './SatelliteMarker'
import { GroundTrackLayer } from './GroundTrackLayer'
import { useActiveSatellitesStore } from '../../../store/activeSatellitesStore'
import { usePositionsStore } from '../../../store/positionsStore'

export function MapView() {
  const containerRef = useRef<HTMLDivElement>(null)
  const map = useMap(containerRef)
  const satellites = useActiveSatellitesStore((s) => s.satellites)
  const positions = usePositionsStore((s) => s.positions)
  const tracks = usePositionsStore((s) => s.tracks)

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100vh' }}>
      {map &&
        satellites.map((sat) => (
          <Fragment key={sat.noradId}>
            <SatelliteMarker map={map} satellite={sat} position={positions[sat.noradId]} />
            {sat.orbitClass !== 'GEO' && (
              <GroundTrackLayer
                map={map}
                noradId={sat.noradId}
                points={tracks[sat.noradId] ?? []}
              />
            )}
          </Fragment>
        ))}
    </div>
  )
}
