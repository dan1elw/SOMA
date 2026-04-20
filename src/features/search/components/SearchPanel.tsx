import { useState, useRef, useCallback, useId } from 'react'
import { useSatelliteSearch } from '../hooks/useSatelliteSearch'
import { getCatalogEntry } from '../../catalog/api/celestrakApi'
import { useUIStore } from '../../../store/uiStore'
import type { CatalogEntry } from '../../../types/satellite'
import type { OMM } from '../../../types/omm'

interface Props {
  onAddSat: (omm: OMM) => void
}

export function SearchPanel({ onAddSat }: Props) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listId = useId()

  const results = useSatelliteSearch(query)
  const setSelected = useUIStore((s) => s.setSelected)

  const selectEntry = useCallback(
    async (entry: CatalogEntry) => {
      setLoading(true)
      setError(null)
      try {
        const omm = await getCatalogEntry(entry.noradId)
        onAddSat(omm)
        setSelected(entry.noradId)
        setQuery('')
        setIsOpen(false)
        setActiveIndex(-1)
      } catch {
        setError('Failed to load satellite data')
      } finally {
        setLoading(false)
      }
    },
    [onAddSat, setSelected],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen || results.length === 0) return
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, results.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter' && activeIndex >= 0) {
        e.preventDefault()
        const entry = results[activeIndex]
        if (entry) void selectEntry(entry)
      } else if (e.key === 'Escape') {
        setIsOpen(false)
        setActiveIndex(-1)
        inputRef.current?.blur()
      }
    },
    [isOpen, results, activeIndex, selectEntry],
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    setIsOpen(true)
    setActiveIndex(-1)
    setError(null)
  }

  const handleBlur = () => {
    setTimeout(() => setIsOpen(false), 150)
  }

  return (
    <div className="absolute top-4 left-4 z-10 w-72">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="Search satellites…"
          aria-label="Search satellites by name or NORAD ID"
          aria-autocomplete="list"
          aria-controls={isOpen && results.length > 0 ? listId : undefined}
          aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
          disabled={loading}
          className="w-full bg-[#0a0e14]/90 border border-white/10 rounded-md px-3 py-2 text-sm text-[#e6e9ef] placeholder-white/30 focus:outline-none focus:border-[#7dd3fc]/50 backdrop-blur-sm disabled:opacity-50"
        />
        {loading && <span className="absolute right-3 top-2 text-[#7dd3fc] text-xs">loading…</span>}
      </div>

      {error !== null && <p className="mt-1 text-xs text-red-400 pl-1">{error}</p>}

      {isOpen && results.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Satellite search results"
          className="mt-1 bg-[#0d1117]/95 border border-white/10 rounded-md overflow-hidden backdrop-blur-sm"
        >
          {results.map((entry, i) => (
            <li
              key={entry.noradId}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={() => void selectEntry(entry)}
              className={`px-3 py-2 cursor-pointer text-sm flex justify-between items-center gap-2 ${
                i === activeIndex
                  ? 'bg-[#7dd3fc]/10 text-[#7dd3fc]'
                  : 'text-[#e6e9ef] hover:bg-white/5'
              }`}
            >
              <span className="truncate">{entry.name}</span>
              <span className="text-xs text-white/30 shrink-0">{entry.noradId}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
