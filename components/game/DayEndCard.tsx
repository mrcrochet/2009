'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { track } from '@/lib/analytics'
import { selectDaySummary } from '@/engine/selectors'
import { useContent, useTimeline } from './GameContext'

/**
 * The commercial boundary lives here, and only here. Nothing before this point has asked the
 * player for anything.
 */
export function DayEndCard() {
  const content = useContent()
  const router = useRouter()
  const show = useTimeline((s) => s.ui.dayCard)
  const timelineId = useTimeline((s) => s.id)
  const summary = useTimeline((s) => selectDaySummary(s, content))

  useEffect(() => {
    if (show) track('save_prompt_viewed', {})
  }, [show])

  if (!show) return null

  const next = `/account?claim=${encodeURIComponent(timelineId)}&day=${content.day + 1}`

  return (
    <div className="hal-daycard" role="dialog" aria-modal="true" aria-label="Day 01 complete" data-testid="day-card">
      <div className="hal-daycard__inner">
        <div className="hal-daycard__ts">{summary.timestamp}</div>
        <h1 className="hal-daycard__title">{content.dayEnd.title}</h1>
        <div className="hal-daycard__stats">
          <span>
            Balance: {summary.balance} · Quota {String(content.day).padStart(2, '0')}: {summary.quota} ·{' '}
            {summary.daysLeft} days left
          </span>
          <span>Memory coherence: {summary.integrity}</span>
          <span>Claims on record: {summary.claimCount}</span>
          {summary.holdings.length > 0 ? <span>Held: {summary.holdings.join(' · ')}</span> : null}
          {summary.shifted ? <span className="shifted">{summary.shiftedLine}</span> : null}
          <span className="watched">{summary.watchedLine}</span>
        </div>
        <div className="hal-daycard__rule" />
        <div className="hal-daycard__block">
          <div className="hal-daycard__headline">{content.dayEnd.saveHeadline}</div>
          <div className="hal-daycard__body">{content.dayEnd.saveBody}</div>
          <div className="hal-daycard__ctas">
            <button
              type="button"
              className="hal-cta"
              data-testid="continue-timeline"
              onClick={() => {
                track('paywall_viewed', { day: content.day + 1 })
                router.push(next)
              }}
            >
              {content.dayEnd.primaryCta}
            </button>
            <button
              type="button"
              className="hal-cta hal-cta--ghost"
              onClick={() => router.push(`/auth/sign-in?claim=${encodeURIComponent(timelineId)}`)}
            >
              {content.dayEnd.secondaryCta}
            </button>
          </div>
          <div className="hal-daycard__price">{content.dayEnd.priceLine}</div>
        </div>
      </div>
    </div>
  )
}
