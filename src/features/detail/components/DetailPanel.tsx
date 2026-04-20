import { useActiveSatellitesStore } from '../../../store/activeSatellitesStore'
import { usePositionsStore } from '../../../store/positionsStore'
import { useUIStore } from '../../../store/uiStore'
import {
  formatLatLon,
  formatAltitude,
  formatVelocity,
  formatUtcTimestamp,
  formatDegrees,
} from '../utils/formatters'
import type { OMM } from '../../../types/omm'

interface Props {
  onRemoveSat: (noradId: number) => void
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <span className="text-white/40">{label}</span>
      <span className="text-right tabular-nums">{value}</span>
    </>
  )
}

function OmmSection({ omm }: { omm: OMM }) {
  return (
    <div className="px-4 py-3">
      <div className="text-[10px] text-white/30 uppercase tracking-wider mb-2">
        Orbital Elements
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <DataRow label="Epoch" value={omm.EPOCH.slice(0, 10)} />
        <DataRow label="Inc" value={formatDegrees(omm.INCLINATION)} />
        <DataRow label="Ecc" value={omm.ECCENTRICITY.toExponential(3)} />
        <DataRow label="Motion" value={`${omm.MEAN_MOTION.toFixed(4)} rev/d`} />
      </div>
    </div>
  )
}

export function DetailPanel({ onRemoveSat }: Props) {
  const selectedNoradId = useUIStore((s) => s.selectedNoradId)
  const setSelected = useUIStore((s) => s.setSelected)
  const satellites = useActiveSatellitesStore((s) => s.satellites)
  const positions = usePositionsStore((s) => s.positions)

  if (selectedNoradId === null) return null

  const sat = satellites.find((s) => s.noradId === selectedNoradId)
  if (!sat) return null

  const pos = positions[selectedNoradId]

  return (
    <div className="soma-panel-enter absolute top-4 right-4 z-10 w-72 bg-[#0a0e14]/90 border border-white/10 rounded-md backdrop-blur-sm text-sm text-[#e6e9ef] overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 px-4 pt-3 pb-2 border-b border-white/10">
        <div className="min-w-0">
          <div className="font-medium truncate">{sat.name}</div>
          <div className="text-xs text-white/40 mt-0.5">
            NORAD {sat.noradId} · {sat.orbitClass}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0 mt-0.5">
          <button
            onClick={() => {
              onRemoveSat(sat.noradId)
              setSelected(null)
            }}
            aria-label={`Remove ${sat.name} from map`}
            className="text-[10px] text-white/30 hover:text-red-400 transition-colors px-1.5 py-0.5 rounded border border-white/10 hover:border-red-400/30"
          >
            Remove
          </button>
          <button
            onClick={() => setSelected(null)}
            aria-label="Close detail panel"
            className="text-white/30 hover:text-white transition-colors w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 text-xs"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>
      </div>

      {/* Live position */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Live Position</div>
        {pos !== undefined ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <DataRow label="Lat" value={formatLatLon(pos.latitude, 'lat')} />
            <DataRow label="Lon" value={formatLatLon(pos.longitude, 'lon')} />
            <DataRow label="Alt" value={formatAltitude(pos.altitude)} />
            <DataRow label="Speed" value={formatVelocity(pos.velocity)} />
            <div className="col-span-2 text-[10px] text-white/25 mt-1">
              {formatUtcTimestamp(pos.timestamp)}
            </div>
          </div>
        ) : (
          <div className="text-xs text-white/30">Acquiring position…</div>
        )}
      </div>

      <OmmSection omm={sat.omm} />
    </div>
  )
}
