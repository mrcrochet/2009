'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { canAfford, signalBudget, signalRemaining } from '@/engine/mysteries'
import { reportError } from '@/lib/errors'
import type { WayUpBlock, WayUpResult, WayUpSearchResponse, WayUpSnapshot } from '@/lib/wayup/types'
import { useContent, useDispatch, useTimeline } from './GameContext'
import { useFocusTrap } from './useFocusTrap'
import { pace, useReducedMotion } from './useReducedMotion'

/**
 * The relay console — a process on a beige machine in 2009 reaching somewhere it has no words
 * for.
 *
 * It is built like the investigation board and not like a browser: a focused in-world mode that
 * takes the screen, traps focus, and is left with Escape. What it renders is never markup from
 * the other side. The API hands back an immutable snapshot of normalised text blocks; this draws
 * those blocks with HALCYON's own elements, and an address the page names is a line of text the
 * player may send back through the relay, never something the browser can follow on its own.
 *
 * Every word on this screen is authored in `content/day01/wayup.ts`. Nothing about the machine's
 * voice is decided here, because the moment one line of it is written in TypeScript the console
 * starts sounding like software that understands what it is doing.
 */

/** A line kept from a page has to be a line, not a page. */
const MAX_EXCERPT = 600

/**
 * The pause between the far end answering and the console admitting it.
 *
 * A 2009 machine reaching this far does not repaint instantly, and the beat is where the strain
 * lives. It is a scripted delay like the boot ticker and the typing pause, so it goes through
 * `pace()` and collapses for a player who asked for less motion. The beat still happens; the
 * waiting does not.
 */
const CARRIER_HOLD_MS = 340

type Screen = 'blank' | 'offline' | 'results' | 'page'

/**
 * What came back from one of our own routes, with the player's text already out of it.
 *
 * The transport deliberately knows no copy: it reports which *kind* of answer arrived and the
 * refusal code if there was one, and the component turns that into the console's own words. That
 * is what keeps the raw server message — which is written for a developer reading a log — off
 * the screen.
 */
type RelayResult<T> =
  | { readonly status: 'ok'; readonly value: T }
  | { readonly status: 'offline' }
  | { readonly status: 'slow'; readonly seconds: number }
  | { readonly status: 'refused'; readonly refusal: string | null }
  | { readonly status: 'aborted' }

async function readJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T
  } catch {
    return null
  }
}

async function relay<T>(path: string, body: unknown, signal: AbortSignal): Promise<RelayResult<T>> {
  let response: Response
  try {
    response = await globalThis.fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    })
  } catch (error) {
    if (signal.aborted) return { status: 'aborted' }
    // What the player typed is in the request body and stays there. What is reported is that the
    // line went down — never the query, for the same reason a Recall query is never reported.
    reportError(error, { scope: 'wayup.console' })
    return { status: 'refused', refusal: 'network' }
  }

  // No index on this side of the line. Not an error: a state the machine can be in.
  if (response.status === 503) return { status: 'offline' }
  if (response.status === 429) {
    const after = Number(response.headers.get('retry-after') ?? '')
    return { status: 'slow', seconds: Number.isFinite(after) && after > 0 ? Math.ceil(after) : 1 }
  }
  if (!response.ok) {
    const payload = await readJson<{ refusal?: unknown }>(response)
    return {
      status: 'refused',
      refusal: typeof payload?.refusal === 'string' ? payload.refusal : null,
    }
  }

  const value = await readJson<T>(response)
  return value === null ? { status: 'refused', refusal: null } : { status: 'ok', value }
}

/** Hex SHA-256, the same shape `lib/wayup/cache.ts` hashes with on the other side. */
async function sha256Hex(value: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

function fill(template: string, values: Readonly<Record<string, string>>): string {
  return Object.entries(values).reduce(
    (out, [key, value]) => out.replaceAll(`{{${key}}}`, value),
    template,
  )
}

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    if (ms <= 0) resolve()
    else setTimeout(resolve, ms)
  })

/** The text of a block, for the keyboard path — what keeping the line the caret is on keeps. */
function blockText(block: WayUpBlock): string {
  switch (block.kind) {
    case 'heading':
    case 'p':
    case 'quote':
    case 'code':
      return block.text
    case 'list':
      return block.items.join(' · ')
    case 'rule':
      return ''
    default:
      return ''
  }
}

