import { useEffect } from 'react'
import { MapView } from '../features/map/components/MapView'
import { useOrbitWorker } from '../features/orbit/hooks/useOrbitWorker'
import { useSatelliteOMM } from '../features/catalog/hooks/useSatelliteOMM'
import { useCatalog } from '../features/catalog/hooks/useCatalog'
import { StaleBanner } from '../features/offline/components/StaleBanner'

const ISS_NORAD_ID = 25544

function App() {
  const { addSat } = useOrbitWorker()
  useCatalog()
  const { data: issOMM } = useSatelliteOMM(ISS_NORAD_ID)

  useEffect(() => {
    if (issOMM) addSat(issOMM)
  }, [issOMM, addSat])

  return (
    <div className="relative w-full h-full">
      <StaleBanner />
      <MapView />
    </div>
  )
}

export default App
