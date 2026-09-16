'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { clockString } from '@/engine/clock'
import { canAfford, signalBudget, signalRemaining } from '@/engine/mysteries'
import { reportError } from '@/lib/errors'
import type { RelayBlock, RelayResult, RelaySearchResponse, RelaySnapshot } from '@/lib/relay/types'
import { useContent, useDispatch, useInvestigation } from '../GameContext'
import { pace, useReducedMotion } from '../useReducedMotion'

/**
 * The relay — a process on the workstation reaching somewhere it has no words for.
 *
 * It is an application on this workstation, not a tab in the fictional browser: one route out,
 * metered, and everything it brings back is captured. It used to be a focused mode that took the
 * whole screen, which made a thing the investigator works *alongside* into something they had to
 * leave the desk for — the address they wanted to send was usually in a window behind it.
 *
 * What it renders is never markup from the other side. The API hands back an immutable snapshot
 * of normalised text blocks; this draws those blocks with NOVA's own elements, and an address the
 * page names is a line of text the player may send back through the relay, never something the
 * browser can follow on its own.
 *
 * Every word on this screen is authored by the case. Nothing about the machine's voice is decided
 * here, because the moment one line of it is written in TypeScript the console starts sounding
 * like software that understands what it is doing.
 */

/** A line kept from a page has to be a line, not a page. */
const MAX_EXCERPT = 600

/**
 * The pause between the far end answering and the console admitting it.
 *
 * A machine reaching this far does not repaint instantly, and the beat is where the strain
 * lives. It is a scripted delay like the boot ticker and the typing pause, so it goes through
 * `pace()` and collapses for a player who asked for less motion. The beat still happens; the
 * waiting does not.
 */
const CARRIER_HOLD_MS = 340

type Screen = 'blank' | 'offline' | 'results' | 'page' | 'captures'

/**
 * What came back from one of our own routes, with the player's text already out of it.
 *
 * The transport deliberately knows no copy: it reports which *kind* of answer arrived and the
 * refusal code if there was one, and the component turns that into the console's own words. That
 * is what keeps the raw server message — which is written for a developer reading a log — off
 * the screen.
 */
type RequestOutcome<T> =
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

