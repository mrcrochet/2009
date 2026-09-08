/**
 * The full product event vocabulary. Payloads are deliberately narrow: note contents, Recall
 * queries, message drafts and any other free text the player writes never appear here.
 */
export interface AnalyticsEvents {
  landing_viewed: Record<string, never>
  wake_clicked: Record<string, never>
  boot_completed: { durationMs: number }
  first_message_seen: Record<string, never>
  readme_opened: Record<string, never>
  app_opened: { app: string }
  recall_used: { confidence: string; matched: boolean; integrityAfter: number }
  evidence_pinned: { evidenceId: string; via: string; total: number }
  claim_asserted: { claimId: string; verdict: string; evidenceCount: number }
  money_action_started: { itemId: string }
  money_action_completed: { itemId: string; amountCents: number }
  day01_requirements_completed: { minuteOfDay: number }
  day01_completed: { cashCents: number; integrity: number; claimsOnRecord: number; shifted: boolean }
  save_prompt_viewed: Record<string, never>
  signup_completed: { claimedTimeline: boolean }
  paywall_viewed: { day: number }
  checkout_started: { priceId: string }
  subscription_activated: { priceId: string }
}

export type AnalyticsEventName = keyof AnalyticsEvents
