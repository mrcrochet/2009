'use client'

import { formatMoney } from '@/engine/money'
import { selectLedger } from '@/engine/selectors'
import { useContent, useTimeline } from '../GameContext'
import { PinButton } from '../PinButton'

export function BankApp() {
  const content = useContent()
  const cash = useTimeline((s) => formatMoney(s.cashCents))
  const ledger = useTimeline((s) => selectLedger(s, content))

  return (
    <div className="hal-bank">
      <div className="hal-bank__head">
        <span className="hal-bank__brand">{content.economy.bankName}</span>
        <span className="hal-bank__online">Online Banking</span>
      </div>
      <div className="hal-bank__balance">
        <div className="hal-bank__acct">{content.economy.accountLabel}</div>
        <div className="hal-bank__amount" data-testid="bank-balance">
          {cash}
        </div>
        <div className="hal-bank__sub">{content.economy.accountOpened}</div>
        <PinButton evidenceId="e4" via="bank" />
      </div>
      <div className="hal-bank__activity">
        <div className="hal-bank__label" id="hal-bank-activity">
          RECENT ACTIVITY
        </div>
        <div role="table" aria-labelledby="hal-bank-activity">
          <div className="hal-sr-only" role="row">
            <span role="columnheader">Date</span>
            <span role="columnheader">Description</span>
            <span role="columnheader">Amount</span>
          </div>
          {ledger.map((t) => (
            <div key={t.id} className="hal-bank__txn" role="row">
              <span className="hal-bank__date" role="cell">
                {t.date}
              </span>
              <span className="hal-bank__desc" role="cell">
                {t.label}
                {t.evidenceId ? <PinButton evidenceId={t.evidenceId} via="bank" size="row" /> : null}
              </span>
              <span
                className={`hal-bank__amt${t.credit ? ' hal-bank__amt--credit' : ''}`}
                role="cell"
              >
                {t.amount}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
