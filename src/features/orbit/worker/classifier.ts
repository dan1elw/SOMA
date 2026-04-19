import type { OrbitClass } from '../../../types/index.ts'

export function classifyOrbit(meanMotion: number): OrbitClass {
  if (meanMotion > 11.25) return 'LEO'
  if (meanMotion >= 0.95 && meanMotion <= 1.05) return 'GEO'
  if (meanMotion >= 1.8 && meanMotion <= 2.5) return 'MEO'
  if (meanMotion < 11.25) return 'HEO'
  return 'UNKNOWN'
}