/** Normalised text, drawn by HALCYON. Nothing here can emit markup; every branch sets a text node. */
function Block({ block }: { block: WayUpBlock }) {
  switch (block.kind) {
    case 'heading': {
      const Tag = block.level === 1 ? 'h3' : block.level === 2 ? 'h4' : 'h5'
      return <Tag className="hal-wayup__h">{block.text}</Tag>
    }
    case 'p':
      return <p className="hal-wayup__p">{block.text}</p>
    case 'quote':
      return <blockquote className="hal-wayup__quote">{block.text}</blockquote>
    case 'list':
      return (
        <ul className="hal-wayup__list">
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )
    case 'code':
      return <pre className="hal-wayup__code">{block.text}</pre>
    case 'rule':
      return <hr className="hal-wayup__rule" />
    default:
      return null
  }
}

export function WayUpOverlay() {
  const content = useContent()
  const dispatch = useDispatch()
  const cfg = content.wayup
  const open = useTimeline((s) => s.ui.wayupOpen)
  const observed = useTimeline((s) => s.wayup.observed)
  const futureEvidence = useTimeline((s) => s.wayup.futureEvidence)
  const remaining = useTimeline((s) => signalRemaining(s, content))
  const affordsOpen = useTimeline((s) => canAfford(s, content, cfg?.openCost ?? 0))
  const affordsSearch = useTimeline((s) => canAfford(s, content, cfg?.searchCost ?? 0))
  const reduced = useReducedMotion()

  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const blocksRef = useRef<HTMLDivElement>(null)
  useFocusTrap(panelRef, open, inputRef)

  const [query, setQuery] = useState('')
  const [sending, setSending] = useState(false)
  const [screen, setScreen] = useState<Screen>('blank')
  const [results, setResults] = useState<readonly WayUpResult[]>([])
  const [snapshot, setSnapshot] = useState<WayUpSnapshot | null>(null)
  const [line, setLine] = useState('')
  const [selection, setSelection] = useState('')

  /**
   * URLs opened during this attachment, and the snapshot each produced.
   *
   * The client cannot know a page's snapshot id before it has the page, so it cannot know in
   * advance that reopening one is free. This is how it finds out — and it is why a row the
   * player has already opened stays openable after the day's signal has run out, exactly as the
   * reducer would allow. State rather than a ref, because it decides what a row looks like.
   */
  const [snapshotByUrl, setSnapshotByUrl] = useState<ReadonlyMap<string, string>>(() => new Map())
  /**
   * Which line the keyboard is on.
   *
   * "Select the text and press the control" is a pointer gesture: without caret browsing there is
   * no way to make a selection in non-editable content, so the keep control was unreachable by
   * keyboard entirely — an accessibility hole in the one mechanic the whole relay exists for.
   *
   * The document is therefore a list of lines with one tab stop, arrow keys, and Enter, which is
   * a widget this can back with its full keyboard contract. A mouse selection still wins when
   * there is one: picking half a sentence is worth more than picking a paragraph.
   */
  const [activeLine, setActiveLine] = useState(0)
  const requestRef = useRef(0)
  const abortRef = useRef<AbortController | null>(null)

  /** Read after an await, where `open` from the render that started the request is already old. */
  const openRef = useRef(open)
  useEffect(() => {
    openRef.current = open
  }, [open])

  useEffect(() => {
    if (open) return
    // Detaching ends the session: a request in flight is dropped rather than landing on a
    // console the player has already left — and, worse, spending signal on a page nobody saw.
    abortRef.current?.abort()
    abortRef.current = null
  }, [open])

  useEffect(
    () => () => {
      abortRef.current?.abort()
    },
    [],
  )

  const close = useCallback(() => {
    dispatch({ type: 'WAYUP_TOGGLED', open: false })
  }, [dispatch])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close])

  /** The live selection, read from the document rather than remembered, so it cannot go stale. */
  const readSelection = useCallback((): string => {
    const node = blocksRef.current
    const sel = typeof document === 'undefined' ? null : document.getSelection()
    if (!node || !sel || sel.rangeCount === 0 || sel.isCollapsed) return ''
    const anchorIn = sel.anchorNode ? node.contains(sel.anchorNode) : false
    const focusIn = sel.focusNode ? node.contains(sel.focusNode) : false
    if (!anchorIn || !focusIn) return ''
    return sel.toString().replace(/\s+/g, ' ').trim().slice(0, MAX_EXCERPT)
  }, [])

  useEffect(() => {
    if (screen !== 'page') return
    const onSelect = () => setSelection(readSelection())
    document.addEventListener('selectionchange', onSelect)
    return () => document.removeEventListener('selectionchange', onSelect)
  }, [screen, readSelection])

  /**
   * Every request goes through here so the console can only ever be showing one answer: a stale
   * response from a query the player has moved on from is dropped rather than repainting over
   * the one they are reading.
   */
  const send = useCallback(
    async <T,>(path: string, body: unknown): Promise<RelayResult<T> | null> => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      requestRef.current += 1
      const ticket = requestRef.current

      setSending(true)
      setLine('')
      const outcome = await relay<T>(path, body, controller.signal)
      await sleep(pace(CARRIER_HOLD_MS, reduced))
      // A newer request owns the screen now, and owns the flag with it.
      if (ticket !== requestRef.current) return null
      setSending(false)
      if (outcome.status === 'aborted' || !openRef.current) return null
      return outcome
    },
    [reduced],
  )

  /** Blocks a player can actually keep, in document order. A rule is not a line. */
  const lines = useMemo(
    () => (snapshot?.blocks ?? []).flatMap((block, i) => (blockText(block).length > 0 ? [i] : [])),
    [snapshot],
  )

  if (!cfg || !open) return null

  const budget = signalBudget(content)
  const refusalLine = (refusal: string | null): string => {
    const authored = refusal ? cfg.refusals[refusal] : undefined
    return authored && authored.length > 0 ? authored : cfg.fallbackRefusal
  }

  const noticeFor = (outcome: RelayResult<unknown>): string =>
    outcome.status === 'slow'
      ? fill(cfg.rateLimited, { seconds: String(outcome.seconds) })
      : outcome.status === 'refused'
        ? refusalLine(outcome.refusal)
        : ''

  /**
   * One field, and the machine works out what it was given.
   *
   * A question needs an index and there may not be one on this side of the line. An address
   * needs nothing but the address — which is what the day's own copy says: "only the address,
   * and an address is not a conversation." So a dial still works when asking does not, and on a
   * deployment with no index it is the whole of what the relay can do. A command line in 2009
   * would have made exactly this distinction, and made it silently.
   */
  const looksLikeAddress = (text: string): boolean =>
    !/\s/.test(text) && /^(?:[a-z][a-z0-9+.-]*:\/\/)?[a-z0-9-]+(\.[a-z0-9-]+)+(\/|$|\?)/i.test(text)

  const transmit = async () => {
    const asked = query.trim()
    // The console must not let the player reach a refusal it could have predicted: an empty
    // input and a spent budget are both refused here rather than by the far end.
    if (asked.length === 0 || sending) return
    if (looksLikeAddress(asked)) {
      if (!affordsOpen && !alreadyObserved(asked)) return
      await openAddress(asked)
      return
    }
    if (!affordsSearch) return

    const outcome = await send<WayUpSearchResponse>('/api/wayup/search', { query: asked })
    if (!outcome) return
    if (outcome.status === 'offline') {
      setScreen('offline')
      setResults([])
      setSnapshot(null)
      return
    }
    if (outcome.status !== 'ok') {
      setLine(noticeFor(outcome))
      return
    }
    /*
     * Charged on an answer, not on the attempt.
     *
     * The question itself is never on the event — freeform player text stays on the device, the
     * same rule the API route follows — so what the log records is that a question was asked and
     * what it cost. A far end that never answered has not taken anything.
     */
    if (cfg.searchCost > 0) dispatch({ type: 'WAYUP_SEARCHED', signalCost: cfg.searchCost })
    setResults(outcome.value.results)
    setSnapshot(null)
    setSelection('')
    setScreen('results')
  }

  /** Free to open again: this address already produced a snapshot this timeline has observed. */
  const alreadyObserved = (url: string): boolean => {
    const known = snapshotByUrl.get(url)
    return known !== undefined && observed.includes(known)
  }

  const openAddress = async (url: string) => {
    if (sending || (!affordsOpen && !alreadyObserved(url))) return

    const outcome = await send<{ snapshot?: WayUpSnapshot }>('/api/wayup/fetch', { url })
    if (!outcome) return
    if (outcome.status === 'offline') {
      setScreen('offline')
      return
    }
    if (outcome.status !== 'ok') {
      setLine(noticeFor(outcome))
      return
    }
    const captured = outcome.value.snapshot
    if (!captured) {
      setLine(cfg.fallbackRefusal)
      return
    }

    setSnapshotByUrl((prev) => new Map(prev).set(url, captured.id))
    // A page already read costs nothing to read again, and the log should not carry a second
    // observation of it either — the reducer refuses the spend, but only this can keep the event
    // out of the save.
    if (!observed.includes(captured.id)) {
      dispatch({
        type: 'WAYUP_SNAPSHOT_OBSERVED',
        snapshotId: captured.id,
        signalCost: cfg.openCost,
      })
    }
    setSnapshot(captured)
    setSelection('')
    setScreen('page')
  }

  const kept = snapshot ? futureEvidence.filter((entry) => entry.snapshotId === snapshot.id) : []
  const alreadyKept = selection.length > 0 && kept.some((entry) => entry.excerpt === selection)

  const onLineKeyDown = (event: React.KeyboardEvent) => {
    if (lines.length === 0) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveLine((i) => Math.min(i + 1, lines.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveLine((i) => Math.max(i - 1, 0))
    } else if (event.key === 'Home') {
      event.preventDefault()
      setActiveLine(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      setActiveLine(lines.length - 1)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      void keep()
    }
  }

  const keep = async () => {
    if (!snapshot) return
    /*
     * A mouse selection wins: half a sentence somebody chose is worth more than the paragraph
     * the caret happens to be in. Otherwise the line the keyboard is on — but only if the player
     * has actually been in the document. Keeping line one from a cursor nobody moved would be
     * the machine deciding which line matters, which is the thing it says it will not do.
     */
    const inDocument = Boolean(
      blocksRef.current &&
      document.activeElement &&
      blocksRef.current.contains(document.activeElement),
    )
    const blockIndex = lines[activeLine]
    const fallback =
      !inDocument || blockIndex === undefined
        ? ''
        : blockText(snapshot.blocks[blockIndex]!).slice(0, MAX_EXCERPT)
    const excerpt = readSelection() || fallback
    if (excerpt.length === 0) {
      setSelection('')
      setLine(cfg.pinHint)
      return
    }
    setSelection(excerpt)
    if (kept.some((entry) => entry.excerpt === excerpt)) return
    // Hashed with the snapshot it came from: the same sentence found on two different pages is
    // two pieces of evidence, and the reducer's dedupe then means "this line, from this page".
    const excerptHash = await sha256Hex(`${snapshot.id}\n${excerpt}`)
    dispatch({
      type: 'WAYUP_EVIDENCE_PINNED',
      id: `fe_${excerptHash.slice(0, 16)}`,
      snapshotId: snapshot.id,
      excerpt,
      excerptHash,
      // Carried on the event, because the timeline holds ids and the snapshot cache is not
      // something a replay on an offline machine can reach.
      sourceUrl: snapshot.canonicalUrl,
      sourceTitle: snapshot.title,
    })
  }

  const dialling = looksLikeAddress(query.trim())
  const affordsThis = dialling ? affordsOpen || alreadyObserved(query.trim()) : affordsSearch
  const say = sending ? cfg.working : line.length > 0 ? line : affordsThis ? '' : cfg.exhausted
  const canTransmit = query.trim().length > 0 && !sending && affordsThis

  return (
    <div className="hal-wayup" data-testid="wayup">
      <div
        className="hal-wayup__panel"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={cfg.title}
        tabIndex={-1}
      >
        <div className="hal-wayup__head">
          <span className="hal-wayup__title">{cfg.title}</span>
          <span className="hal-wayup__sub">{cfg.subtitle}</span>
          <button
            type="button"
            className="hal-wayup__close"
            aria-label={cfg.closeLabel}
            onClick={close}
          >
            ×
          </button>
        </div>

        <form
          className="hal-wayup__send"
          onSubmit={(e) => {
            e.preventDefault()
            void transmit()
          }}
        >
          <label className="hal-wayup__label" htmlFor="wayup-query">
            {cfg.queryLabel}
          </label>
          <input
            id="wayup-query"
            ref={inputRef}
            className="hal-wayup__input"
            value={query}
            maxLength={256}
            spellCheck={false}
            autoComplete="off"
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="submit"
            className="hal-wayup__go"
            /* Never `disabled`: a control that goes disabled under the player's own focus drops
               them to <body> and costs them their place on the screen. */
            aria-disabled={!canTransmit}
            data-spent={!affordsThis}
          >
            {cfg.submitLabel}
          </button>
        </form>

        <div className="hal-wayup__meter">
          <span className="hal-wayup__signal" data-testid="wayup-signal">
            {fill(cfg.signalTemplate, { left: String(remaining), budget: String(budget) })}
          </span>
          <span className="hal-wayup__say" role="status">
            {say}
          </span>
        </div>

        <div className="hal-wayup__out">
          {screen === 'offline' ? (
            <section className="hal-wayup__notice" aria-labelledby="wayup-offline">
              <h2 className="hal-wayup__noticetitle" id="wayup-offline">
                {cfg.offlineTitle}
              </h2>
              <p className="hal-wayup__noticebody">{cfg.offlineBody}</p>
              {cfg.offlineDial ? <p className="hal-wayup__noticebody">{cfg.offlineDial}</p> : null}
            </section>
          ) : null}

          {screen === 'results' ? (
            results.length === 0 ? (
              <p className="hal-wayup__empty">{cfg.emptyResults}</p>
            ) : (
              <>
                <div className="hal-wayup__label">{cfg.resultsLabel}</div>
                <div className="hal-wayup__rows">
                  {results.map((result) => {
                    const free = alreadyObserved(result.url)
                    return (
                      <button
                        key={result.url}
                        type="button"
                        className="hal-wayup__row"
                        data-url={result.url}
                        aria-disabled={!affordsOpen && !free}
                        onClick={() => void openAddress(result.url)}
                      >
                        <span className="hal-wayup__rowtitle">{result.title}</span>
                        <span className="hal-wayup__rowurl">{result.url}</span>
                        {result.snippet.length > 0 ? (
                          <span className="hal-wayup__rowsnip">{result.snippet}</span>
                        ) : null}
                        <span className="hal-wayup__rowcost">
                          {free ? '' : fill(cfg.costTemplate, { cost: String(cfg.openCost) })}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </>
            )
          ) : null}

          {screen === 'page' && snapshot ? (
            <article className="hal-wayup__doc">
              <div className="hal-wayup__docbar">
                <button
                  type="button"
                  className="hal-wayup__back"
                  onClick={() => setScreen('results')}
                >
                  {cfg.backLabel}
                </button>
                <button
                  type="button"
                  className="hal-wayup__keep"
                  aria-disabled={alreadyKept}
                  /* Pressing a button collapses the document selection before the click lands,
                     which would make the control that keeps a marked line the one thing that
                     unmarks it. */
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => void keep()}
                >
                  {alreadyKept ? cfg.pinnedLabel : cfg.pinLabel}
                </button>
              </div>

              <h2 className="hal-wayup__doctitle">{snapshot.title}</h2>
              <div className="hal-wayup__docurl">{snapshot.canonicalUrl}</div>

              <div
                className="hal-wayup__blocks"
                ref={blocksRef}
                role="listbox"
                aria-label={cfg.docLabel}
                aria-activedescendant={
                  lines[activeLine] !== undefined
                    ? `hal-wayup-line-${lines[activeLine]}`
                    : undefined
                }
                tabIndex={0}
                onKeyDown={onLineKeyDown}
              >
                {snapshot.blocks.map((block, i) => {
                  const at = lines.indexOf(i)
                  // A rule is not a line anybody can keep, so it is not in the list at all.
                  if (at === -1) return <Block key={i} block={block} />
                  return (
                    <div
                      key={i}
                      id={`hal-wayup-line-${i}`}
                      role="option"
                      aria-selected={at === activeLine}
                      className="hal-wayup__line"
                      onMouseDown={() => setActiveLine(at)}
                    >
                      <Block block={block} />
                    </div>
                  )
                })}
              </div>

              <div className="hal-wayup__captured">
                {fill(cfg.capturedTemplate, {
                  when: snapshot.remoteFetchedAt,
                  bytes: String(snapshot.byteLength),
                  provider: snapshot.provider,
                })}
              </div>

              <p className="hal-wayup__hint">{cfg.pinHint}</p>

              {kept.length > 0 ? (
                <div className="hal-wayup__kept">
                  <div className="hal-wayup__label">{cfg.pinnedLabel}</div>
                  {kept.map((entry) => (
                    <div key={entry.id} className="hal-wayup__keptline">
                      {entry.excerpt}
                    </div>
                  ))}
                </div>
              ) : null}

              {snapshot.outgoingLinks.length > 0 ? (
                <div className="hal-wayup__links">
                  <div className="hal-wayup__label">{cfg.linksLabel}</div>
                  {/* Text, never an anchor. An address on a page from the other side is
                      something the player may choose to send back through the relay — it is
                      never something this browser can be made to follow on its own. */}
                  {snapshot.outgoingLinks.map((link) => (
                    <button
                      key={link.url}
                      type="button"
                      className="hal-wayup__link"
                      data-url={link.url}
                      aria-disabled={!affordsOpen && !alreadyObserved(link.url)}
                      onClick={() => void openAddress(link.url)}
                    >
                      {link.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </article>
          ) : null}
        </div>
      </div>
    </div>
  )
}
