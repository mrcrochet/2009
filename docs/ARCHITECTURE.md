# UNLISTED — Architecture

## Layering

```
  content/  (authored cases + the world corpus — Zod-validated data, no logic, no React)
      ↑
  engine/   (pure TypeScript: types, events, reducer, rules, selectors, temporal)
      ↑
  lib/      (adapters: persistence, supabase, billing, analytics, errors)
      ↑
  components/  (React: game shell + apps + marketing)
      ↑
  app/      (Next.js App Router routes)
```

Dependencies point **up only**. `engine/` and `content/` import nothing from `app/`,
`components/`, `lib/`, `next`, `react`, `@supabase/*` or `stripe`. This is asserted by
`tests/unit/engine-purity.test.ts`, which parses every import in those directories.

## Directory map

```
app/
  (marketing)/page.tsx               landing — light route, no game bundle
  play/page.tsx                      guest launch
  play/[investigationId]/page.tsx    resume (?case= selects the case)
  account/page.tsx                   save / subscription / forensic services
  auth/sign-in, auth/callback
  billing/success
  api/billing/{checkout,portal,webhook}
  api/investigations/[id]
  api/relay/{search,fetch}
components/
  game/
    GameRoot.tsx                 stage machine + autosave + boot orchestration
    Workstation.tsx  MenuBar.tsx  Dock.tsx  DesktopIcons.tsx
    WindowManager.tsx  WindowFrame.tsx  useDragMove.ts
    PhoneOverlay.tsx  EvidenceTray.tsx  InvestigationBoard.tsx
    SearchPalette.tsx  RelayOverlay.tsx  KeptLines.tsx  QuickLook.tsx
    DocumentView.tsx  AudioPlayer.tsx   a document drawn as the thing it is
    FileIcon.tsx  PhotoFrame.tsx      drawn SVG art — no icon library, no emoji
    ReportCard.tsx  SurveillanceOverlay.tsx  BootSequence.tsx
    GameErrorBoundary.tsx  DebugPanel.tsx
    apps/  MailApp MessengerApp BrowserApp FilesApp PhotosApp DevicesApp
           NotesApp TerminalApp DirectoryApp  (all lazy)
  marketing/  Landing.tsx
content/
  cases/case001/  the authored case: apps, devices, services, mail, threads,
                  browser, files, photos, terminal, relay, phone, report
  world/          the corpus: entities, artifacts, relations, facts
  mysteries/      the community layer
  index.ts        assembled + validated, and every case projected into the world
engine/
  types.ts  events.ts  reducer.ts  rules.ts  selectors.ts  documents.ts
  pages.ts  case-schema.ts  investigation-schema.ts  initial-state.ts
  mysteries.ts  mystery-schema.ts  seed.ts  clock.ts  url.ts
  world/  schema.ts  index.ts  project.ts
lib/
  audio/        engine.ts (Web Audio synth)  cues.ts   — no audio files ship
  persistence/  db.ts (Dexie, loaded on demand)  migrations.ts  local-store.ts
                last-investigation.ts
  supabase/     client.ts  server.ts  middleware.ts  investigations.ts  relay.ts
  billing/      plans.ts  stripe.ts  entitlement.ts
  analytics/    index.ts  events.ts
  errors/       index.ts
state/
  store.ts       Zustand store wrapping the pure reducer
styles/
  tokens.css  nova.css
supabase/migrations/
tests/unit/  tests/e2e/
design/      the Claude Design handoff, kept for reference
```

## The reducer

```ts
reduce(state: InvestigationState, event: GameEvent, content: CaseContent): InvestigationState
```

Pure, total, and side-effect free. All timing (`setTimeout` for the boot ticker, the "typing…"
delay, the 3.4s surveillance beat) lives in `components/game/GameRoot.tsx` and dispatches ordinary
events. That keeps the engine replayable: feeding the event log back through `reduce` from
`createInvestigation()` reproduces the snapshot exactly.

`applyEvents(state, events, content)` is the replay function; `tests/unit/replay.test.ts` asserts
snapshot === replay for a full Case 001 event log.

## Zustand store

`state/store.ts` holds `{ investigation, dispatch, ... }`. `dispatch` appends to the event log
and calls `reduce`. Components subscribe with narrow selectors so a window drag does not rerender
the desktop. Drag itself never touches the store until pointerup — `useDragMove` writes a
`translate3d` transform directly to the element.

## The world graph

`engine/world/` holds a graph of entities, artifacts, relations and facts — people, companies,
places, vehicles, and the emails, photographs, transactions and forum posts that are traces of
them. `content/world/` authors it.

**It is content, not a database, and that is a decision rather than an accident.** Putting it in
Postgres would cost two properties this repo has paid for: Case 001 is playable with no account
and no network, and a world that lives in rows has no offline existence; and the engine is pure
and replayable, which a world that changes because someone updated a row is not. Supabase stores
what an _investigation_ did with the world — visited, pinned, discovered — never the world itself.

`engine/world/project.ts` projects a case's authored content into the same graph. Without it there
would be two worlds: a graph nobody's story happens in, and a story the graph has never heard of.
Cases remain the unit of authoring; they become events _in_ the world rather than the only things
in it.

The rule the graph exists to serve is **one fact, many surfaces**. A fact worth knowing leaves
traces in several places and the player needs two or three of them. `tests/unit/world.test.ts`
fails a fact that is reachable from only one place, or whose traces all sit on one surface —
because a fact with a single trace is a quest step wearing a costume.

Search is deliberately literal: it matches text. A parking stub reading `FREMONT STREET PARKING`
is a trace of where somebody was, and searching a name will never find it. That is correct, and it
is why the entity page exists — search finds words; a person's page assembles a fact out of things
that do not share one.

`InvestigationState.discovered` is what the player has actually met. The graph is complete; what they
know is not. An entity page shows what they found and a **count** of what they did not, because
the shape of the gap is the value of the page and listing it would give away the world.

## Validation at the boundary

The engine's types vanish at compile time, so `engine/investigation-schema.ts` is the runtime
shape of an `InvestigationState`. Anything arriving from IndexedDB, from Postgres, or from a
client `PUT /api/investigations/:id` passes through it: bounded text, bounded collections, and a
**closed event vocabulary** (`GAME_EVENT_TYPES`, tied to the union by `satisfies`).

The reducer's `default` branch calls `assertNever` and returns the state unchanged, so an event
type this build does not know leaves the investigation alone rather than replacing it.

## Persistence

- **Guest**: `lib/persistence/db.ts` (Dexie, database `unlisted`, table `investigations`).
  Autosave is debounced 600ms after any state-changing event, storing
  `{ snapshot, events, schemaVersion }`. Opening the database carries forward anything left in the
  old product's store and deletes it, because a database can be replaced but not renamed.
- **Migration**: `lib/persistence/migrations.ts` maps an older `schemaVersion` forward. The chain
  starts at 13 and runs to 14: versions 1–12 were saves of a different game and are quarantined
  rather than reshaped, as are corrupt rows.
- **Cloud**: `/api/investigations/[id]` writes through Supabase with RLS. The client never holds
  the service-role key.

## Entitlement

`lib/billing/entitlement.ts#getEntitlement(userId)` reads the `subscriptions` table server-side.
`app/play/[investigationId]/page.tsx` calls it on the server for any case other than Case 001 and
redirects to `/account?upgrade=1` when the player is not entitled. The client-side paywall UI is presentation
only.

## Content validation

`content/index.ts` calls `CaseContentSchema.parse(...)` at module load. A malformed content
module fails the build (it is imported by a server component), not a player's session.
