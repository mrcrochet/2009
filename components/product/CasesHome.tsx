'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { track } from '@/lib/analytics'
import { Art, KeyArtDefs, type ArtId } from './CaseArt'

/**
 * UNLISTED — Home.
 *
 * A verbatim port of the design reference: sidebar, continue hero plus two posters, four rails,
 * the floating session bar and the case brief. The reference is the source of truth for this
 * page, so the markup follows it element for element and the copy is its copy.
 *
 * It is the front door: cases arrive the way a streaming service releases series, so the root of
 * the site is the shelf. Every destination that exists is reachable from here — the workstation
 * and the account — and the entries whose pages are not built yet keep the reference's `#`
 * rather than pretending.
 *
 * The catalogue below is the reference's, and it is **placeholder data**: Case 001 is the only
 * case this build actually ships. It lives in constants at the top of this file so that wiring
 * the shelf to `content/index.ts` later is a change here and nowhere else.
 */

interface Entry {
  readonly code: string
  readonly title: string
  readonly art: ArtId
  readonly hook?: string
  readonly meta: string
  readonly stamp?: { label: string; free?: boolean }
  readonly progress?: string
}

const CONTINUE: readonly Entry[] = [
  {
    code: 'Case 004',
    title: 'No signal',
    art: 'art-house',
    hook: 'A phone has been transmitting every night from an abandoned property.',
    meta: 'Device · Hard · 41m in',
    progress: '22%',
  },
  {
    code: 'Case 006',
    title: 'The other account',
    art: 'art-screen',
    hook: 'Two accounts. One name. The second one is still posting.',
    meta: 'Identity · Open web · 1h 03m in',
    progress: '48%',
  },
]

const NEW_THIS_WEEK: readonly (Entry & { shape?: 'wide' })[] = [
  {
    code: 'Case 008',
    title: 'The empty house',
    art: 'art-signal',
    hook: 'A phone has been transmitting every night from an abandoned property. Eleven nights so far. Nobody lives there.',
    meta: 'Device · Hard · 3h+',
    stamp: { label: 'New' },
    shape: 'wide',
  },
  {
    code: 'Case 009',
    title: 'Room 1705',
    art: 'art-corridor',
    hook: 'The hotel says the room was never booked. The receipt says otherwise.',
    meta: 'Location · 2h',
    stamp: { label: 'New' },
  },
  {
    code: 'Case 010',
    title: 'Paid in full',
    art: 'art-ledger',
    hook: 'Forty-one identical invoices from a company that has no employees.',
    meta: 'Financial · 3h+',
    stamp: { label: 'New' },
  },
  {
    code: 'Case 011',
    title: 'Second shift',
    art: 'art-blinds',
    hook: 'Everyone on the night crew remembers a different version of the same hour.',
    meta: 'Workplace · 2h',
  },
  {
    code: 'Case 012',
    title: 'Exit 14',
    art: 'art-road',
    hook: 'One last toll-booth photo. Then nothing.',
    meta: 'Missing person · under 1h',
  },
  {
    code: 'Case 017',
    title: 'The witness list',
    art: 'art-paper',
    hook: 'Six names. Four of them never existed.',
    meta: 'Records · 2h',
  },
]

const SERIES: readonly { n: string; title: string; note: string; art: ArtId; locked?: boolean }[] =
  [
    { n: '01', title: 'He never came home', note: 'In progress', art: 'art-lot' },
    { n: '02', title: 'The Foundation', note: 'Included', art: 'art-ledger' },
    { n: '03', title: 'Room 1705', note: 'New', art: 'art-corridor' },
    { n: '04', title: 'Unknown device', note: 'Included', art: 'art-house' },
    { n: '05', title: 'The 2009 archive', note: 'Oct 2', art: 'art-paper', locked: true },
  ]

