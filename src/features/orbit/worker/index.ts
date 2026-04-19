import type { WorkerInMessage, WorkerOutMessage } from './types.ts'
import { ommToSatrec } from './parser.ts'
import { propagatePosition } from './propagator.ts'

self.onmessage = (event: MessageEvent<WorkerInMessage>) => {
  const msg = event.data

  if (msg.type === 'PROPAGATE') {
    const { omm, timestamp } = msg.payload
    const satrec = ommToSatrec(omm)
    const position = propagatePosition(satrec, new Date(timestamp), omm.NORAD_CAT_ID)
    const response: WorkerOutMessage = { type: 'POSITION', payload: position }
    self.postMessage(response)
  }
}
