'use client'

import { useContent } from '../GameContext'

/**
 * Read-only on Day 01. Cash lives in the bank; this is where investments will live, and the
 * player is told exactly why they cannot act yet.
 */
export function QuotelineApp() {
  const content = useContent()
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
        </div>
        {content.economy.quotes.map((q) => (
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
          </div>
        ))}
      </div>
      <div className="hal-mkt__notice">
        {content.economy.brokerageNotice} <span>{content.economy.brokerageMinimum}</span>
      </div>
    </div>
  )
}
