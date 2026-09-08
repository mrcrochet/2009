'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { searchWorld, type SearchHit } from '@/engine/world'
import { useWorldOptional } from './WorldContext'
import { useFocusTrap } from './useFocusTrap'

/**
 * One search across the whole machine.
 *
 * The counts are the point. Before the player opens anything they are told "People 3 · Mail 27 ·
 * Photos 4 · Web 31", which says the world is larger than the question they asked. A search that
 * answers with a quest marker is a menu; a search that answers with the shape of somebody's life
 * is a world.
 *
 * It is a Find window, not a command palette. Hard edges, the period greys, the same titlebar as
 * every other window — because a floating translucent card is 2020 and this machine is not.
 */

const SURFACE_LABEL: Readonly<Record<string, string>> = {
  people: 'People',
  mail: 'Mail',
  msg: 'Messages',
  phone: 'Phone',
  files: 'Files',
  bank: 'Bank',
  web: 'Web',
  archive: 'Archive',
  term: 'System',
}

/** Filter order, chosen so the surfaces a player thinks in come first. */
const SURFACES = ['people', 'mail', 'msg', 'phone', 'files', 'bank', 'web', 'archive', 'term']

const optionId = (hit: SearchHit) => `hal-search-opt-${hit.kind}-${hit.id}`

export interface SearchPaletteProps {
  readonly open: boolean
  readonly onClose: () => void
  /** The palette does not own the reducer; opening a hit is somebody else's decision. */
  readonly onOpenHit: (hit: SearchHit) => void
}

