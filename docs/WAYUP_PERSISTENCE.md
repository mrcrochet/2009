# Way Up — persistence

The Way Up Machine lets the player, inside the game's fictional 2009, read the real web of today.
`supabase/migrations/20090115000004_wayup.sql` is where that stops being a fetch and becomes
something a save can replay.

## Why snapshots exist at all

The engine is event-sourced and `tests/unit/replay.test.ts` proves a save reproduces exactly. The
live web offers no such guarantee: a page read on Tuesday is a different page on Wednesday. So a
page observed inside a timeline is **captured once** and referenced by id from then on. Replay
shows what the player read, never what the site says now.

A later fetch of the same URL produces a _different_ snapshot rather than overwriting the old one.
Two ids for one URL is the entire temporal-checksum beat, with no extra bookkeeping — and whether
the cause is an ordinary edit or the player's own divergence is a question the game asks, not one
the schema answers.

## The tables

| Table                      | What it holds                                                                                                            |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `wayup_snapshots`          | An immutable capture: canonical URL, content hash, title, normalised blocks, outgoing links, provider, remote fetch time |
| `timeline_wayup_visits`    | Which timeline opened which snapshot, at what in-world day and minute, and what it cost in signal                        |
| `future_evidence`          | An excerpt a player pinned, with its in-world capture time                                                               |
| `mystery_unlocks`          | Which timeline has opened which mystery, and from what event                                                             |
| `global_mystery_fragments` | The ledger for puzzles solved across all players                                                                         |
| `global_mystery_state`     | The public projection of that ledger — "7 / 9"                                                                           |

## The snapshot policy, which is the whole problem

Every other table in this schema has an owner. A snapshot does not: it is deduplicated on
`(canonical_url, content_hash)` so two players reading the same page do not store it twice.

That makes the cache **shared for storage**. It must not become shared for reading. The
publishable key is public and PostgREST is reachable directly, so a naive `select` grant turns
`wayup_snapshots` into three things at once: a free scraped-web API on our bill, a behavioural
record of what every player looked up, and a spoiler table for a game whose entire subject is
discovery.

So ownership is **borrowed from the visits that reference it**:

> You may read a captured page if one of your own timelines actually opened it.

Same shape as `events follow their timeline` in the init migration. Deduplication still works —
one row, many visitors — while a read requires a visit you own.

Which forces a second decision. **Visits are service-role-only.** If a client could insert a visit
row, it could insert one for any snapshot id it could guess and read its way into the cache — it
would defeat the policy rather than satisfy it. Only the relay route writes visits, in the same
request that captured the page and charged the signal.

Snapshots are likewise service-role-only for writes. A client-writable cache would let one player
author a document another player then reads inside HALCYON's own renderer: forged evidence, in a
game about whether documents are real, and the end of the checksum mechanic.

Verified against a real Postgres before this was written: a player who visited a page sees it, a
player who did not sees nothing, and both a forged visit and a forged snapshot are refused by RLS.

## Provenance is a join, not a copy

`future_evidence` deliberately does **not** carry the source URL, the remote fetch time or the
content hash. Those live on the snapshot, which the client cannot write.

Copying them onto a client-writable row would create a second, forgeable version of the exact
three facts the "is this document still yours" mechanic depends on. `lib/supabase/wayup.ts` reads
them through the join. What the evidence row _does_ own is the excerpt, its hash, and the in-world
moment it was pinned — none of which exist anywhere else.

Pinning requires a visit, so a player can only pin from a page they were actually shown. There is
no update policy: an excerpt is a capture, not a document, and editing one would let a player
rewrite the provenance they are about to put on the record.

## Sizes

`timelines.snapshot` is capped at 512 KB. A cached page is bigger, but not unboundedly so:

- `blocks` — **1 MB**. Extracted article text is normally well under 100 KB; this is roughly ten
  times the realistic worst case and still refuses to be a file host.
- `outgoing_links` — **128 KB and 512 entries**. Both, because a jsonb array of fifty thousand
  short strings passes a byte cap while still being nonsense.
- `excerpt` — **4 KB**. A pinned excerpt is a sentence or a paragraph.
- `future_evidence` — **256 rows per timeline**, enforced by a trigger, because RLS cannot express
  "at most N rows" and a free signup with an unbounded 4 KB-per-row table is a storage abuse
  surface. The trigger is `SECURITY INVOKER`, so it counts under the caller's own RLS.

Screenshots are **not** inlined. `screenshot_path` points into Storage; a PNG in a jsonb column is
precisely how a snapshot table becomes a file host.

The two bounds that would otherwise encode game rules — the length of a season and the cost of a
look — are deliberately loose (`1..366` days, `0..1000` signal). Those numbers belong in
`content/`, not in a check constraint.

## The global mystery, and how it is kept from being a griefing surface

This is the only place in the schema where one player's write is another player's read. The write
side is therefore closed completely:

- `global_mystery_fragments` is the ledger. Service-role writes only. A player can read their own
  contributions and nothing else — which fragments exist and who holds them is both a spoiler and
  a record of other people's play.
- Its primary key is `(mystery_id, user_id)`, so **one contribution per account per mystery**.
  Keyed on the account rather than the timeline, because a player can start as many timelines as
  they like.
- `global_mystery_state` is the public projection. Readable by everyone including guests — "7 / 9"
  is the point of a shared puzzle and the row carries no personal data — and writable only by the
  service role, exactly like entitlement.
- The count is **recomputed from the ledger**, never incremented. A replayed call cannot inflate
  it.

Rows in `global_mystery_state` are created by an operator from the mystery definitions in
`content/`. The database never learns what a mystery means.

## What I could not make safe

**Sybil contribution.** One contribution per account is enforceable in the schema; one per _person_
is not. Signup is a free magic link, so a determined player can complete a global mystery alone by
creating enough accounts. Fixing that is a signup-policy question — email verification, rate
limits, a minimum account age before a fragment counts — and none of it belongs in a check
constraint. If the global mystery ever matters commercially, this is the hole.

**The Storage bucket does not exist yet.** `screenshot_path` is a column with nothing behind it.
Whoever creates that bucket must make it **private** and mirror the snapshot policy; a public
bucket would reintroduce the exact leak the select policy above exists to prevent, and would do it
without touching a single table.

**Snapshot reads cost a join per row.** The select policy runs an `exists` over visits joined to
timelines for every row considered. It is indexed on `(snapshot_id, timeline_id)` and fine at the
scale of one player reading their own pages, but a listing query over many snapshots will feel it.
If that becomes real, denormalise `user_id` onto the visit row and drop the join.

**Guests get nothing.** A player without an account has no timeline row, so no visits, so no
snapshot reads. That is consistent with how guest timelines already work — everything lives in
IndexedDB until they claim it — but it means the Way Up history of a guest is not deduplicated
with anyone else's and is lost if they clear their browser. Claiming a timeline should probably
migrate their local snapshots up; nothing here does that yet.

**Fragment awards are only as trustworthy as the route that grants them.** The schema stops an
account contributing twice. It cannot tell whether the player earned the fragment. That check has
to live server-side, against the timeline's actual state, and it is the obvious thing to get wrong.
