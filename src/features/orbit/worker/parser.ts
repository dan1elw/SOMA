import { json2satrec } from 'satellite.js'
import type { SatRec } from 'satellite.js'
import type { OMM } from '../../../types/omm.ts'

/**
 * satellite.js expects string|number fields; our OMM uses number — cast is safe.
 */
export function ommToSatrec(omm: OMM): SatRec {
  return json2satrec(omm as Parameters<typeof json2satrec>[0])
}
