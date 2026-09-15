-- The unit of play is a case, not a day.
--
-- `day int` was the 2009 product's spine: a save belonged to day N of thirty, and the paywall
-- asked whether N > 1. A save now belongs to a case, cases are identified by name rather than by
-- position, and the paywall asks which case. Storing a case id in an integer column named `day`
-- would have been a type error waiting for the second case to ship.
--
-- The table keeps its name for now. Renaming `timelines` is a separate migration and a separate
-- decision; what could not wait is a column whose type no longer matched what it holds.

alter table public.timelines
  add column if not exists case_id text not null default 'case001';

alter table public.timelines
  drop column if exists day;

create index if not exists timelines_case_idx
  on public.timelines (case_id);

comment on column public.timelines.case_id is
  'The authored case this investigation is a run at. Matches content/cases/<id>.';
