# 2009 — Architecture

## Layering

```
  content/  (authored, Zod-validated data — no logic, no React)
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
  (marketing)/page.tsx           landing — light route, no game bundle
  play/page.tsx                  guest launch
  play/[timelineId]/page.tsx     resume
  account/page.tsx               save / subscription
  auth/sign-in, auth/callback
  billing/success
  api/billing/{checkout,portal,webhook}
  api/timelines/[id]
components/
  game/
    GameRoot.tsx                 stage machine + autosave + boot orchestration
    HalcyonDesktop.tsx  MenuBar.tsx  Dock.tsx  DesktopIcons.tsx
    WindowManager.tsx  WindowFrame.tsx  useWindowDrag.ts
    PhoneOverlay.tsx  EvidenceTray.tsx  InvestigationBoard.tsx
    FileIcon.tsx  PhotoFrame.tsx      drawn SVG art — no icon library, no emoji
    DayEndCard.tsx  SurveillanceOverlay.tsx  BootSequence.tsx
    GameErrorBoundary.tsx  DebugPanel.tsx
    apps/  MailApp MessengerApp BrowserApp FilesApp BankApp
           QuotelineApp NotesApp TerminalApp RecallApp  (all lazy)
  marketing/  Landing.tsx
content/
  day01/  emails chats browser files evidence claims recall economy phone terminal boot
  apps.ts   window/dock registry
  index.ts  assembled + validated Day01Content
engine/
  types.ts  events.ts  reducer.ts  rules.ts  selectors.ts
  temporal.ts  content-schema.ts  initial-state.ts  money.ts  seed.ts  clock.ts
lib/
  audio/        engine.ts (Web Audio synth)  cues.ts   — no audio files ship
  persistence/  db.ts (Dexie, loaded on demand)  migrations.ts  local-store.ts
  supabase/     client.ts  server.ts  middleware.ts
  billing/      plans.ts  stripe.ts  entitlement.ts
  analytics/    index.ts  events.ts
  errors/       index.ts
state/
  store.ts       Zustand store wrapping the pure reducer
styles/
  tokens.css  halcyon.css
supabase/migrations/
tests/unit/  tests/e2e/
design/      the Claude Design handoff, kept for reference
```

## The reducer

```ts
reduce(state: TimelineState, event: GameEvent, content: Day01Content): TimelineState
```

Pure, total, and side-effect free. All timing (`setTimeout` for the boot ticker, the "typing…"
delay, the 2.2s resale settle, the 3.4s surveillance beat) lives in `components/game/GameRoot.tsx`
and dispatches ordinary events. That keeps the engine replayable: feeding the event log back
through `reduce` from `initialTimelineState()` reproduces the snapshot exactly.

`applyEvents(state, events, content)` is the replay function; `tests/unit/replay.test.ts` asserts
snapshot === replay for a full Day 01 event log.

## Zustand store

`state/store.ts` holds `{ timeline, dispatch, ... }`. `dispatch` appends to `timeline.eventLog`
and calls `reduce`. Components subscribe with narrow selectors so a window drag does not rerender
the desktop. Drag itself never touches the store until pointerup — `useWindowDrag` writes a
`translate3d` transform directly to the element.

## Validation at the boundary

The engine's types vanish at compile time, so `engine/timeline-schema.ts` is the runtime shape of
a `TimelineState`. Anything arriving from IndexedDB, from Postgres, or from a client
`PUT /api/timelines/:id` passes through it: integer cents, coherence in range, bounded text, and
a **closed event vocabulary** (`GAME_EVENT_TYPES`, tied to the union by `satisfies`).

The reducer's `default` branch calls `assertNever` and returns the state unchanged, so an event
type this build does not know leaves the timeline alone rather than replacing it.

## Persistence

- **Guest**: `lib/persistence/db.ts` (Dexie, database `two009`, table `timelines`). Autosave is
  debounced 600ms after any state-changing event, storing `{ snapshot, events, schemaVersion }`.
- **Migration**: `lib/persistence/migrations.ts` maps any older `schemaVersion` forward — the
  chain currently runs 1 → 6. Unknown
  or corrupt rows are quarantined rather than crashing the boot.
- **Cloud**: `/api/timelines/[id]` writes through Supabase with RLS. The client never holds the
  service-role key.

## Entitlement

`lib/billing/entitlement.ts#getEntitlement(userId)` reads the `subscriptions` table server-side.
`app/play/[timelineId]/page.tsx` calls it on the server for `day >= 2` and redirects to
`/account?upgrade=1` when the player is not entitled. The client-side paywall UI is presentation
only.

## Content validation

`content/index.ts` calls `Day01ContentSchema.parse(...)` at module load. A malformed content
module fails the build (it is imported by a server component), not a player's session.
