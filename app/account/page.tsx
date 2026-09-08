import Link from 'next/link'
import { getPlans, isBillingConfigured } from '@/lib/billing/plans'
import { getServerEntitlement } from '@/lib/billing/entitlement'
import { getCurrentUser } from '@/lib/supabase/server'
import { listServerTimelines } from '@/lib/supabase/timelines'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { ClaimTimeline } from './ClaimTimeline'
import { BillingActions } from './BillingActions'
import styles from './account.module.css'

interface Props {
  searchParams: Promise<{ claim?: string; day?: string; upgrade?: string; checkout?: string; soon?: string }>
}

export const dynamic = 'force-dynamic'

/**
 * The save / account / subscription surface. Reached only after Day 01 has earned the ask.
 * Entitlement is resolved here on the server; the client renders the answer.
 */
export default async function AccountPage({ searchParams }: Props) {
  const { claim, day, upgrade, checkout, soon } = await searchParams
  const user = await getCurrentUser()
  const entitlement = await getServerEntitlement(user?.id ?? null)
  const timelines = user ? await listServerTimelines(user.id) : []
  const plans = getPlans()
  const nextDay = Number(day ?? 2) || 2

  return (
    <main className={styles.root}>
      <div className={styles.inner}>
        <div className={styles.eyebrow}>2009 · account</div>
        <h1 className={styles.title}>
          {user ? 'Your timelines' : 'Keep the 2009 you just made'}
        </h1>

        {checkout === 'cancelled' ? (
          <div className={styles.notice}>Checkout was cancelled. Nothing was charged.</div>
        ) : null}
        {soon ? (
          <div className={styles.notice}>
            Day {String(nextDay).padStart(2, '0')} is not written yet. Your timeline is safe where it is.
          </div>
        ) : null}

        {!user ? (
          <section className={styles.card}>
            <div className={styles.cardTitle}>Save this timeline — free</div>
            <p className={styles.body}>
              Day 01 lives in this browser only. Create an account and the version of 2009 you
              made moves with you — and Day 02 becomes available to unlock.
            </p>
            <div className={styles.row}>
              <Link
                className="hal-cta"
                href={`/auth/sign-in${claim ? `?claim=${encodeURIComponent(claim)}` : ''}`}
              >
                CREATE AN ACCOUNT
              </Link>
              <Link className="hal-cta hal-cta--ghost" href="/play">
                Start a new timeline instead
              </Link>
            </div>
            {!isSupabaseConfigured() ? (
              <div className={styles.mono}>
                Accounts are not configured in this environment. Your timeline is still saved
                locally and Day 01 remains fully playable.
              </div>
            ) : null}
          </section>
        ) : (
          <>
            <ClaimTimeline timelineId={claim ?? null} />

            <section className={styles.card}>
              <div className={styles.cardTitle}>Subscription</div>
              <div className={styles.mono}>
                Status: {entitlement.active ? `active (${entitlement.status})` : 'no active subscription'}
                {entitlement.currentPeriodEnd
                  ? ` · renews ${new Date(entitlement.currentPeriodEnd).toLocaleDateString('en-US')}`
                  : ''}
              </div>
              {upgrade && !entitlement.active ? (
                <div className={styles.notice}>
                  Day {String(nextDay).padStart(2, '0')} needs full access. Day 01 stays free, always.
                </div>
              ) : null}
              <BillingActions
                plans={plans.map((p) => ({ id: p.id, name: p.name, blurb: p.blurb, displayPrice: p.displayPrice, purchasable: Boolean(p.priceId) }))}
                entitled={entitlement.active}
                configured={isBillingConfigured()}
                timelineId={claim ?? null}
              />
            </section>

            <section className={styles.card}>
              <div className={styles.cardTitle}>Timelines</div>
              {timelines.length === 0 ? (
                <div className={styles.mono}>No cloud timelines yet.</div>
              ) : (
                <div className={styles.timelines}>
                  {timelines.map((t) => (
                    <Link key={t.id} className={styles.timeline} href={`/play/${t.id}?day=${t.day}`}>
                      <span>Day {String(t.day).padStart(2, '0')}</span>
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
