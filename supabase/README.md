# Supabase

Apply migrations with the Supabase CLI:

```bash
supabase link --project-ref <ref>
supabase db push
```

Everything here is row-level secured:

- `profiles`, `timelines`, `timeline_events` — a player reads and writes only their own rows.
- `billing_customers`, `subscriptions` — readable by their owner, **writable only by the service
  role** (the Stripe webhook). A client can never grant itself entitlement.
- `billing_events` — no policies at all; it is the webhook's idempotency ledger.

The anon key is the only Supabase credential that reaches the browser. `SUPABASE_SERVICE_ROLE_KEY`
is read exclusively by `lib/supabase/admin.ts`, which is `server-only`.

Because the anon key is public, **RLS is the real boundary** — a client can talk to PostgREST
directly and skip the route handlers entirely. So the schema, not the API layer, carries the
limits: `timelines.snapshot` is capped at 512 KB by a check constraint, `timeline_events` has no
insert policy until something actually writes to it, and `billing_customers` accepts a
self-insert but never an update, so entitlement stays writable only by the webhook's service
role.

`prune_billing_events()` should be run on a schedule (pg_cron, or any daily job) **as the service
role**; Stripe stops retrying long before the 30-day window it keeps.

Both `SECURITY DEFINER` functions have `EXECUTE` revoked from `public`, `anon` and
`authenticated`, and the schema's default privileges revoke it for future ones too. Supabase
exposes every `public` function at `/rest/v1/rpc/<name>`, so without that revoke anyone holding
the publishable key could call `prune_billing_events()` and empty the idempotency ledger —
after which previously-processed Stripe events replay as new. Supabase's own database linter
found this; `tests/e2e/supabase.spec.ts` now asserts it stays fixed.

`billing_events` has RLS enabled with **no policies at all**, which the linter reports as INFO.
That is deliberate: it is fail-closed, and only the webhook's service role touches it.