const BECAUSE: readonly Entry[] = [
  {
    code: 'Case 007',
    title: 'Last seen online',
    art: 'art-screen',
    meta: 'He logged in every day for nine years. Then the account kept going without him.',
  },
  {
    code: 'Case 005',
    title: 'Unknown device',
    art: 'art-house',
    meta: 'A tablet nobody in the family recognizes, synced to a name nobody knows.',
  },
  {
    code: 'Case 013',
    title: 'The second profile',
    art: 'art-corridor',
    meta: 'She asks you to find her brother. The internet says he died six years ago.',
  },
  {
    code: 'Case 018',
    title: 'The quiet floor',
    art: 'art-blinds',
    meta: 'Badge logs say the ninth floor was empty. The elevator disagrees.',
  },
  {
    code: 'Case 015',
    title: 'The audit',
    art: 'art-ledger',
    meta: 'Every number reconciles. That is the problem.',
  },
]

const FREE: readonly Entry[] = [
  {
    code: 'Case 001',
    title: 'He never came home',
    art: 'art-lot',
    meta: 'Missing person · 2–4h',
    stamp: { label: 'Free', free: true },
  },
  {
    code: 'Case 003',
    title: 'Wrong number',
    art: 'art-blinds',
    hook: 'Forty missed calls from a number that was disconnected in 2019.',
    meta: 'Phone only · under 1h',
    stamp: { label: 'Free', free: true },
  },
  {
    code: 'Case 016',
    title: 'Northbound',
    art: 'art-road',
    meta: 'Location · 2h · Members',
  },
  {
    code: 'Case 015',
    title: 'The audit',
    art: 'art-paper',
    meta: 'Financial · 3h+ · Members',
  },
]

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M6 4l14 8-14 8z" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M9 6l6 6-6 6" />
    </svg>
  )
}

