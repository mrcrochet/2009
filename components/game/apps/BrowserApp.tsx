'use client'

import type { Block } from '@/engine/content-schema'
import { formatMoney } from '@/engine/money'
import { selectPage, selectSearchResults } from '@/engine/selectors'
import { useContent, useDispatch, useTimeline } from '../GameContext'
import { PinButton } from '../PinButton'

export function BrowserApp() {
  const content = useContent()
  const dispatch = useDispatch()
  const browser = useTimeline((s) => s.browser)
  const results = useTimeline((s) => selectSearchResults(s, content))
  const page = useTimeline((s) => selectPage(s, content))

  const search = () => {
    if (!browser.query.trim()) return
    dispatch({ type: 'BROWSER_SEARCHED', query: browser.query })
  }

  return (
    <div className="hal-web">
      <div className="hal-web__toolbar">
        <button
          type="button"
          className="hal-web__back"
          aria-label="Back"
          disabled={browser.history.length === 0 && browser.view === 'home'}
          onClick={() => dispatch({ type: 'BROWSER_WENT_BACK' })}
        >
          ‹
        </button>
        <input
          className="hal-web__url"
          aria-label="Address"
          value={browser.url}
          onChange={(e) => dispatch({ type: 'BROWSER_URL_CHANGED', url: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') dispatch({ type: 'BROWSER_NAVIGATED', url: browser.url })
          }}
        />
        <span className="hal-web__engine">{content.browser.engineName}</span>
      </div>

      <div className="hal-scroll">
        {browser.view === 'home' ? (
          <div className="hal-web__home">
            <div className="hal-web__logo">
              corvid<span>.</span>
            </div>
            <div className="hal-web__searchrow">
              <input
                className="hal-web__q"
                aria-label="Search the web"
                value={browser.query}
                onChange={(e) => dispatch({ type: 'BROWSER_QUERY_CHANGED', query: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') search()
                }}
              />
              <button type="button" className="hal-web__go" onClick={search}>
                Search
              </button>
            </div>
            <div className="hal-web__homefoot">
              Web · Images · Groups · News · Mail — © 2009 Corvid Inc.
            </div>
          </div>
        ) : null}

        {browser.view === 'results' ? (
          <div className="hal-web__results">
            <div className="hal-web__resulthead">
              Results for <b>{browser.query}</b> — {results.length} found
            </div>
            {results.map((r) => (
              <div key={r.id} className="hal-web__result">
                <button
                  type="button"
                  className="hal-web__resulttitle"
                  disabled={!r.go}
                  onClick={() => r.go && dispatch({ type: 'BROWSER_NAVIGATED', url: r.go })}
                >
                  {r.title}
                </button>
                <div className="hal-web__resulturl">{r.url}</div>
                <div className="hal-web__resultsnip">{r.snippet}</div>
              </div>
            ))}
            {results.length === 0 ? (
              <div className="hal-web__empty">{content.browser.emptyResults}</div>
            ) : null}
          </div>
        ) : null}

        {browser.view === 'page' ? (
          <div
            className={`hal-web__page${page.dark ? ' hal-web__page--dark' : ''}`}
            style={{ background: page.background }}
          >
            {page.found ? (
              page.blocks.map((block, i) => <BlockView key={i} block={block} />)
            ) : (
              <div className="hal-web__p">
                {'The server at '}
                {browser.url}
                {' could not be found.\nCheck the address and try again.'}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function BlockView({ block }: { block: Block }) {
  switch (block.kind) {
    case 'heading':
      return (
        <div className="hal-web__block">
          <div className="hal-web__h" style={{ color: block.ink }}>
            {block.text}
          </div>
        </div>
      )
    case 'sub':
      return (
        <div className="hal-web__block">
          <div className="hal-web__sub">{block.text}</div>
        </div>
      )
    case 'rule':
      return (
        <div className="hal-web__block">
          <div className="hal-web__rule" />
        </div>
      )
    case 'p':
      return (
        <div className="hal-web__block">
          <div className="hal-web__p">{block.text}</div>
        </div>
      )
    case 'evidence':
      return (
        <div className="hal-web__block">
          <PinButton evidenceId={block.evidenceId} via="browser" />
        </div>
      )
    case 'listing':
      return (
        <div className="hal-web__block">
          <Listing block={block} />
        </div>
      )
    default:
      return null
  }
}

function Listing({ block }: { block: Extract<Block, { kind: 'listing' }> }) {
  const content = useContent()
  const dispatch = useDispatch()
  const domains = useTimeline((s) => s.domains)
  const inventory = useTimeline((s) => s.inventory)

  const opportunity = block.itemId
    ? content.economy.opportunities.find((o) => o.id === block.itemId)
    : undefined
  const held = block.itemId ? inventory.find((i) => i.id === block.itemId) : undefined
  const owned = block.action === 'domain' && block.itemId ? domains.includes(block.itemId) : false

  let label = 'CONTACT SELLER'
  let live = false
  let onClick: (() => void) | null = null

  if (block.action === 'domain' && block.itemId) {
    label = owned ? 'REGISTERED TO YOU' : 'REGISTER — 1 YEAR'
    live = !owned
    onClick = owned
      ? null
      : () =>
          dispatch({
            type: 'DOMAIN_REGISTERED',
            domain: block.itemId as string,
            amountCents: content.economy.domainPriceCents,
          })
  } else if (block.action === 'buy' && opportunity) {
    live = true
    if (!held) {
      label = 'BUY — MEET SELLER'
      onClick = () =>
        dispatch({
          type: 'ITEM_PURCHASED',
          itemId: opportunity.id,
          amountCents: opportunity.buyCents,
          label: opportunity.label,
        })
    } else if (held.state === 'held') {
      label = 'POST FOR RESALE'
      onClick = () => dispatch({ type: 'ITEM_LISTED', itemId: opportunity.id })
    } else if (held.state === 'listed') {
      label = 'LISTED — WAITING'
      live = false
    } else {
      label = `SOLD FOR ${formatMoney(held.soldFor ?? opportunity.sellCents)}`
      live = false
    }
  }

  return (
    <div className="hal-web__listing">
      <div className="hal-web__listingtop">
        <span className="hal-web__listingtitle">{block.title}</span>
        <span className="hal-web__listingprice">{block.price}</span>
      </div>
      <div className="hal-web__listingloc">{block.location}</div>
      <div className="hal-web__listingtext">{block.text}</div>
      <div>
        <button
          type="button"
          className={`hal-web__act${live ? ' hal-web__act--live' : ''}`}
          data-listing={block.itemId ?? block.title}
          disabled={!onClick}
          onClick={() => onClick?.()}
        >
          {label}
        </button>
      </div>
    </div>
  )
}
