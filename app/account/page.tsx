import Link from 'next/link'
import { getPlans, isBillingConfigured } from '@/lib/billing/plans'
import { getServerEntitlement } from '@/lib/billing/entitlement'
import { getCurrentUser } from '@/lib/supabase/server'
import { listServerInvestigations } from '@/lib/supabase/investigations'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { ClaimTimeline } from './ClaimTimeline'
import { BillingActions } from './BillingActions'
import styles from './account.module.css'

interface Props {
  searchParams: Promise<{
    claim?: string
    case?: string
    service?: string
    upgrade?: string
    checkout?: string
    soon?: string
  }>
}

export const dynamic = 'force-dynamic'

/**
 * The save / account / subscription surface. Reached only after Case 001 has earned the ask.
 * Entitlement is resolved here on the server; the client renders the answer.
 */
export default async function AccountPage({ searchParams }: Props) {
  const { claim, case: caseId, service, upgrade, checkout, soon } = await searchParams
  const user = await getCurrentUser()
  const entitlement = await getServerEntitlement(user?.id ?? null)
  const investigations = user ? await listServerInvestigations(user.id) : []
  const plans = getPlans()

  return (
    <main className={styles.root}>
      <div className={styles.inner}>
        <div className={styles.eyebrow}>unlisted · account</div>
        <h1 className={styles.title}>
          {user ? 'Your investigations' : 'Keep the investigation you just ran'}
        </h1>

        {checkout === 'cancelled' ? (
          <div className={styles.notice}>Checkout was cancelled. Nothing was charged.</div>
        ) : null}
        {soon ? (
          <div className={styles.notice}>
            {caseId ? `Case ${caseId} is not written yet.` : 'That case is not written yet.'} Your
            investigation is safe where it is.
          </div>
        ) : null}

        {!user ? (
          <section className={styles.card}>
            <div className={styles.cardTitle}>Save this investigation — free</div>
            <p className={styles.body}>
              Case 001 lives in this browser only. Create an account and the file you built moves
              with you — and the rest of the case library opens.
            </p>
            <div className={styles.row}>
              <Link
                className="hal-cta"
                href={`/auth/sign-in${claim ? `?claim=${encodeURIComponent(claim)}` : ''}`}
              >
                CREATE AN ACCOUNT
              </Link>
              <Link className="hal-cta hal-cta--ghost" href="/play">
                Abandon this one and start again
              </Link>
            </div>
            {!isSupabaseConfigured() ? (
              <div className={styles.mono}>
                Accounts are not configured in this environment. Your investigation is still
                saved locally and Case 001 remains fully playable.
              </div>
            ) : null}
          </section>
        ) : (
          <>
            <ClaimTimeline investigationId={claim ?? null} />

            <section className={styles.card}>
              <div className={styles.cardTitle}>Subscription</div>
              <div className={styles.mono}>
                Status:{' '}
                {/* `active (active)` reads like a bug. Only say the raw status when it differs. */}
                {entitlement.active
                  ? entitlement.status === 'active'
                    ? 'active'
                    : `active (${entitlement.status})`
                  : 'no active subscription'}
                {entitlement.currentPeriodEnd
                  ? ` · renews ${new Date(entitlement.currentPeriodEnd).toLocaleDateString('en-US')}`
                  : ''}
              </div>
              {upgrade && !entitlement.active ? (
                <div className={styles.notice}>
                  That case needs full access. Case 001 stays free, always.
                </div>
              ) : null}
              {service ? (
                <div className={styles.notice}>
                  Forensic recovery is sold separately and is never needed to close a case. It is
                  not part of a subscription, and buying it charges a real card.
                </div>
              ) : null}
              <BillingActions
                plans={plans.map((p) => ({
                  id: p.id,
                  name: p.name,
                  blurb: p.blurb,
                  displayPrice: p.displayPrice,
                  purchasable: Boolean(p.priceId),
                }))}
                entitled={entitlement.active}
                configured={isBillingConfigured()}
                investigationId={claim ?? null}
              />
            </section>

            <section className={styles.card}>
              <div className={styles.cardTitle}>Investigations</div>
              {investigations.length === 0 ? (
                <div className={styles.mono}>No cloud investigations yet.</div>
              ) : (
                <div className={styles.investigations}>
                  {investigations.map((t) => (
                    <Link
                      key={t.id}
                      className={styles.investigation}
                      href={`/play/${t.id}?case=${encodeURIComponent(t.caseId)}`}
                    >
                      <span>{t.caseId}</span>
                      <span>{new Date(t.updatedAt).toLocaleString('en-US')}</span>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        <Link className={styles.back} href="/">
          ← back
        </Link>
      </div>
    </main>
  )
}
