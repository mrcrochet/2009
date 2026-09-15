'use client'

import type { Block } from '@/engine/case-schema'
import { selectPage, selectSearchResults } from '@/engine/selectors'
import type { AppId } from '@/engine/types'
import { normalizeUrl } from '@/engine/url'
import { artifactUrl, displayDate, siblingPages, type WorldArtifact } from '@/engine/world'
import { useContent, useDispatch, useInvestigation } from '../GameContext'
import { useWorldOptional } from '../WorldContext'
import { PinButton } from '../PinButton'

export function BrowserApp() {
  const content = useContent()
  const dispatch = useDispatch()
  const world = useWorldOptional()
  const browser = useInvestigation((s) => s.browser)
  const results = useInvestigation((s) => selectSearchResults(s, content))
  const page = useInvestigation((s) => selectPage(s, content))

  /**
   * The rest of the internet.
   *
   * A day authors the pages its story needs. Everything else the world holds — a classified from
   * November, a forum thread nobody links to, a funeral notice — lives in the corpus, and an
   * address written in one document has to lead somewhere or the web is a set of props.
   */
  const elsewhere = page.found ? null : (world?.index.artifactByUrl.get(browser.url) ?? null)

  const go = (url: string) =>
    dispatch({
      type: 'BROWSER_NAVIGATED',
      url,
      worldArtifactId: world?.index.artifactByUrl.get(normalizeUrl(url))?.id ?? null,
    })
  const search = () => {
    if (!browser.query.trim()) return
    dispatch({ type: 'BROWSER_SEARCHED', query: browser.query })
  }

  return (
    <div className="nova-web">
      <div className="nova-web__toolbar">
        <button
          type="button"
          className="nova-web__nav"
          aria-label="Back"
          disabled={browser.history.length === 0}
          onClick={() => dispatch({ type: 'BROWSER_WENT_BACK' })}
        >
          ‹
        </button>
        <button
          type="button"
          className="nova-web__nav"
          aria-label="Forward"
          disabled={browser.forward.length === 0}
          onClick={() => dispatch({ type: 'BROWSER_WENT_FORWARD' })}
        >
          ›
        </button>
        <button
          type="button"
          className="nova-web__nav nova-web__nav--home"
          aria-label="Home"
          onClick={() => go(content.browser.home)}
        >
          <svg viewBox="0 0 12 12" width="11" height="11" aria-hidden="true" focusable="false">
            <path
              d="M1 6L6 1.6L11 6M2.6 5.4V10.4H9.4V5.4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <input
          className="nova-web__url"
          aria-label="Address"
          spellCheck={false}
          value={browser.draftUrl ?? browser.url}
          onChange={(e) => dispatch({ type: 'BROWSER_URL_CHANGED', url: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') go(browser.draftUrl ?? browser.url)
          }}
        />
        <span className="nova-web__engine">{content.browser.engineName}</span>
      </div>

      {content.browser.bookmarks.length > 0 ? (
        <div className="nova-web__bookmarks">
          <span className="nova-web__bookmarkslabel">Bookmarks</span>
          {content.browser.bookmarks.map((b) => (
            <button
              key={b.url}
              type="button"
              className="nova-web__bookmark"
              data-bookmark={b.url}
              onClick={() => go(b.url)}
            >
              {b.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="nova-scroll">
        {browser.view === 'home' ? (
          <div className="nova-web__home">
            <div className="nova-web__logo">
              corvid<span>.</span>
            </div>
            <div className="nova-web__searchrow">
              <input
                className="nova-web__q"
                aria-label="Search the web"
                value={browser.query}
                onChange={(e) => dispatch({ type: 'BROWSER_QUERY_CHANGED', query: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') search()
                }}
              />
              <button type="button" className="nova-web__go" onClick={search}>
                Search
              </button>
            </div>
            <button
              type="button"
              className="nova-web__homelink"
              onClick={() => go(content.browser.directoryUrl)}
            >
              {content.browser.directoryLabel}
            </button>
            <div className="nova-web__homefoot">
              Web · Images · Groups · News · Mail — © 2009 Corvid Inc.
            </div>
          </div>
        ) : null}

        {browser.view === 'results' ? (
          <div className="nova-web__results">
            <div className="nova-web__resulthead">
              Results for <b>{browser.query}</b> — {results.length} found
            </div>
            {results.map((r) => (
              <div key={r.id} className="nova-web__result">
                <button
                  type="button"
                  className="nova-web__resulttitle"
                  disabled={!r.go}
                  onClick={() => r.go && go(r.go)}
                >
                  {r.title}
                </button>
                <div className="nova-web__resulturl">{r.url}</div>
                <div className="nova-web__resultsnip">{r.snippet}</div>
              </div>
            ))}
            {results.length === 0 ? (
              <div className="nova-web__empty">
                {content.browser.emptyResults}
                <div>
                  <button
                    type="button"
                    className="nova-web__inlinelink"
                    onClick={() => go(content.browser.directoryUrl)}
                  >
                    {content.browser.directoryLabel}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {browser.view === 'page' ? (
          <div
            className={`nova-web__page${page.dark ? ' nova-web__page--dark' : ''}`}
            style={{ background: page.background }}
          >
            {page.found ? (
              page.blocks.map((block, i) => <BlockView key={i} block={block} />)
            ) : elsewhere ? (
              <CorpusPage artifact={elsewhere} onGo={go} />
            ) : (
              <NotFound url={browser.url} />
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}

/**
 * A document from the corpus, rendered as the page it is.
 *
 * Deliberately plainer than an authored page. A day's pages are designed — a bank's palette, a
 * paper's masthead; these are the rest of the web, and in 2009 most of the web was black text on
 * white with the date at the top. Looking slightly unloved is correct, not a shortcut.
 */
function CorpusPage({ artifact, onGo }: { artifact: WorldArtifact; onGo: (url: string) => void }) {
  const world = useWorldOptional()
  const fields = Object.entries(artifact.fields)
  // The rest of the site. A page of somebody's GeoHost is never one page.
  const siblings = world ? siblingPages(world.index, artifact) : []
  /*
   * A receipt keeps its line breaks and a forum post does not.
   *
   * Corpus bodies are hard-wrapped in the source file, so honouring every newline would break a
   * man's account of his band splitting up mid-sentence, at whatever column the author's editor
   * happened to be set to. Indentation is what separates the two: a parking stub aligns its
   * columns, prose does not.
   *
   * Decided per paragraph, because one page is often both — a man writes two sentences about a
   * mailing list and then pastes in a table of everybody's pages.
   */
  const preformatted = (para: string) => /^[ \t]+\S/m.test(para)
  return (
    <div data-testid="web-corpus" data-artifact={artifact.id}>
      <div className="nova-web__h">{artifact.title || artifact.source}</div>
      <div className="nova-web__sub">
        {artifact.source} · {displayDate(artifact.date)}
      </div>
      <div className="nova-web__rule" style={{ margin: '12px 0' }} />
      {artifact.body
        .split(/\n{2,}/)
        .filter((para) => para.trim().length > 0)
        .map((para, i) => (
          <div
            key={i}
            className={preformatted(para) ? 'nova-web__pre' : 'nova-web__p'}
            style={preformatted(para) ? undefined : { whiteSpace: 'normal' }}
          >
            {preformatted(para) ? para : para.replace(/\s*\n\s*/g, ' ')}
          </div>
        ))}
      {siblings.length > 0 ? (
        <>
          <div className="nova-web__rule" style={{ margin: '12px 0' }} />
          <div className="nova-web__sitenav">
            {siblings.map((page) => {
              const url = artifactUrl(page)
              if (!url) return null
              return (
                <button
                  key={page.id}
                  type="button"
                  className="nova-web__navlink"
                  data-href={url}
                  onClick={() => onGo(url)}
                >
                  {page.title || url}
                </button>
              )
            })}
          </div>
        </>
      ) : null}
      {fields.length > 0 ? (
        <>
          <div className="nova-web__rule" style={{ margin: '12px 0' }} />
          <table className="nova-web__fields">
            <tbody>
              {fields.map(([key, value]) => (
                <tr key={key}>
                  <th scope="row">{key}</th>
                  <td>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : null}
    </div>
  )
}

function NotFound({ url }: { url: string }) {
  const content = useContent()
  const dispatch = useDispatch()
  return (
    <div data-testid="web-404">
      <div className="nova-web__h" style={{ color: '#7a0f0f' }}>
        {content.browser.notFoundTitle}
      </div>
      <div className="nova-web__sub">{url}</div>
      <div className="nova-web__rule" style={{ margin: '12px 0' }} />
      <div className="nova-web__p">{content.browser.notFoundBody}</div>
      <div style={{ marginTop: 12 }}>
        <button
          type="button"
          className="nova-web__inlinelink"
          onClick={() => dispatch({ type: 'BROWSER_NAVIGATED', url: content.browser.directoryUrl })}
        >
          {content.browser.directoryLabel}
        </button>
      </div>
    </div>
  )
}

function BlockView({ block }: { block: Block }) {
  const dispatch = useDispatch()

  switch (block.kind) {
    case 'heading':
      return (
        <div className="nova-web__block">
          <div className="nova-web__h" style={{ color: block.ink }}>
            {block.text}
          </div>
        </div>
      )
    case 'sub':
      return (
        <div className="nova-web__block">
          <div className="nova-web__sub">{block.text}</div>
        </div>
      )
    case 'subheading':
      return (
        <div className="nova-web__block">
          <div className="nova-web__h2" style={{ color: block.ink }}>
            {block.text}
          </div>
        </div>
      )
    case 'rule':
      return (
        <div className="nova-web__block">
          <div className="nova-web__rule" />
        </div>
      )
    case 'p':
      return (
        <div className="nova-web__block">
          <div className="nova-web__p">{block.text}</div>
        </div>
      )
    case 'nav':
      return (
        <div className="nova-web__block">
          <div className="nova-web__sitenav">
            {block.items.map((item) => (
              <button
                key={item.url}
                type="button"
                className="nova-web__navlink"
                data-href={item.url}
                onClick={() => dispatch({ type: 'BROWSER_NAVIGATED', url: item.url })}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )
    case 'link': {
      const dead = !block.url && !block.opensApp
      return (
        <div className="nova-web__block">
          <button
            type="button"
            className="nova-web__pagelink"
            data-href={block.url ?? block.opensApp ?? 'dead'}
            disabled={dead}
            onClick={() => {
              if (block.opensApp) {
                dispatch({ type: 'APP_OPENED', app: block.opensApp as AppId, viewport: measure() })
                return
              }
              if (block.url) dispatch({ type: 'BROWSER_NAVIGATED', url: block.url })
            }}
          >
            {block.label}
          </button>
          {block.note ? <span className="nova-web__linknote">{block.note}</span> : null}
        </div>
      )
    }
    case 'evidence':
      return (
        <div className="nova-web__block">
          <PinButton evidenceId={block.evidenceId} via="browser" />
        </div>
      )
    case 'listing':
      return (
        <div className="nova-web__block">
          <Listing block={block} />
        </div>
      )
    default:
      return null
  }
}

/**
 * A classified, as a document rather than as a transaction.
 *
 * It used to be a shop front: the block carried an `itemId`, the page knew about an economy, and
 * the button moved money. Buying things is not what this product is. What is left is what a
 * classified is actually for here — an address, a price and a person who can be found.
 */
function Listing({ block }: { block: Extract<Block, { kind: 'listing' }> }) {
  return (
    <div className="nova-web__listing">
      <div className="nova-web__listingtop">
        <span className="nova-web__listingtitle">{block.title}</span>
        <span className="nova-web__listingprice">{block.price}</span>
      </div>
      <div className="nova-web__listingloc">{block.location}</div>
      <div className="nova-web__listingtext">{block.text}</div>
    </div>
  )
}

function measure() {
  if (typeof window === 'undefined') return undefined
  return { width: window.innerWidth, height: window.innerHeight }
}
