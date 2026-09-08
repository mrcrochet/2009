-- 2009 — core schema.
-- Every table is row-level-secured. A player can only ever see their own rows, and billing
-- state is written exclusively by the Stripe webhook using the service role.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- profiles

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are self-readable"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles are self-writable"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles are self-updatable"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, split_part(coalesce(new.email, ''), '@', 1))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- --------------------------------------------------------------- timelines

create table if not exists public.timelines (
  id uuid primary key,
  user_id uuid references auth.users (id) on delete cascade,
  schema_version int not null default 1,
  day int not null default 1,
  snapshot jsonb not null,
  last_event_seq bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists timelines_user_updated_idx
  on public.timelines (user_id, updated_at desc);

alter table public.timelines enable row level security;

create policy "timelines are self-readable"
  on public.timelines for select
  using (auth.uid() = user_id);

create policy "timelines are self-insertable"
  on public.timelines for insert
  with check (auth.uid() = user_id);

create policy "timelines are self-updatable"
  on public.timelines for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "timelines are self-deletable"
  on public.timelines for delete
  using (auth.uid() = user_id);

-- --------------------------------------------------------- timeline events

create table if not exists public.timeline_events (
  timeline_id uuid not null references public.timelines (id) on delete cascade,
  seq bigint not null,
  event_type text not null,
  payload jsonb not null,
  occurred_at timestamptz not null default now(),
  primary key (timeline_id, seq)
);

alter table public.timeline_events enable row level security;

create policy "events follow their timeline"
  on public.timeline_events for select
  using (
    exists (
      select 1 from public.timelines t
      where t.id = timeline_events.timeline_id and t.user_id = auth.uid()
    )
  );

create policy "events are insertable into own timelines"
  on public.timeline_events for insert
  with check (
    exists (
      select 1 from public.timelines t
      where t.id = timeline_events.timeline_id and t.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------- billing

create table if not exists public.billing_customers (
  user_id uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id text not null unique,
  created_at timestamptz not null default now()
);

alter table public.billing_customers enable row level security;

create policy "customers are self-readable"
  on public.billing_customers for select
  using (auth.uid() = user_id);
-- No insert/update policy: only the service role writes here.

create table if not exists public.subscriptions (
  user_id uuid not null references auth.users (id) on delete cascade,
  stripe_subscription_id text primary key,
  status text not null,
  price_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_user_idx on public.subscriptions (user_id);

alter table public.subscriptions enable row level security;

create policy "subscriptions are self-readable"
  on public.subscriptions for select
  using (auth.uid() = user_id);
-- Entitlement is written only by the Stripe webhook, via the service role.

-- Webhook idempotency ledger. Insert-before-handle; a duplicate id is a replay.
create table if not exists public.billing_events (
  id text primary key,
  type text not null,
  received_at timestamptz not null default now()
);

alter table public.billing_events enable row level security;
-- No policies at all: service role only.
