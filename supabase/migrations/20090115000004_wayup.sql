-- The Way Up Machine — persistence for a real-web relay reached from inside 2009.
--
-- The engine is event-sourced and replayable; the live web is not. A page observed inside a
-- timeline is captured once as an immutable snapshot and referenced by id from then on, so a
-- save reproduces the bytes the player actually read rather than whatever the site says today.
--
-- The security problem here is different from the rest of the schema. Every other table has an
-- owner. A snapshot does not: it is deduplicated across timelines so two players reading the
-- same page do not store it twice. That makes the cache *shared for storage* — and it must not
-- become shared for reading, because the publishable key is public and PostgREST is reachable
-- directly. See the select policy, which sits below the visits table because it depends on it.

-- ------------------------------------------------------------------ snapshots

create table if not exists public.wayup_snapshots (
  -- Derived by lib/wayup from the canonical URL and the content hash, so the same unchanged
  -- page yields the same id and a changed page yields a new one. Two ids for one URL is the
  -- whole temporal-checksum beat, with no extra bookkeeping.
  id text primary key
    constraint wayup_snapshots_id_len check (char_length(id) between 16 and 128),

  canonical_url text not null
    constraint wayup_snapshots_url_len check (char_length(canonical_url) <= 2048),

  -- SHA-256 over the normalised content, hex. Fixing the length forces a real hash rather than
  -- an arbitrary label, which matters because the change-detection mechanic compares these.
  content_hash text not null
    constraint wayup_snapshots_hash_len check (char_length(content_hash) = 64),

  title text not null default ''
    constraint wayup_snapshots_title_len check (char_length(title) <= 512),

  -- When the remote host actually answered, not when we wrote the row.
  remote_fetched_at timestamptz not null,

  -- Normalised blocks, never third-party HTML. The client renders these with HALCYON's own
  -- renderer, so no remote markup ever reaches the game's origin.
  blocks jsonb not null default '[]'::jsonb
    constraint wayup_snapshots_blocks check (
      jsonb_typeof(blocks) = 'array' and pg_column_size(blocks) <= 1048576
    ),

  -- The CASE is not decoration: jsonb_array_length raises on a non-array, and Postgres does not
  -- promise to evaluate the type test first.
  outgoing_links jsonb not null default '[]'::jsonb
    constraint wayup_snapshots_links check (
      case
        when jsonb_typeof(outgoing_links) = 'array'
        then jsonb_array_length(outgoing_links) <= 512
             and pg_column_size(outgoing_links) <= 131072
        else false
      end
    ),

  -- Which provider produced it, so a change of vendor is visible rather than silent.
  provider text not null
    constraint wayup_snapshots_provider_len check (char_length(provider) <= 64),

  byte_length integer not null default 0
    constraint wayup_snapshots_bytes check (byte_length between 0 and 1048576),

  -- A path into a private Storage bucket. The image is never inlined into the row; a PNG in
  -- jsonb is how a snapshot table becomes a file host.
  screenshot_path text
    constraint wayup_snapshots_shot_len check (
      screenshot_path is null or char_length(screenshot_path) <= 512
    ),

  created_at timestamptz not null default now(),

  -- Redundant given how `id` is derived, and kept anyway: it states the dedupe intent in the
  -- schema and survives a change to the derivation.
  constraint wayup_snapshots_dedupe unique (canonical_url, content_hash)
);

-- "Has this URL changed since we last saw it" — the checksum beat's only query.
create index if not exists wayup_snapshots_url_recent_idx
  on public.wayup_snapshots (canonical_url, remote_fetched_at desc);

alter table public.wayup_snapshots enable row level security;

-- No insert, update or delete policy at all. Only the relay route, holding the service role,
-- has actually fetched a page and computed its hash. A client-writable cache would let one
-- player author a document that another player reads inside the game's own renderer — forged
-- evidence in a game about whether documents are real, and the end of the checksum mechanic.

-- -------------------------------------------------------------------- visits

create table if not exists public.timeline_wayup_visits (
  id uuid primary key default gen_random_uuid(),
  timeline_id uuid not null references public.timelines (id) on delete cascade,
  snapshot_id text not null references public.wayup_snapshots (id) on delete cascade,

  -- In-world time: which day of the run, and which minute of that day. Bounded for sanity
  -- rather than by the season's length, which is a rule that belongs in content/.
  opened_game_day int not null
    constraint timeline_wayup_visits_day check (opened_game_day between 1 and 366),
  opened_game_minute int not null
    constraint timeline_wayup_visits_minute check (opened_game_minute between 0 and 1440),

  -- What the look cost in signal. Authored in content; recorded here so a run can be read back.
  signal_cost int not null default 0
    constraint timeline_wayup_visits_cost check (signal_cost between 0 and 1000),

  opened_at timestamptz not null default now()
);

