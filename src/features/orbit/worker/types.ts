import type { OMM } from '../../../types/omm.ts'
import type { SatellitePosition } from '../../../types/satellite.ts'

export interface PropagateRequest {
  type: 'PROPAGATE'
  payload: { omm: OMM; timestamp: number }
}

export type WorkerInMessage = PropagateRequest

export interface PropagateResponse {
  type: 'POSITION'
  payload: SatellitePosition | null
}

export type WorkerOutMessage = PropagateResponse
