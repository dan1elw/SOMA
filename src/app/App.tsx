import { useEffect } from 'react'
import { MapView } from '../features/map/components/MapView'
import { useOrbitWorker } from '../features/orbit/hooks/useOrbitWorker'
import type { OMM } from '../types/omm'

const ISS_URL = 'https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=json'

function App() {
  const { addSat } = useOrbitWorker()

  useEffect(() => {
    fetch(ISS_URL)
      .then((r) => r.json())
      .then((data: OMM[]) => {
        if (data[0]) addSat(data[0])
      })
      .catch((err: unknown) => console.error('[SOMA] Failed to fetch ISS OMM:', err))
  }, [addSat])

  return <MapView />
}

export default App
