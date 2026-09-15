/**
 * The full product event vocabulary. Payloads are deliberately narrow: note contents, search
 * queries, message drafts and any other free text the player writes never appear here.
 */
export interface AnalyticsEvents {
  landing_viewed: Record<string, never>
  case_opened: { caseId: string }
  boot_completed: { durationMs: number }
  first_message_seen: Record<string, never>
  readme_opened: Record<string, never>
  app_opened: { app: string }
  device_unlocked: { deviceId: string }
  /** The grant itself is server-side. This records that the player could see what it opened. */
  service_granted: { serviceId: string }
  evidence_pinned: { evidenceId: string; via: string; total: number }
  claim_asserted: { claimId: string; verdict: string; evidenceCount: number }
  case_requirements_completed: { minute: number }
  case_completed: {
    evidenceCount: number
    claimsOnRecord: number
    exposure: number
    changed: boolean
  }
  save_prompt_viewed: Record<string, never>
  signup_completed: { claimedInvestigation: boolean }
  paywall_viewed: { caseId: string }
  checkout_started: { priceId: string }
  subscription_activated: { priceId: string }
}

export type AnalyticsEventName = keyof AnalyticsEvents
