-- Billing correctness and storage limits.
--
-- Three problems this fixes, in order of how much they cost a real customer:
--   1. A webhook handler that threw after its event id was recorded could never be retried —
--      Stripe's retry hit the duplicate branch and was acknowledged without applying anything.
--      A single transient blip during `customer.subscription.created` meant a paying customer
--      silently never got entitlement.
--   2. `ensureCustomer` wrote to `billing_customers` through the user's own client, which has
--      SELECT only. The write was denied, the error discarded, and a fresh Stripe customer
--      created on every checkout attempt — which also defeats per-customer promotion limits.
--   3. Snapshots were unbounded, and the anon key lets a client write to `timelines` directly.

-- 1 ---------------------------------------------------------------------------
-- Record the event, then mark it processed. A duplicate that was never processed is a retry
-- worth honouring, not a replay to acknowledge.
alter table public.billing_events
  add column if not exists processed_at timestamptz;

-- Existing rows predate this column and were, by construction, processed.
update public.billing_events set processed_at = received_at where processed_at is null;

create index if not exists billing_events_unprocessed_idx
  on public.billing_events (received_at)
  where processed_at is null;

-- 2 ---------------------------------------------------------------------------
-- The webhook is still the only writer of entitlement. This lets checkout persist the customer
-- mapping it just created, and nothing else: a row may be inserted for yourself, once, and
-- never updated or deleted from the client.
create policy "customers are self-insertable once"
  on public.billing_customers for insert
  to authenticated
  with check (auth.uid() = user_id);

-- 3 ---------------------------------------------------------------------------
-- A save is a day of play, not a file host. 512 KB is roughly sixty times the measured size of
-- a completed Day 01.
alter table public.timelines
  add constraint timelines_snapshot_size
  check (pg_column_size(snapshot) <= 524288);

-- `timeline_events` is reserved for a future append-only log. Until something writes to it, an
-- insert policy is a storage-abuse surface with no product behind it.
drop policy if exists "events are insertable into own timelines" on public.timeline_events;

-- Stripe stops retrying long before this. Keeping the ledger forever only grows the table.
create or replace function public.prune_billing_events()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.billing_events
  where received_at < now() - interval '30 days'
    and processed_at is not null;
$$;
