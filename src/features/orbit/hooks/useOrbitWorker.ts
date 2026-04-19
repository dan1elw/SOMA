import { useCallback, useEffect, useRef } from 'react'
import type { OMM } from '../../../types/omm.ts'
import type { WorkerOutMessage } from '../worker/types.ts'
import { classifyOrbit } from '../worker/classifier.ts'
import { useActiveSatellitesStore } from '../../../store/activeSatellitesStore.ts'
import { usePositionsStore } from '../../../store/positionsStore.ts'

export interface OrbitWorkerControls {
  addSat: (omm: OMM) => void
  removeSat: (noradId: number) => void
}

export function useOrbitWorker(): OrbitWorkerControls {
  const workerRef = useRef<Worker | null>(null)

  const setPositions = usePositionsStore((s) => s.setPositions)
  const setTrack = usePositionsStore((s) => s.setTrack)
  const appendTrackPoint = usePositionsStore((s) => s.appendTrackPoint)
  const addActiveSat = useActiveSatellitesStore((s) => s.add)
  const removeActiveSat = useActiveSatellitesStore((s) => s.remove)
  const removePosition = usePositionsStore((s) => s.remove)

  useEffect(() => {
    const worker = new Worker(new URL('../worker/index.ts', import.meta.url), { type: 'module' })
    workerRef.current = worker

    worker.onmessage = (event: MessageEvent<WorkerOutMessage>) => {
      const msg = event.data

      if (msg.type === 'POSITION_BATCH') {
        setPositions(msg.payload.positions)
        const activeSats = useActiveSatellitesStore.getState().satellites
        for (const pos of msg.payload.positions) {
          const sat = activeSats.find((s) => s.noradId === pos.noradId)
          if (sat && sat.orbitClass !== 'GEO') {
            appendTrackPoint(pos.noradId, {
              lon: pos.longitude,
              lat: pos.latitude,
              timestamp: pos.timestamp,
            })
          }
        }
      } else if (msg.type === 'INITIAL_TRACK') {
        setTrack(msg.payload.noradId, msg.payload.points)
      }
    }

    return () => {
      worker.terminate()
      workerRef.current = null
    }
  }, [setPositions, setTrack, appendTrackPoint])

  const addSat = useCallback(
    (omm: OMM) => {
      const orbitClass = classifyOrbit(omm.MEAN_MOTION)
      addActiveSat({
        noradId: omm.NORAD_CAT_ID,
        name: omm.OBJECT_NAME,
        omm,
        orbitClass,
        addedAt: Date.now(),
        ommFetchedAt: Date.now(),
      })
      workerRef.current?.postMessage({ type: 'ADD_SAT', payload: { omm } })
    },
    [addActiveSat],
  )

  const removeSat = useCallback(
    (noradId: number) => {
      removeActiveSat(noradId)
      removePosition(noradId)
      workerRef.current?.postMessage({ type: 'REMOVE_SAT', payload: { noradId } })
    },
    [removeActiveSat, removePosition],
  )

  return { addSat, removeSat }
}