-- Drives the snapshot select policy below, so it has to be the fast path.
create index if not exists timeline_wayup_visits_snapshot_idx
  on public.timeline_wayup_visits (snapshot_id, timeline_id);

create index if not exists timeline_wayup_visits_timeline_idx
  on public.timeline_wayup_visits (timeline_id, opened_at desc);

alter table public.timeline_wayup_visits enable row level security;

create policy "visits are readable from your own timelines"
  on public.timeline_wayup_visits for select
  to authenticated
  using (
    exists (
      select 1 from public.timelines t
      where t.id = timeline_wayup_visits.timeline_id and t.user_id = auth.uid()
    )
  );

-- Deliberately no client insert. A visit row is what grants read access to a snapshot, so a
-- client that could forge one could forge its way into any snapshot id it could guess — it
-- would defeat the policy below rather than satisfy it. Only the relay route writes visits, in
-- the same request that captured the page and charged the signal.

-- A snapshot is unowned, so ownership is borrowed from the visits that reference it: you may
-- read a captured page if one of your own timelines actually opened it. Declared here rather
-- than beside its table because it depends on `timeline_wayup_visits` existing.
--
-- Without this, `select=*` on the publishable key would dump every page every player has ever
-- fetched — a free scraped-web API, a behavioural record of what people looked up, and a
-- spoiler table for a game whose entire subject is discovery.
--
-- Same shape as "events follow their timeline" in the init migration.
create policy "snapshots follow a visit from one of your timelines"
  on public.wayup_snapshots for select
  to authenticated
  using (
    exists (
      select 1
      from public.timeline_wayup_visits v
      join public.timelines t on t.id = v.timeline_id
      where v.snapshot_id = wayup_snapshots.id
        and t.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------- future evidence

create table if not exists public.future_evidence (
  id uuid primary key default gen_random_uuid(),
  timeline_id uuid not null references public.timelines (id) on delete cascade,

  -- Immutable, so restrict rather than cascade: provenance that can vanish is not provenance.
  snapshot_id text not null references public.wayup_snapshots (id) on delete restrict,

  excerpt text not null
    constraint future_evidence_excerpt_len check (char_length(excerpt) between 1 and 4096),
  excerpt_hash text not null
    constraint future_evidence_hash_len check (char_length(excerpt_hash) = 64),

  captured_game_day int not null
    constraint future_evidence_day check (captured_game_day between 1 and 366),
  captured_game_minute int not null
    constraint future_evidence_minute check (captured_game_minute between 0 and 1440),

  pinned_at timestamptz not null default now(),

  -- One excerpt pinned once per timeline.
  constraint future_evidence_unique unique (timeline_id, snapshot_id, excerpt_hash)
);

-- The source URL, the remote fetch time and the content hash are deliberately *not* copied
-- here. They live on the snapshot, which the client cannot write. Denormalising them would
-- create a second, forgeable copy of the exact three facts the "is this document still yours"
-- mechanic depends on. Read them through the join.

create index if not exists future_evidence_timeline_idx
  on public.future_evidence (timeline_id, pinned_at desc);

alter table public.future_evidence enable row level security;

create policy "future evidence is readable from your own timelines"
  on public.future_evidence for select
  to authenticated
  using (
    exists (
      select 1 from public.timelines t
      where t.id = future_evidence.timeline_id and t.user_id = auth.uid()
    )
  );

-- You may pin from a page you actually opened, into a timeline you actually own. The visit
-- requirement is both narratively correct and the thing that stops this table being used to
-- reference snapshots the player was never shown.
create policy "future evidence is pinned into your own timeline"
  on public.future_evidence for insert
  to authenticated
  with check (
    exists (
      select 1 from public.timelines t
      where t.id = future_evidence.timeline_id and t.user_id = auth.uid()
    )
    and exists (
      select 1 from public.timeline_wayup_visits v
      where v.timeline_id = future_evidence.timeline_id
        and v.snapshot_id = future_evidence.snapshot_id
    )
  );

create policy "future evidence can be unpinned from your own timelines"
  on public.future_evidence for delete
  to authenticated
  using (
    exists (
      select 1 from public.timelines t
      where t.id = future_evidence.timeline_id and t.user_id = auth.uid()
    )
  );

-- No update policy: an excerpt is a capture, not a document. Editing one would let a player
-- rewrite the provenance they are about to put on the record.

-- A free signup with an unbounded 4 KB-per-row table is a storage abuse surface, and RLS cannot
-- express "at most N rows". This is the one place a trigger earns its keep. SECURITY INVOKER —
-- the default — means it counts under the caller's own RLS, which is exactly the right scope.
create or replace function public.future_evidence_cap()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (
    select count(*) from public.future_evidence
    where timeline_id = new.timeline_id
  ) >= 256 then
    raise exception 'future_evidence: a timeline may pin at most 256 excerpts';
  end if;
  return new;
end;
$$;

drop trigger if exists future_evidence_cap_trigger on public.future_evidence;
create trigger future_evidence_cap_trigger
  before insert on public.future_evidence
  for each row execute function public.future_evidence_cap();

revoke execute on function public.future_evidence_cap() from public, anon, authenticated;

-- ----------------------------------------------------------- mystery unlocks

create table if not exists public.mystery_unlocks (
  timeline_id uuid not null references public.timelines (id) on delete cascade,
  mystery_id text not null
    constraint mystery_unlocks_id_len check (char_length(mystery_id) between 1 and 64),
  -- Which event opened it. A label, not narrative: what a mystery *means* stays in content/.
  source_event text not null default ''
    constraint mystery_unlocks_source_len check (char_length(source_event) <= 128),
  unlocked_at timestamptz not null default now(),
  primary key (timeline_id, mystery_id)
);

alter table public.mystery_unlocks enable row level security;

create policy "unlocks are readable from your own timelines"
  on public.mystery_unlocks for select
  to authenticated
  using (
    exists (
      select 1 from public.timelines t
      where t.id = mystery_unlocks.timeline_id and t.user_id = auth.uid()
    )
  );

create policy "unlocks are recorded against your own timelines"
  on public.mystery_unlocks for insert
  to authenticated
  with check (
    exists (
      select 1 from public.timelines t
      where t.id = mystery_unlocks.timeline_id and t.user_id = auth.uid()
    )
  );

-- No update or delete: an unlock is something that happened. The timeline snapshot remains the
-- authority for gameplay; this table exists so unlocks can be queried across timelines.

-- ------------------------------------------------------------ global mystery

-- Some puzzles are meant to be solved by everyone at once, with a fragment count anyone can
-- see. This is the only place in the schema where one player's write is another's read, so the
-- write side is closed completely: clients read the projection and never touch the ledger.

create table if not exists public.global_mystery_fragments (
  mystery_id text not null
    constraint global_fragments_mystery_len check (char_length(mystery_id) between 1 and 64),
  fragment_id text not null
    constraint global_fragments_fragment_len check (char_length(fragment_id) between 1 and 64),
  user_id uuid not null references auth.users (id) on delete cascade,
  timeline_id uuid references public.timelines (id) on delete set null,
  contributed_at timestamptz not null default now(),
  -- One contribution per account per mystery. Keyed on the account rather than the timeline,
  -- because a player can start as many timelines as they like.
  primary key (mystery_id, user_id)
);

create index if not exists global_fragments_mystery_idx
  on public.global_mystery_fragments (mystery_id);

alter table public.global_mystery_fragments enable row level security;

create policy "your own contributions are readable"
  on public.global_mystery_fragments for select
  to authenticated
  using (auth.uid() = user_id);

-- No client writes. Which fragments exist, and who holds them, is both a spoiler and a record
-- of other people's play; the aggregate below is the only thing anyone else gets to see.

create table if not exists public.global_mystery_state (
  mystery_id text primary key
    constraint global_state_mystery_len check (char_length(mystery_id) between 1 and 64),
  fragments_found int not null default 0
    constraint global_state_found check (fragments_found >= 0),
  fragments_required int not null
    constraint global_state_required check (fragments_required between 1 and 1000),
  resolved_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.global_mystery_state enable row level security;

-- Readable by everyone, including guests with no account: "7 / 9" is the point of a shared
-- puzzle, and the row carries no personal data. Written only by the service role, like
-- entitlement. Rows are created by an operator from the mystery definitions in content/ — the
-- database never learns what a mystery means.
create policy "the shared count is public"
  on public.global_mystery_state for select
  to anon, authenticated
  using (true);

-- --------------------------------------------------------------------- prune

-- A fetch that succeeded and then failed to record its visit leaves a snapshot nothing points
-- at. Nothing else here is ever deleted.
create or replace function public.prune_orphan_wayup_snapshots()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.wayup_snapshots s
  where s.created_at < now() - interval '7 days'
    and not exists (select 1 from public.timeline_wayup_visits v where v.snapshot_id = s.id)
    and not exists (select 1 from public.future_evidence f where f.snapshot_id = s.id);
$$;

revoke execute on function public.prune_orphan_wayup_snapshots() from public, anon, authenticated;