async function relay<T>(
  path: string,
  body: unknown,
  signal: AbortSignal,
): Promise<RequestOutcome<T>> {
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
    // line went down — never the query. Freeform player text does not enter the log.
    reportError(error, { scope: 'relay.console' })
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

/** Hex SHA-256, the same shape `lib/relay/cache.ts` hashes with on the other side. */
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
function blockText(block: RelayBlock): string {
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

/** Normalised text, drawn by NOVA. Nothing here can emit markup; every branch sets a text node. */
function Block({ block }: { block: RelayBlock }) {
  switch (block.kind) {
    case 'heading': {
      const Tag = block.level === 1 ? 'h3' : block.level === 2 ? 'h4' : 'h5'
      return <Tag className="nova-relay__h">{block.text}</Tag>
    }
    case 'p':
      return <p className="nova-relay__p">{block.text}</p>
    case 'quote':
      return <blockquote className="nova-relay__quote">{block.text}</blockquote>
    case 'list':
      return (
        <ul className="nova-relay__list">
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )
    case 'code':
      return <pre className="nova-relay__code">{block.text}</pre>
    case 'rule':
      return <hr className="nova-relay__rule" />
    default:
      return null
  }
}

export function RelayApp() {
  const content = useContent()
  const dispatch = useDispatch()
  const cfg = content.relay
  const found = useInvestigation((s) => s.relay.unlocked)
  const captures = useInvestigation((s) => s.relay.captures)
  const futureEvidence = useInvestigation((s) => s.relay.kept)
  const remaining = useInvestigation((s) => signalRemaining(s, content))
  const affordsOpen = useInvestigation((s) => canAfford(s, content, cfg?.openCost ?? 0))
  const affordsSearch = useInvestigation((s) => canAfford(s, content, cfg?.searchCost ?? 0))
  const reduced = useReducedMotion()

  const inputRef = useRef<HTMLInputElement>(null)
  const blocksRef = useRef<HTMLDivElement>(null)

  const [query, setQuery] = useState('')
  const [sending, setSending] = useState(false)
  const [screen, setScreen] = useState<Screen>('blank')
  const [results, setResults] = useState<readonly RelayResult[]>([])
  const [snapshot, setSnapshot] = useState<RelaySnapshot | null>(null)
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

  /**
   * Read after an await, to find out whether the window is still open.
   *
   * Closing the relay ends the session: a request in flight is dropped rather than landing on a
   * console the player has already left — and, worse, spending signal on a page nobody saw. The
   * window unmounting is what closing *is* now, so the cleanup below is the whole of it.
   */
  const liveRef = useRef(true)
  useEffect(() => {
    liveRef.current = true
    return () => {
      liveRef.current = false
    }
  }, [])

  /*
   * The window opens on its one field.
   *
   * Not a focus trap — a window is a region and this one claims no modal contract. But the way
   * in is a terminal command, and a player who has just typed `relay` should land where they can
   * type the next thing rather than hunting for it.
   */
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(
    () => () => {
      abortRef.current?.abort()
    },
    [],
  )

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
    async <T,>(path: string, body: unknown): Promise<RequestOutcome<T> | null> => {
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
      if (outcome.status === 'aborted' || !liveRef.current) return null
      return outcome
    },
    [reduced],
  )

  /** Blocks a player can actually keep, in document order. A rule is not a line. */
  const lines = useMemo(
    () => (snapshot?.blocks ?? []).flatMap((block, i) => (blockText(block).length > 0 ? [i] : [])),
    [snapshot],
  )

  // A case with no line out, or a machine that has not admitted the process exists yet. The
  // reducer refuses to open the window either way; this is the second lock on the same door.
  if (!cfg || !found) return null

  const budget = signalBudget(content)
  const refusalLine = (refusal: string | null): string => {
    const authored = refusal ? cfg.refusals[refusal] : undefined
    return authored && authored.length > 0 ? authored : cfg.fallbackRefusal
  }

  const noticeFor = (outcome: RequestOutcome<unknown>): string =>
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
   * deployment with no index it is the whole of what the relay can do. A command line
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

    const outcome = await send<RelaySearchResponse>('/api/relay/search', { query: asked })
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
    if (cfg.searchCost > 0) dispatch({ type: 'RELAY_SEARCHED', signalCost: cfg.searchCost })
    setResults(outcome.value.results)
    setSnapshot(null)
    setSelection('')
    setScreen('results')
  }

  /** Free to open again: this address already produced a snapshot this investigation has brought back. */
  const alreadyObserved = (url: string): boolean => {
    const known = snapshotByUrl.get(url)
    return known !== undefined && captures.some((c) => c.snapshotId === known)
  }

  const openAddress = async (url: string) => {
    if (sending || (!affordsOpen && !alreadyObserved(url))) return

    const outcome = await send<{ snapshot?: RelaySnapshot }>('/api/relay/fetch', { url })
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
    if (!captures.some((c) => c.snapshotId === captured.id)) {
      dispatch({
        type: 'RELAY_SNAPSHOT_OBSERVED',
        snapshotId: captured.id,
        signalCost: cfg.openCost,
        // Carried on the event so the captures list can say what the signal was spent on,
        // in a replay that never had the snapshot cache.
        url: captured.canonicalUrl,
        title: captured.title,
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
      type: 'RELAY_EXCERPT_KEPT',
      id: `fe_${excerptHash.slice(0, 16)}`,
      snapshotId: snapshot.id,
      excerpt,
      excerptHash,
      // Carried on the event, because the investigation holds ids and the snapshot cache is not
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
    <div className="nova-relay" data-testid="relay">
      <div className="nova-relay__panel">
        <div className="nova-relay__head">
          <span className="nova-relay__sub">{cfg.subtitle}</span>
          <button
            type="button"
            className="nova-relay__tab"
            data-active={screen === 'captures'}
            aria-pressed={screen === 'captures'}
            onClick={() => setScreen(screen === 'captures' ? 'blank' : 'captures')}
          >
            {cfg.capturesLabel} <span>{captures.length}</span>
          </button>
        </div>

        <form
          className="nova-relay__send"
          onSubmit={(e) => {
            e.preventDefault()
            void transmit()
          }}
        >
          <label className="nova-relay__label" htmlFor="relay-query">
            {cfg.queryLabel}
          </label>
          <input
            id="relay-query"
            ref={inputRef}
            className="nova-relay__input"
            value={query}
            maxLength={256}
            spellCheck={false}
            autoComplete="off"
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="submit"
            className="nova-relay__go"
            /* Never `disabled`: a control that goes disabled under the player's own focus drops
               them to <body> and costs them their place on the screen. */
            aria-disabled={!canTransmit}
            data-spent={!affordsThis}
          >
            {cfg.submitLabel}
          </button>
        </form>

        <div className="nova-relay__meter">
          <span className="nova-relay__signal" data-testid="relay-signal">
            {fill(cfg.signalTemplate, { left: String(remaining), budget: String(budget) })}
          </span>
          <span className="nova-relay__say" role="status">
            {say}
          </span>
        </div>

        <div className="nova-relay__out">
          {/*
            Everything this investigation has brought back, and what each look cost.
            The list is read from the save, not from the snapshot cache — a page opened last
            session is still here after a reload, and reopening it is free because the reducer
            already knows the id.
          */}
          {screen === 'captures' ? (
            captures.length === 0 ? (
              <p className="nova-relay__empty">{cfg.capturesEmpty}</p>
            ) : (
              <div className="nova-relay__rows">
                {[...captures].reverse().map((capture) => (
                  <button
                    key={capture.snapshotId}
                    type="button"
                    className="nova-relay__row"
                    data-capture={capture.snapshotId}
                    onClick={() => {
                      if (capture.url) void openAddress(capture.url)
                    }}
                    aria-disabled={capture.url === null}
                  >
                    <span className="nova-relay__rowtitle">
                      {capture.title ?? capture.snapshotId}
                    </span>
                    <span className="nova-relay__rowurl">{capture.url ?? ''}</span>
                    <span className="nova-relay__rowcost">
                      {fill(cfg.captureTemplate, {
                        when: clockString(capture.at),
                        cost: String(capture.cost),
                      })}
                    </span>
                  </button>
                ))}
              </div>
            )
          ) : null}

          {screen === 'offline' ? (
            <section className="nova-relay__notice" aria-labelledby="relay-offline">
              <h2 className="nova-relay__noticetitle" id="relay-offline">
                {cfg.offlineTitle}
              </h2>
              <p className="nova-relay__noticebody">{cfg.offlineBody}</p>
              {cfg.offlineDial ? <p className="nova-relay__noticebody">{cfg.offlineDial}</p> : null}
            </section>
          ) : null}

          {screen === 'results' ? (
            results.length === 0 ? (
              <p className="nova-relay__empty">{cfg.emptyResults}</p>
            ) : (
              <>
                <div className="nova-relay__label">{cfg.resultsLabel}</div>
                <div className="nova-relay__rows">
                  {results.map((result) => {
                    const free = alreadyObserved(result.url)
                    return (
                      <button
                        key={result.url}
                        type="button"
                        className="nova-relay__row"
                        data-url={result.url}
                        aria-disabled={!affordsOpen && !free}
                        onClick={() => void openAddress(result.url)}
                      >
                        <span className="nova-relay__rowtitle">{result.title}</span>
                        <span className="nova-relay__rowurl">{result.url}</span>
                        {result.snippet.length > 0 ? (
                          <span className="nova-relay__rowsnip">{result.snippet}</span>
                        ) : null}
                        <span className="nova-relay__rowcost">
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
            <article className="nova-relay__doc">
              <div className="nova-relay__docbar">
                <button
                  type="button"
                  className="nova-relay__back"
                  onClick={() => setScreen('results')}
                >
                  {cfg.backLabel}
                </button>
                <button
                  type="button"
                  className="nova-relay__keep"
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

              <h2 className="nova-relay__doctitle">{snapshot.title}</h2>
              <div className="nova-relay__docurl">{snapshot.canonicalUrl}</div>

              <div
                className="nova-relay__blocks"
                ref={blocksRef}
                role="listbox"
                aria-label={cfg.docLabel}
                aria-activedescendant={
                  lines[activeLine] !== undefined
                    ? `nova-relay-line-${lines[activeLine]}`
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
                      id={`nova-relay-line-${i}`}
                      role="option"
                      aria-selected={at === activeLine}
                      className="nova-relay__line"
                      onMouseDown={() => setActiveLine(at)}
                    >
                      <Block block={block} />
                    </div>
                  )
                })}
              </div>

              <div className="nova-relay__captured">
                {fill(cfg.capturedTemplate, {
                  when: snapshot.remoteFetchedAt,
                  bytes: String(snapshot.byteLength),
                  provider: snapshot.provider,
                })}
              </div>

              <p className="nova-relay__hint">{cfg.pinHint}</p>

              {kept.length > 0 ? (
                <div className="nova-relay__kept">
                  <div className="nova-relay__label">{cfg.pinnedLabel}</div>
                  {kept.map((entry) => (
                    <div key={entry.id} className="nova-relay__keptline">
                      {entry.excerpt}
                    </div>
                  ))}
                </div>
              ) : null}

              {snapshot.outgoingLinks.length > 0 ? (
                <div className="nova-relay__links">
                  <div className="nova-relay__label">{cfg.linksLabel}</div>
                  {/* Text, never an anchor. An address on a page from the other side is
                      something the player may choose to send back through the relay — it is
                      never something this browser can be made to follow on its own. */}
                  {snapshot.outgoingLinks.map((link) => (
                    <button
                      key={link.url}
                      type="button"
                      className="nova-relay__link"
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
