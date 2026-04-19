import type { OMM } from '../../../types/omm.ts'
import type { SatellitePosition } from '../../../types/satellite.ts'

export interface RawTrackPoint {
  lon: number
  lat: number
  timestamp: number
}

// ── Inbound messages ─────────────────────────────────────────────────────────

export interface AddSatMessage {
  type: 'ADD_SAT'
  payload: { omm: OMM }
}

export interface RemoveSatMessage {
  type: 'REMOVE_SAT'
  payload: { noradId: number }
}

// Kept for backward-compat with existing unit tests
export interface PropagateRequest {
  type: 'PROPAGATE'
  payload: { omm: OMM; timestamp: number }
}

export type WorkerInMessage = AddSatMessage | RemoveSatMessage | PropagateRequest

// ── Outbound messages ────────────────────────────────────────────────────────

export interface PositionBatchMessage {
  type: 'POSITION_BATCH'
  payload: {
    positions: SatellitePosition[]
    timestamp: number
  }
}

export interface InitialTrackMessage {
  type: 'INITIAL_TRACK'
  payload: {
    noradId: number
    points: RawTrackPoint[]
  }
}

export interface PropagateResponse {
  type: 'POSITION'
  payload: SatellitePosition | null
}

export type WorkerOutMessage = PositionBatchMessage | InitialTrackMessage | PropagateResponse
