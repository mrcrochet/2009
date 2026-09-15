'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { track } from '@/lib/analytics'
import { selectReportSummary } from '@/engine/selectors'
import { useContent, useInvestigation } from './GameContext'
import { useFocusTrap } from './useFocusTrap'

/**
 * The commercial boundary lives here, and only here. Nothing before this point has asked the
 * player for anything.
 */
export function ReportCard() {
  const content = useContent()
  const router = useRouter()
  const show = useInvestigation((s) => s.ui.reportCard)
  const investigationId = useInvestigation((s) => s.id)
  const summary = useInvestigation((s) => selectReportSummary(s, content))
  const panelRef = useRef<HTMLDivElement>(null)
  useFocusTrap(panelRef, show)

  useEffect(() => {
    if (show) track('save_prompt_viewed', {})
  }, [show])

  if (!show) return null

  const caseLabel = `Case ${String(content.number).padStart(3, '0')}`
  const next = `/account?claim=${encodeURIComponent(investigationId)}`

  return (
    <div className="hal-daycard" data-testid="report-card">
      <div
        className="hal-daycard__inner"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${caseLabel} — session complete`}
        tabIndex={-1}
      >
        <div className="hal-daycard__ts">{summary.timestamp}</div>
        <h1 className="hal-daycard__title">{content.report.title}</h1>
        <div className="hal-daycard__stats" role="status">
          <span>
            {caseLabel} · {content.title}
          </span>
          <span>Filed for {content.client}</span>
          <span>
            In the file: {summary.evidenceCount} · Filed on the record: {summary.claimCount}
          </span>
          {summary.changed ? <span className="shifted">{summary.exposedLine}</span> : null}
          <span className="watched">{summary.watchedLine}</span>
        </div>
        {summary.deeds.length > 0 ? (
          <div className="hal-daycard__deeds">
            {summary.deeds.map((deed) => (
              <span key={deed}>{deed}</span>
            ))}
          </div>
        ) : null}
        <div className="hal-daycard__rule" />
        <div className="hal-daycard__block">
          <div className="hal-daycard__headline">{content.report.saveHeadline}</div>
          <div className="hal-daycard__body">{content.report.saveBody}</div>
          <div className="hal-daycard__ctas">
            <button
              type="button"
              className="hal-cta"
              data-testid="save-investigation"
              onClick={() => {
                track('paywall_viewed', { caseId: content.id })
                router.push(next)
              }}
            >
              {content.report.primaryCta}
            </button>
            <button
              type="button"
              className="hal-cta hal-cta--ghost"
              onClick={() =>
                router.push(`/auth/sign-in?claim=${encodeURIComponent(investigationId)}`)
              }
            >
              {content.report.secondaryCta}
            </button>
          </div>
          <div className="hal-daycard__price">{content.report.priceLine}</div>
        </div>
      </div>
    </div>
  )
}
