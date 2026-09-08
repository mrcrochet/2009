import { expect, test } from '@playwright/test'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  ''
const configured = Boolean(SUPABASE_URL && SUPABASE_KEY)

/**
 * Integration checks against a real project. Skipped when nothing is configured — which is how
 * CI runs, on purpose: the game has to build and play with no service behind it, and the rest of
 * the suite proves that. These run locally once `.env.local` has credentials.
 */
test.describe('Supabase', () => {
  test.skip(!configured, 'no Supabase project configured')

  test('the auth surfaces know they have a backend', async ({ page }) => {
    await page.goto('/auth/sign-in')
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByRole('button', { name: 'SEND THE LINK' })).toBeVisible()
    await expect(page.getByText('Accounts are not configured here')).toHaveCount(0)

    await page.goto('/account')
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Keep the 2009 you just made',
    )
  })

  test('Day 01 is still free and account-free', async ({ page }) => {
    await page.goto('/play')
    await expect(page.getByTestId('desktop')).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('[data-app="msg"]')).toBeVisible({ timeout: 10_000 })
  })

  test('RLS is the boundary, not the route handler', async ({ request }) => {
    // The publishable key is public by design, so anyone can reach PostgREST directly. An
    // anonymous read of every table must see nothing rather than everything.
    for (const table of ['timelines', 'profiles', 'subscriptions', 'billing_customers']) {
      const res = await request.get(`${SUPABASE_URL}/rest/v1/${table}?select=*`, {
        headers: { apikey: SUPABASE_KEY, authorization: `Bearer ${SUPABASE_KEY}` },
      })
      expect(res.status(), table).toBe(200)
      expect(await res.json(), table).toEqual([])
    }
  })

  test('the definer functions are not callable over REST', async ({ request }) => {
    // prune_billing_events would empty the webhook idempotency ledger, after which processed
    // Stripe events replay as new.
    for (const fn of [
      'prune_billing_events',
      'handle_new_user',
      'prune_orphan_wayup_snapshots',
      'future_evidence_cap',
    ]) {
      const res = await request.post(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
        headers: {
          apikey: SUPABASE_KEY,
          authorization: `Bearer ${SUPABASE_KEY}`,
          'content-type': 'application/json',
        },
        data: {},
      })
      expect(res.status(), fn).toBeGreaterThanOrEqual(400)
    }
  })

  test('the Way Up cache is shared for storage, never for reading', async ({ request }) => {
    // A snapshot has no owner — it is deduplicated across timelines. Ownership is borrowed from
    // the visits that reference it, so an anonymous read must see nothing. Without that policy
    // `select=*` on a public key would be a free scraped-web API, a record of what every player
    // looked up, and a spoiler table for a game whose subject is discovery.
    for (const table of [
      'wayup_snapshots',
      'timeline_wayup_visits',
      'future_evidence',
      'mystery_unlocks',
      'global_mystery_fragments',
    ]) {
      const res = await request.get(`${SUPABASE_URL}/rest/v1/${table}?select=*`, {
        headers: { apikey: SUPABASE_KEY, authorization: `Bearer ${SUPABASE_KEY}` },
      })
      expect(res.status(), table).toBe(200)
      expect(await res.json(), table).toEqual([])
    }
  })

  test('a snapshot cannot be forged by a client', async ({ request }) => {
    // Only the relay route, holding the service role, has actually fetched a page and computed
    // its hash. A client-writable cache would let one player author a document another player
    // reads inside the game's own renderer.
    const res = await request.post(`${SUPABASE_URL}/rest/v1/wayup_snapshots`, {
      headers: {
        apikey: SUPABASE_KEY,
        authorization: `Bearer ${SUPABASE_KEY}`,
        'content-type': 'application/json',
      },
      data: {
        id: 'wu_forged00000000000000000000000',
        canonical_url: 'https://example.com/',
        content_hash: 'f'.repeat(64),
        remote_fetched_at: new Date().toISOString(),
        provider: 'forged',
      },
    })
    expect(res.status()).toBeGreaterThanOrEqual(400)
  })

  test('the shared mystery count is public, and the ledger behind it is not', async ({
    request,
  }) => {
    const shared = await request.get(`${SUPABASE_URL}/rest/v1/global_mystery_state?select=*`, {
      headers: { apikey: SUPABASE_KEY, authorization: `Bearer ${SUPABASE_KEY}` },
    })
    // "7 / 9" is the point of a shared puzzle, and the row carries no personal data.
    expect(shared.status()).toBe(200)

    const write = await request.post(`${SUPABASE_URL}/rest/v1/global_mystery_state`, {
      headers: {
        apikey: SUPABASE_KEY,
        authorization: `Bearer ${SUPABASE_KEY}`,
        'content-type': 'application/json',
      },
      data: { mystery_id: 'forged', fragments_required: 1, fragments_found: 999 },
    })
    expect(write.status()).toBeGreaterThanOrEqual(400)
  })

  test('a save cannot be used as a file host', async ({ request }) => {
    const res = await request.post(`${SUPABASE_URL}/rest/v1/timelines`, {
      headers: {
        apikey: SUPABASE_KEY,
        authorization: `Bearer ${SUPABASE_KEY}`,
        'content-type': 'application/json',
      },
      data: { id: '00000000-0000-4000-8000-000000000000', snapshot: { pad: 'x'.repeat(600_000) } },
    })
    // Refused by RLS before the size constraint is even reached — both are doing their job.
    expect(res.status()).toBeGreaterThanOrEqual(400)
  })
})
