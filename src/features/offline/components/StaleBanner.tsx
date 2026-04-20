import { useCatalog } from '../../catalog/hooks/useCatalog'
import { isStale } from '../../../storage/db'

export function StaleBanner() {
  const { data, isFetching, isError } = useCatalog()

  const stale = data ? isStale(data.cachedAt) : false
  const showRefreshing = isFetching && stale
  const showError = isError && stale

  if (!showRefreshing && !showError) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="soma-banner-enter absolute top-2 left-1/2 -translate-x-1/2 z-10 rounded-md px-3 py-1.5 text-xs font-medium bg-yellow-900/80 text-yellow-200 backdrop-blur-sm"
    >
      {showError ? 'Satellite data is stale — refresh failed' : 'Refreshing satellite catalog…'}
    </div>
  )
}
