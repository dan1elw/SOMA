import type { WorkerInMessage, WorkerOutMessage, RawTrackPoint } from './types.ts'
import { ommToSatrec } from './parser.ts'
import { propagatePosition } from './propagator.ts'
import { classifyOrbit } from './classifier.ts'
import { generatePastTrack } from './trackGenerator.ts'
import type { SatRec } from 'satellite.js'
import type { OrbitClass } from '../../../types/index.ts'

const TRACK_DURATION_MS = 90 * 60 * 1000
// Subsample track appends to 30 s intervals, matching INITIAL_TRACK resolution
const TRACK_APPEND_INTERVAL_MS = 30_000

interface SatEntry {
  noradId: number
  satrec: SatRec
  orbitClass: OrbitClass
  track: RawTrackPoint[]
  lastTrackAppendMs: number
}

const sats = new Map<number, SatEntry>()
let tickInterval: ReturnType<typeof setInterval> | null = null

function startTick(): void {
  if (tickInterval !== null) return
  tickInterval = setInterval(tick, 1000)
}

function tick(): void {
  if (sats.size === 0) return

  const now = new Date()
  const nowMs = now.getTime()
  const cutoff = nowMs - TRACK_DURATION_MS
  const positions = []

  for (const entry of sats.values()) {
    const pos = propagatePosition(entry.satrec, now, entry.noradId)
    if (pos === null) continue

    positions.push(pos)

    if (entry.orbitClass !== 'GEO') {
      if (nowMs - entry.lastTrackAppendMs >= TRACK_APPEND_INTERVAL_MS) {
        entry.track.push({ lon: pos.longitude, lat: pos.latitude, timestamp: nowMs })
        entry.lastTrackAppendMs = nowMs
        // Trim points older than 90 min
        const cutoffIdx = entry.track.findIndex((p) => p.timestamp >= cutoff)
        if (cutoffIdx > 0) entry.track.splice(0, cutoffIdx)
      }
    }
  }

  const batch: WorkerOutMessage = {
    type: 'POSITION_BATCH',
    payload: { positions, timestamp: nowMs },
  }
  self.postMessage(batch)
}

self.onmessage = (event: MessageEvent<WorkerInMessage>) => {
  const msg = event.data

  if (msg.type === 'ADD_SAT') {
    const { omm } = msg.payload
    const noradId = omm.NORAD_CAT_ID
    if (sats.has(noradId)) return

    const satrec = ommToSatrec(omm)
    const orbitClass = classifyOrbit(omm.MEAN_MOTION)
    const now = new Date()
    const track = orbitClass !== 'GEO' ? generatePastTrack(satrec, noradId, now) : []

    sats.set(noradId, { noradId, satrec, orbitClass, track, lastTrackAppendMs: now.getTime() })

    const trackMsg: WorkerOutMessage = {
      type: 'INITIAL_TRACK',
      payload: { noradId, points: track },
    }
    self.postMessage(trackMsg)
    startTick()
    return
  }

  if (msg.type === 'REMOVE_SAT') {
    sats.delete(msg.payload.noradId)
    return
  }

  // Legacy one-shot propagation (unit tests)
  if (msg.type === 'PROPAGATE') {
    const { omm, timestamp } = msg.payload
    const satrec = ommToSatrec(omm)
    const position = propagatePosition(satrec, new Date(timestamp), omm.NORAD_CAT_ID)
    const response: WorkerOutMessage = { type: 'POSITION', payload: position }
    self.postMessage(response)
  }
}
