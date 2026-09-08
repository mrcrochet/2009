'use client'

import { useContent, useDispatch, useTimeline } from '../GameContext'

/**
 * Read-only on Day 01: placing an order needs a $2,000 deposit against a balance that peaks at
 * $717.82. Six tickers the player has memories about and no way to act on them is good drama and
 * a dead app, so the terminal offers the one thing it costs nothing to do — writing down what
 * you already know. On a machine someone else is reading.
 */
export function QuotelineApp() {
  const content = useContent()
  const dispatch = useDispatch()
  const watchlist = useTimeline((s) => s.watchlist)

  return (
    <div className="hal-mkt">
      <div className="hal-mkt__head">
        <span>QUOTELINE TERMINAL</span>
        <span>15 JAN 2009 · DELAYED 20 MIN</span>
      </div>
      <div role="table" aria-label="Delayed quotes">
        <div className="hal-sr-only" role="row">
          <span role="columnheader">Symbol</span>
          <span role="columnheader">Company</span>
          <span role="columnheader">Last</span>
          <span role="columnheader">Change</span>
          <span role="columnheader">Watchlist</span>
        </div>
        {content.economy.quotes.map((q) => {
          const watched = watchlist.includes(q.symbol)
          return (
            <div key={q.symbol} className="hal-mkt__row" role="row">
              <span className="hal-mkt__sym" role="cell">
                {q.symbol}
              </span>
              <span className="hal-mkt__name" role="cell">
                {q.name}
              </span>
              <span className="hal-mkt__px" role="cell">
                {q.price}
              </span>
              <span
                className={`hal-mkt__chg${q.direction === 'up' ? ' hal-mkt__chg--up' : ''}`}
                role="cell"
              >
                {q.change}
              </span>
              <span role="cell">
                <button
                  type="button"
                  className="hal-mkt__watch"
                  data-watch={q.symbol}
                  aria-pressed={watched}
                  aria-label={
                    watched
                      ? `Remove ${q.symbol} from the watchlist`
                      : `Add ${q.symbol} to the watchlist`
                  }
                  onClick={() => dispatch({ type: 'WATCHLIST_TOGGLED', symbol: q.symbol })}
                >
                  {watched ? 'ON LIST' : 'WATCH'}
                </button>
              </span>
            </div>
          )
        })}
      </div>
      <div className="hal-mkt__notice">
        {content.economy.brokerageNotice} <span>{content.economy.brokerageMinimum}</span>
      </div>
    </div>
  )
}
