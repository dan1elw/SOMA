export function formatLatLon(deg: number, axis: 'lat' | 'lon'): string {
  const abs = Math.abs(deg).toFixed(4)
  const dir = axis === 'lat' ? (deg >= 0 ? 'N' : 'S') : deg >= 0 ? 'E' : 'W'
  return `${abs}° ${dir}`
}

export function formatAltitude(km: number): string {
  return `${Math.round(km).toLocaleString('en-US')} km`
}

export function formatVelocity(kms: number): string {
  return `${kms.toFixed(2)} km/s`
}

export function formatUtcTimestamp(timestamp: number): string {
  return new Date(timestamp).toISOString().replace('T', ' ').slice(0, 19) + ' UTC'
}

export function formatDegrees(deg: number): string {
  return `${deg.toFixed(4)}°`
}