export function SearchPalette({ open, onClose, onOpenHit }: SearchPaletteProps) {
  const world = useWorldOptional()
  const panelRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [query, setQuery] = useState('')
  const [surface, setSurface] = useState<string>('all')
  const [discoveredOnly, setDiscoveredOnly] = useState(false)
  const [active, setActive] = useState(0)

  /*
   * Both resets below happen during render rather than in an effect. An effect would paint the
   * old cursor for one frame first — the player sees the previous row still highlighted under a
   * query they have already changed — and React re-runs this render before committing anything,
   * so the discarded pass is never seen.
   */
  const [wasOpen, setWasOpen] = useState(open)
  if (wasOpen !== open) {
    setWasOpen(open)
    // A search reopened is a new question. The discovered-only filter is a preference, so it stays.
    if (open) {
      setQuery('')
      setSurface('all')
    }
  }

  const cursorKey = `${query}\u0000${surface}\u0000${discoveredOnly}`
  const [lastCursorKey, setLastCursorKey] = useState(cursorKey)
  if (lastCursorKey !== cursorKey) {
    setLastCursorKey(cursorKey)
    setActive(0)
  }

  // Into the field, not onto the close button. Ctrl+K is one gesture and typing has to be the
  // next one.
  useFocusTrap(panelRef, open && world !== null, inputRef)

  const results = useMemo(() => {
    if (!world) return null
    return searchWorld(world.index, query, {
      // Counts are always for the whole query rather than the current filter: seeing "Web 31"
      // while reading the mail is what tells the player where else to look.
      discovered: discoveredOnly ? world.discovered : undefined,
      limit: 200,
    })
  }, [world, query, discoveredOnly])

  /**
   * An entity always matches by name, so in discovered-only mode one the player has never met
   * would still surface — and a name is the most spoiling thing this palette could leak. Filter
   * them to entities with at least one artifact already found.
   */
  const hits = useMemo(() => {
    if (!world || !results) return []
    return results.hits.filter((hit) => {
      if (surface !== 'all' && hit.surface !== surface) return false
      if (!discoveredOnly || hit.kind !== 'entity') return true
      const traces = world.index.artifactsByEntity.get(hit.id) ?? []
      return traces.some((a) => world.discovered.has(a.id))
    })
  }, [world, results, surface, discoveredOnly])

  // Keep the active row in view without moving focus off the input, which is what makes the
  // combobox pattern usable: arrows move the selection, typing still goes to the field.
  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const el = list.querySelector<HTMLElement>('[aria-selected="true"]')
    if (!el) return
    const bottom = el.offsetTop + el.offsetHeight
    if (el.offsetTop < list.scrollTop) list.scrollTop = el.offsetTop
    else if (bottom > list.scrollTop + list.clientHeight)
      list.scrollTop = bottom - list.clientHeight
  }, [active, hits])

  const openHit = useCallback(
    (hit: SearchHit) => {
      onOpenHit(hit)
      onClose()
    },
    [onOpenHit, onClose],
  )

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (hits.length === 0) return
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setActive((i) => (i + 1) % hits.length)
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        setActive((i) => (i - 1 + hits.length) % hits.length)
      } else if (event.key === 'Home') {
        event.preventDefault()
        setActive(0)
      } else if (event.key === 'End') {
        event.preventDefault()
        setActive(hits.length - 1)
      } else if (event.key === 'Enter') {
        const hit = hits[active]
        if (hit) {
          event.preventDefault()
          openHit(hit)
        }
      }
    },
    [hits, active, openHit, onClose],
  )

  if (!open || !world || !results) return null

  const activeHit = hits[active]

  return (
    <div className="hal-search">
      <div
        className="hal-search__panel"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Search HALCYON"
        tabIndex={-1}
        onKeyDown={onKeyDown}
      >
        <div className="hal-search__bar">
          <span className="hal-search__title">SEARCH HALCYON</span>
          <button
            type="button"
            className="hal-search__close"
            aria-label="Close search"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="hal-search__field">
          <label className="hal-search__label" htmlFor="hal-search-input">
            Find:
          </label>
          <input
            id="hal-search-input"
            ref={inputRef}
            className="hal-search__input"
            role="combobox"
            aria-expanded={hits.length > 0}
            aria-controls="hal-search-results"
            aria-activedescendant={activeHit ? optionId(activeHit) : undefined}
            aria-autocomplete="list"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <label className="hal-search__only">
            <input
              type="checkbox"
              checked={discoveredOnly}
              onChange={(e) => setDiscoveredOnly(e.target.checked)}
            />
            Only what I have found
          </label>
        </div>

        <div className="hal-search__cols">
          <div className="hal-search__filters" role="group" aria-label="Filter by source">
            <button
              type="button"
              className="hal-search__filter"
              aria-pressed={surface === 'all'}
              onClick={() => setSurface('all')}
            >
              <span className="hal-search__filtername">All</span>
              <span className="hal-search__filtercount">{results.total}</span>
            </button>
            {SURFACES.map((key) => {
              const count = results.bySurface[key] ?? 0
              return (
                <button
                  key={key}
                  type="button"
                  className="hal-search__filter"
                  aria-pressed={surface === key}
                  disabled={count === 0}
                  onClick={() => setSurface(key)}
                >
                  <span className="hal-search__filtername">{SURFACE_LABEL[key] ?? key}</span>
                  <span className="hal-search__filtercount">{count}</span>
                </button>
              )
            })}
          </div>

          <div className="hal-search__resultpane">
            <div
              id="hal-search-results"
              className="hal-search__results"
              role="listbox"
              aria-label="Results"
              ref={listRef}
            >
              {hits.map((hit, i) => (
                <div
                  key={`${hit.kind}-${hit.id}`}
                  id={optionId(hit)}
                  role="option"
                  aria-selected={i === active}
                  className="hal-search__hit"
                  data-hit={hit.id}
                  onClick={() => openHit(hit)}
                  onMouseEnter={() => setActive(i)}
                >
                  <span className="hal-search__hittop">
                    <span className="hal-search__hittitle">{hit.title}</span>
                    <span className="hal-search__hitsurface">
                      {SURFACE_LABEL[hit.surface] ?? hit.surface}
                    </span>
                  </span>
                  <span className="hal-search__hitdetail">{hit.detail}</span>
                </div>
              ))}
            </div>

            {hits.length === 0 ? (
              <div className="hal-search__empty" role="status">
                {query.trim().length < 2
                  ? 'Type at least two characters. This searches the mail, the files, the photographs, the ledger and the web at once.'
                  : `Nothing matches “${query}”.${discoveredOnly ? ' You are only searching what you have already found.' : ''}`}
              </div>
            ) : null}

            <div className="hal-search__foot">
              <span>{hits.length} shown</span>
              <span aria-hidden="true">↑↓ move · ↵ open · esc close</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
