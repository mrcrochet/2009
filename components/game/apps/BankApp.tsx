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
        <div className="hal-bank__label">RECENT ACTIVITY</div>
        {ledger.map((t) => (
          <div key={t.id} className="hal-bank__txn">
            <span className="hal-bank__date">{t.date}</span>
            <span className="hal-bank__desc">{t.label}</span>
            {t.evidenceId ? <PinButton evidenceId={t.evidenceId} via="bank" size="row" /> : null}
            <span className={`hal-bank__amt${t.credit ? ' hal-bank__amt--credit' : ''}`}>
              {t.amount}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
