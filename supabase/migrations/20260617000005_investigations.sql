-- The unit is a case, and the thing a player owns is an investigation.
--
-- `timelines` was 2009's noun: a run through thirty days that could diverge. Nothing diverges
-- any more — a row is one investigator's run at one case — and `day int` was storing a position
-- in a season that no longer exists. Keeping either would have left the schema describing a
-- product that is on a branch.
--
-- Renames rather than drops and recreates: PostgreSQL rewrites stored policy expressions when a
-- table or column is renamed, so row-level security survives untouched. Function *bodies* are
-- stored as text and do not, so the two that name these tables are recreated below.

-- --------------------------------------------------------------- investigations

alter table public.timelines rename to investigations;

alter table public.investigations
  add column if not exists case_id text not null default 'case001';

alter table public.investigations
  add constraint investigations_case_len check (char_length(case_id) between 1 and 64);

-- A case is identified by name. There is no season to hold a position in.
alter table public.investigations drop column if exists day;

alter index timelines_user_updated_idx rename to investigations_user_updated_idx;
create index if not exists investigations_case_idx on public.investigations (case_id);

comment on column public.investigations.case_id is
  'The authored case this investigation is a run at. Matches content/cases/<id>.';

alter policy "timelines are self-readable"   on public.investigations rename to "investigations are self-readable";
alter policy "timelines are self-insertable" on public.investigations rename to "investigations are self-insertable";
alter policy "timelines are self-updatable"  on public.investigations rename to "investigations are self-updatable";
alter policy "timelines are self-deletable"  on public.investigations rename to "investigations are self-deletable";

-- ---------------------------------------------------------------------- events

alter table public.timeline_events rename to investigation_events;
alter table public.investigation_events rename column timeline_id to investigation_id;

alter policy "events follow their timeline"
  on public.investigation_events rename to "events follow their investigation";

-- ----------------------------------------------------------------- the relay

-- `wayup` was the codename for the line out to the open web. The mechanic survived the pivot
-- unchanged; the name did not survive being read by anybody new.

alter table public.wayup_snapshots rename to relay_snapshots;
alter index wayup_snapshots_url_recent_idx rename to relay_snapshots_url_recent_idx;

alter policy "snapshots follow a visit from one of your timelines"
  on public.relay_snapshots rename to "snapshots follow a visit from one of your investigations";

alter table public.timeline_wayup_visits rename to investigation_relay_visits;
alter table public.investigation_relay_visits rename column timeline_id to investigation_id;
alter index timeline_wayup_visits_snapshot_idx rename to investigation_relay_visits_snapshot_idx;
alter index timeline_wayup_visits_timeline_idx rename to investigation_relay_visits_owner_idx;

alter policy "visits are readable from your own timelines"
  on public.investigation_relay_visits rename to "visits are readable from your own investigations";

-- ------------------------------------------------------------------ kept lines

-- They were `future_evidence`, which is a true description of exactly one product. A line
-- carried in from the open web is context, not evidence, and it is not from the future.

alter table public.future_evidence rename to kept_lines;
alter table public.kept_lines rename column timeline_id to investigation_id;
alter table public.kept_lines rename constraint future_evidence_unique to kept_lines_unique;
alter index future_evidence_timeline_idx rename to kept_lines_owner_idx;

alter policy "future evidence is readable from your own timelines"
  on public.kept_lines rename to "kept lines are readable from your own investigations";
alter policy "future evidence is pinned into your own timeline"
  on public.kept_lines rename to "kept lines are kept into your own investigation";
alter policy "future evidence can be unpinned from your own timelines"
  on public.kept_lines rename to "kept lines can be dropped from your own investigations";

-- The cap is plpgsql, so its body is text and knows nothing about the renames above.
drop trigger if exists future_evidence_cap_trigger on public.kept_lines;
drop function if exists public.future_evidence_cap();

create or replace function public.kept_lines_cap()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (
    select count(*) from public.kept_lines
    where investigation_id = new.investigation_id
  ) >= 256 then
    raise exception 'kept_lines: an investigation may keep at most 256 excerpts';
  end if;
  return new;
end;
$$;

drop trigger if exists kept_lines_cap_trigger on public.kept_lines;
create trigger kept_lines_cap_trigger
  before insert on public.kept_lines
  for each row execute function public.kept_lines_cap();

revoke execute on function public.kept_lines_cap() from public, anon, authenticated;

-- ------------------------------------------------------------------- mysteries

alter table public.mystery_unlocks rename column timeline_id to investigation_id;

alter policy "unlocks are readable from your own timelines"
  on public.mystery_unlocks rename to "unlocks are readable from your own investigations";
alter policy "unlocks are recorded against your own timelines"
  on public.mystery_unlocks rename to "unlocks are recorded against your own investigations";

alter table public.global_mystery_fragments rename column timeline_id to investigation_id;

-- ----------------------------------------------------------------------- prune

drop function if exists public.prune_orphan_wayup_snapshots();

create or replace function public.prune_orphan_relay_snapshots()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.relay_snapshots s
  where s.created_at < now() - interval '7 days'
    and not exists (select 1 from public.investigation_relay_visits v where v.snapshot_id = s.id)
    and not exists (select 1 from public.kept_lines k where k.snapshot_id = s.id);
$$;

revoke execute on function public.prune_orphan_relay_snapshots() from public, anon, authenticated;
