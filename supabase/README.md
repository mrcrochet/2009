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