export function CasesHome() {
  const [open, setOpen] = useState(false)
  const modal = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    if (open) modal.current?.querySelector<HTMLElement>('.close')?.focus()
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [close])

  // The funnel starts here now: this page is the front door, not a poster in front of it.
  useEffect(() => {
    track('landing_viewed', {})
  }, [])

  return (
    <>
      <KeyArtDefs />

      <div className="app">
        {/* ===================== SIDEBAR ===================== */}
        <aside className="side">
          <Link className="brand" href="/">
            <i />
            Unlisted
          </Link>
          <button className="find" type="button">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <span>Search</span>
            <kbd>⌘K</kbd>
          </button>

          <nav className="nav" aria-label="Home">
            <h4>Home</h4>
            <Link href="/" aria-current="page">
              Home
            </Link>
            <a href="#">
              New cases<span>3</span>
            </a>
            <a href="#">Series</a>
            <a href="#">Standalone</a>
            <a href="#">
              Dispatch<span className="live">1</span>
            </a>
          </nav>
          <nav className="nav" aria-label="Library">
            <h4>Library</h4>
            <a href="#">
              Continue investigating<span>3</span>
            </a>
            <a href="#">
              My cases<span>7</span>
            </a>
            <a href="#">
              Archive<span>2</span>
            </a>
            <a href="#">Toolkit</a>
          </nav>
          <nav className="nav" aria-label="Account">
            <h4>Account</h4>
            <Link href="/account">Profile</Link>
            <Link href="/account">Subscription</Link>
          </nav>

          <div className="plan">
            <b>Unlisted membership</b>Renews Oct 13 · All standard cases
            <Link href="/account">Manage</Link>
          </div>
        </aside>

        {/* ===================== MAIN ===================== */}
        <main className="main">
          <div className="topbar">
            <div>
              <h1 className="h">
                Good evening, Guerschon.
                <br />
                <span className="g">Daniel Mercer has been missing for eight days.</span>
              </h1>
              <div className="meta">Tue 13 Jun 2026 · 19:42 · 2,814 investigators online</div>
            </div>
            <Link className="user" href="/account">
              <span className="av">G</span>Clearance · Standard
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </Link>
          </div>

          {/* ===== Continue investigating ===== */}
          <div className="rowhead">
            <h2>Continue investigating</h2>
            <a href="#">
              All
              <ArrowIcon />
            </a>
          </div>
          <section className="continue">
            <article className="hero">
              <div className="art">
                <Art id="art-lot" />
              </div>
              <div className="veil" />
              <div className="glow" />
              <div className="body">
                <div className="code">
                  <b>Case 001</b> · 24-118 · Missing person · The Marlow Files, 01
                </div>
                <h3 className="h">He never came home</h3>
                <p className="sub">
                  Daniel Mercer disappeared eight days ago. His wife brought you his laptop, his
                  phone, and everything else she could find.
                </p>
                <dl className="kv">
                  <dt>Provided</dt>
                  <dd>Laptop image, locked phone, full name, photograph</dd>
                  <dt>Session</dt>
                  <dd>
                    <span className="m">2h 14m</span> · 48 artifacts · 4 claims filed
                  </dd>
                  <dt>Last activity</dt>
                  <dd>
                    Last search, <b>“Daniel Mercer”</b>
                  </dd>
                </dl>
                <div className="cta">
                  <Link
                    className="btn w"
                    href="/play"
                    onClick={() => track('case_opened', { caseId: 'case001' })}
                  >
                    <PlayIcon />
                    Resume workstation
                  </Link>
                  <button className="btn d" type="button" onClick={() => setOpen(true)}>
                    Case brief
                  </button>
                </div>
              </div>
              <div className="dots">
                <i />
                <i />
                <i />
              </div>
            </article>

            {CONTINUE.map((entry) => (
              <Poster key={entry.code} entry={entry} onOpen={() => setOpen(true)} />
            ))}
          </section>

          {/* ===== New this week ===== */}
          <Rail title="New this week" link="See all" arrows>
            {NEW_THIS_WEEK.map((entry) => (
              <Poster
                key={entry.code}
                entry={entry}
                shape={entry.shape}
                onOpen={() => setOpen(true)}
              />
            ))}
          </Rail>

          {/* ===== Series ===== */}
          <section className="rail">
            <div className="intro">
              <div>
                <div className="code">
                  <b>Series</b> · Season one
                </div>
                <h2 className="h" style={{ marginTop: 6 }}>
                  The Marlow Files.
                  <br />
                  <span className="g">Five cases. One thread.</span>
                </h2>
              </div>
              <p className="sub">
                Each investigation stands on its own. Most people only notice halfway through that
                they&apos;re connected.
              </p>
            </div>
            <div className="spines">
              {SERIES.map((entry) => (
                <a className={entry.locked ? 'spine locked' : 'spine'} href="#" key={entry.n}>
                  <span className="art">
                    <Art id={entry.art} />
                  </span>
                  <span className="v" />
                  <span className="n">{entry.n}</span>
                  <span>
                    <b>{entry.title}</b>
                    <small>{entry.note}</small>
                  </span>
                </a>
              ))}
            </div>
          </section>

          {/* ===== Because you opened ===== */}
          <Rail title="Because you opened He never came home" link="More">
            {BECAUSE.map((entry) => (
              <Poster key={entry.code} entry={entry} shape="land" onOpen={() => setOpen(true)} />
            ))}
          </Rail>

          {/* ===== Free ===== */}
          <Rail title="Start free" link="What the membership includes">
            {FREE.map((entry) => (
              <Poster
                key={`${entry.code}-${entry.title}`}
                entry={entry}
                onOpen={() => setOpen(true)}
              />
            ))}
          </Rail>
        </main>
      </div>

      {/* ===================== FLOATING SESSION BAR ===================== */}
      <footer className="bar">
        <div className="th">
          <Art id="art-lot" />
        </div>
        <div className="info">
          <b>He never came home</b>
          <span>
            Case 001 · Workstation suspended at <code>Orbit</code>
          </span>
        </div>
        <div className="sp" />
        <div className="ctrl">
          <button type="button" aria-label="Previous case">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 5h2v14H6zM18 5l-9 7 9 7z" />
            </svg>
          </button>
          <button type="button" className="main" aria-label="Resume">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 4l14 8-14 8z" />
            </svg>
          </button>
          <button type="button" aria-label="Next case">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M16 5h2v14h-2zM6 5l9 7-9 7z" />
            </svg>
          </button>
        </div>
        <div className="sp" />
        <div className="st">2h 14m · NOVA session held</div>
        <button className="x" type="button" aria-label="Hide">
          ✕
        </button>
      </footer>

      {/* ===================== CASE BRIEF ===================== */}
      <div
        className={open ? 'modal open' : 'modal'}
        id="brief"
        role="dialog"
        aria-modal="true"
        aria-labelledby="brief-title"
        ref={modal}
        onClick={(event) => {
          if (event.target === event.currentTarget) close()
        }}
      >
        <div className="sheet">
          <div className="key">
            <div className="art">
              <Art id="art-lot" />
            </div>
            <div className="veil" />
            <button className="close" type="button" onClick={close}>
              Esc
            </button>
            <div className="ttl">
              <div className="code">
                <b>Case 001</b> · 24-118 · Missing person · The Marlow Files, 01
              </div>
              <h2 className="h" id="brief-title">
                He never came home
              </h2>
              <div className="cta">
                <Link
                  className="btn w"
                  href="/play"
                  onClick={() => track('case_opened', { caseId: 'case001' })}
                >
                  <PlayIcon />
                  Open workstation
                </Link>
                <button className="btn d" type="button">
                  Save to my cases
                </button>
              </div>
            </div>
          </div>
          <div className="grid">
            <div>
              <p className="lede">
                A woman arrives with her husband&apos;s laptop and phone. He has been missing for
                eight days. Two days later, his body is found.
              </p>
              <p>
                Find out what happened. Nothing tells you where to look. You search, connect, verify
                and file only what you can prove.
              </p>
              <p className="note">
                Fictional people and organizations throughout. Optional forensic services may become
                available during the case; every case can be closed without them.
              </p>
            </div>
            <dl>
              <dt>Provided at start</dt>
              <dd>Laptop image, locked phone, full name, photograph</dd>
              <dt>Surfaces</dt>
              <dd>Open web, email, files, phone, maps, public records</dd>
              <dt>Estimated</dt>
              <dd>2 to 4 hours</dd>
              <dt>Difficulty</dt>
              <dd>Moderate</dd>
              <dt>Access</dt>
              <dd>Free</dd>
              <dt>Closed by</dt>
              <dd>1,120 investigators</dd>
            </dl>
          </div>
        </div>
      </div>
    </>
  )
}

