export type QueryType = 'norad-id' | 'name'

/** Returns 'norad-id' if the trimmed query is all digits, else 'name'. */
export function detectQueryType(query: string): QueryType {
  return /^\d+$/.test(query.trim()) ? 'norad-id' : 'name'
}
