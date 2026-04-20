/**
 * Returns a match score for query against candidate.
 * Tiers: exact (1.0) > starts-with (0.8) > contains (0.6) > subsequence (0.3) > no match (0)
 */
export function fuzzyMatch(query: string, candidate: string): number {
  const q = query.toLowerCase()
  const c = candidate.toLowerCase()

  if (c === q) return 1.0
  if (c.startsWith(q)) return 0.8
  if (c.includes(q)) return 0.6

  let qi = 0
  for (let i = 0; i < c.length && qi < q.length; i++) {
    if (c[i] === q[qi]) qi++
  }
  return qi === q.length ? 0.3 : 0
}