function Poster({
  entry,
  shape,
  onOpen,
}: {
  entry: Entry
  shape?: 'wide' | 'land'
  onOpen: () => void
}) {
  return (
    <button className={shape ? `poster ${shape}` : 'poster'} type="button" onClick={onOpen}>
      <div className="art">
        <Art id={entry.art} />
      </div>
      <div className="veil" />
      <span className="top">{entry.code}</span>
      {entry.stamp ? (
        <span className={entry.stamp.free ? 'stamp free' : 'stamp'}>{entry.stamp.label}</span>
      ) : null}
      <div className="body">
        <h4>{entry.title}</h4>
        {entry.hook ? <p className="hook">{entry.hook}</p> : null}
        <div className="k">{entry.meta}</div>
      </div>
      {entry.progress ? (
        <>
          <span className="play">
            <PlayIcon />
          </span>
          <div className="prog" style={{ '--p': entry.progress } as React.CSSProperties}>
            <i />
          </div>
        </>
      ) : null}
    </button>
  )
}

function Rail({
  title,
  link,
  arrows,
  children,
}: {
  title: string
  link: string
  arrows?: boolean
  children: React.ReactNode
}) {
  const track = useRef<HTMLDivElement>(null)
  const by = (amount: number) => track.current?.scrollBy({ left: amount, behavior: 'smooth' })

  return (
    <section className="rail">
      <div className="rowhead">
        <h2>{title}</h2>
        <a href="#">
          {link}
          <ArrowIcon />
        </a>
        {arrows ? (
          <>
            <span className="sp" />
            <div className="arrows">
              <button type="button" aria-label="Scroll left" onClick={() => by(-560)}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M15 6l-6 6 6 6" />
                </svg>
              </button>
              <button type="button" aria-label="Scroll right" onClick={() => by(560)}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>
            </div>
          </>
        ) : null}
      </div>
      <div className="track" ref={track}>
        {children}
      </div>
    </section>
  )
}
