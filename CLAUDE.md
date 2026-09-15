# CLAUDE.md — UNLISTED

## 1. Product identity

**UNLISTED** is a browser-native investigation product: part narrative game, part SaaS.

The player is an investigator. A **case** arrives with whatever it arrives with — sometimes a
laptop image and a locked handset, sometimes only a name — and they work it at a **workstation**
until they can file a report. Case 001 is free and account-free. Later cases need a subscription.
Some recoveries inside a case are sold separately, once, for real money.

The product combines: a credible fictional operating system, a corpus large enough to be a world
rather than a puzzle, devices as sources attached to the machine, a metered line to the open web,
claims that go on the record under the player's name, and consequences that are content.

### The pivot, and what it cost

This repository was **2009**, a time-travel business simulation. The branch `archive/2009` holds
that product complete at `bc257c3`; `docs/ARCHIVE_2009.md` says what is on it and why. The engine,
the corpus machinery, the window manager and the relay survived the cut. The setting, the economy,
the Recall mechanic and the thirty-day arc did not. Nothing in this file describes 2009, and a
save written by it is refused rather than reshaped.

## 2. Canonical design rules

### MUST

- Full viewport game surface once a case is open.
- Workstation menu bar, desktop, dock, draggable overlapping windows.
- **The workstation is the machine; a device is a source attached to it.** A case may supply two
  devices, one, or none, and the engine does not change shape when it does.
- The phone is an in-world movable overlay, not a tab.
- Evidence tray is lightweight and collapsible.
- Investigation Board is a focused in-world mode.
- One search reaches every surface at once, and its counts say the world is larger than the
  question. It is a Find window, not a command palette.
- The Directory holds only what this machine has learned. It is never a cast list.
- The relay console is a focused in-world mode, like the board, and never a browser tab.
- Consequences are experienced through changing world content, not through a meter.
- Guest can begin immediately with no account.
- Save/account prompt happens only after the case has earned it.

### MUST NOT

- SaaS dashboard shell around the investigation.
- Permanent "Cases / Devices / Evidence / Account" navigation inside the workstation.
- Modern giant rounded cards inside the OS.
- Emoji as shipping icons.
- AI chat replacing authored narrative.
- External live web search inside the fictional Browser. (The relay is the only route out, it is
  metered, and what it returns is an immutable snapshot.)
- Hardcoded story logic inside React components.
- Client-side subscription or entitlement checks as the source of truth.
- A price, a card field, or a purchase completed inside the fiction. Recovery is offered in-world
  and bought on `/account`, where a purchase looks like a purchase.

## 3. Canonical world and continuity

Portland, Oregon · present day · USD · **NOVA 3.2** workstation · the **UNLISTED** platform.

**Case 001 — He Never Came Home.** 17 June 2026. Client Claire Mercer; subject Daniel Mercer,
missing since 9 June; Richard Vale, Ridgeline Partners, the Marlow Foundation, Nadia Okafor.

`content/cases/case001/` authors ten pieces of evidence, four claims, five messages, eight
documents, two devices, one paid recovery and eleven pages of its own web. `content/world/` holds
sixty-nine artifacts carrying thirteen facts, and `content/index.ts` projects the case into it, so
the searchable world is ninety-four documents deep.

The shape of the corpus is measured, not asserted: **64% ordinary, 12% side story, 7% economic,
13% suggestive, 4% anomalous.** The suggestive facts carry four and five traces, so any two or
three of them are enough and two players can assemble the same conclusion from different halves.
`tests/unit/content.test.ts` fails the build when that stops being true.

## 4. Production stack

- Next.js 16.x App Router
- React 19 + TypeScript (`strict: true`)
- CSS Modules + scoped global CSS tokens for the workstation shell. No utility framework dictates
  the visual language.
- Zustand for client runtime orchestration, backed by a **pure deterministic reducer/event engine**
- Zod for validating authored case content
- IndexedDB (Dexie) for guest local-first saves
- Supabase Postgres + Auth for cloud saves/accounts (SSR/cookie patterns + RLS)
- Stripe Billing/Checkout + customer portal for subscription and one-time entitlements
- Thin analytics adapter (PostHog-compatible) for product events
- Thin error adapter (Sentry-compatible) for errors
- Vitest + React Testing Library for unit/component tests
- Playwright for the full Case 001 flow

**The core game engine (`engine/`, `content/`) must not import Next.js, Supabase, Stripe,
analytics, or any UI framework.** This is enforced by `tests/unit/engine-purity.test.ts`.

## 5. Route map

```
/                          marketing landing (light route, no game bundle)
/play                      guest/new investigation
/play/[investigationId]    resume a local/cloud investigation (?case= selects the case)
/auth/sign-in              auth flows
/auth/callback
/account                   save/account/subscription/forensic services
/billing/success           Stripe return
/api/billing/checkout      create Stripe checkout session
/api/billing/portal        create customer portal session
/api/billing/webhook       Stripe webhook
/api/investigations        cloud sync (RLS-backed)
/api/wayup/{search,fetch}  the relay's server half
```

The in-game OS does **not** use URL navigation for individual apps/windows. Window/app state is
game state.

## 6. Repository architecture

See `docs/ARCHITECTURE.md`.

## 7. Game engine rules

**Event-sourced.** Every meaningful player action emits a typed event. UI/game state is derived
from `reduce(state, event, content)`. The event log is kept so saves can be debugged, replayed
and migrated.

**The unit is a case.** Not a day. `CaseContent` in, `InvestigationState` out; one case, one
content module, one sitting. There is no night, no day counter and no thirty-day arc.

**Deterministic by default.** Case 001 is authored and deterministic. Any later randomness uses a
seeded PRNG (`engine/seed.ts`) recorded in the investigation.

**Data-driven content.** Mail, dialogue, browser pages, files, devices, evidence, claims, services
and reports live under `content/`, validated by Zod. React components render content; they never
own narrative truth. Which applications exist, which file lands on the desktop and what opens a
device are all the case's decisions.

**One world.** `content/world/` is the corpus the cases happen inside — entities, artifacts,
relations, facts — and `content/index.ts` projects every authored case into it, so a player who
searches a name reaches the mail they actually read rather than a second copy of that person.
`worldAsOf` cuts it to the date being played. Authoring rules and the invariants the build
enforces are in `docs/CORPUS.md`.

**Every page has an address.** A document on the web surface must be reachable by typing its URL,
and two documents may never share one. A case's browser pages and the corpus are one internet.

**Choices must answer themselves.** A dialogue choice carries its own reply, may hold the
conversation, may set a world flag, and may require evidence before it is offered. A
branching-looking script that ignores what was picked is worse than an honest linear one — the
player learns in ten seconds that nothing they say matters.

**Consequences are content, not meters.** `exposure`, `flags`, `devices`, `notes` and the kept
lines all reach the report as authored lines. Anything the game accumulates and never spends is a
hole a player will feel.

## 8. Core state model

`engine/types.ts#InvestigationState`. Do **not** expose all of it as a permanent HUD.

## 9. Window manager

`components/game/WindowManager.tsx` — open/focus/close/minimize, z-order, Pointer Events drag,
viewport clamping, cascade, persisted positions, keyboard focus, double-click titlebar zoom, and
a mobile fallback (single foregrounded window + dock task switcher). The registry is the build's;
the roster is the case's, and an app a case names that this build does not have renders as a
window saying so rather than as a crash.

## 10–14

See `docs/PRODUCT_SPEC.md` for apps, investigation, devices, the fictional Browser and the relay.

## 15. Persistence

Guest: local UUID investigation, debounced IndexedDB autosave of event log + latest snapshot.
Authenticated: Supabase Auth (cookie/SSR). After Case 001 the local investigation can be claimed
and synced once; the server then owns cloud state. RLS restricts rows to their owner. Every
investigation carries `schemaVersion` and passes through `lib/persistence/migrations.ts`, whose
chain deliberately starts empty: a 2009 save is quarantined, never reshaped.

## 16. Database

See `supabase/migrations/`. Never store Stripe secret keys or service-role keys in the client.
The `timelines` table keeps its name for now and stores `case_id`; renaming the table is a
separate migration and a separate decision.

## 17. Subscription / paywall boundary

Landing and Case 001 are free and account-free. At the end of a case: cliffhanger, then the
report. Another case requires saving/claiming the investigation. **Entitlement is checked
server-side** (`lib/billing/entitlement.ts`). Unentitled users are sent to Stripe Checkout. Plans
and prices come from `lib/billing/plans.ts` reading env, never from component strings.

**Forensic services** are one-time purchases offered inside a case. Two rules hold them honest and
both are enforced in code, not in copy:

- `services` on the state is a **projection of a server-side entitlement**, never the check. The
  reducer refuses to pin evidence behind an ungranted service, and the content is served rather
  than unlocked client-side.
- **No sound claim may require evidence that is behind a service.**
  `tests/unit/content.test.ts` fails the build if one does. A case that cannot be closed without
  paying is a different product from the one being sold.

Never gate a recovery on somebody else's copyrighted media. If a case wants a podcast episode,
the case produces the podcast.

## 18. Analytics

Typed adapter in `lib/analytics/`. Never send note contents, search queries, message drafts, or
other private text.

## 19. Errors and observability

Error boundary around the game shell; graceful local-save failure; Stripe webhook idempotency;
server logging adapter; dev debug panel behind `NEXT_PUBLIC_DEBUG_PANEL` only.

## 20. Performance

Light landing route; lazy-loaded game bundle and heavy apps; no rerender storms while dragging
(transforms during drag, commit on release); `prefers-reduced-motion` respected; no layout shift
during boot→desktop.

## 21. Mobile

The workstation remains the shell. One foregrounded app window at a time, dock/task switcher,
phone as full-height in-world overlay, evidence tray as bottom sheet, board as a full-screen
workspace. Never miniaturize the whole desktop.

## 22. Accessibility

Keyboard access to dock/apps/windows; visible focus states; Escape closes overlays when safe;
reduced motion; optional sound with a mute state; semantic buttons/inputs despite the styling;
never rely on color alone for evidence/verdict states.

Implemented, and asserted by `tests/unit/components.test.tsx` and `tests/e2e/mobile.spec.ts`:

- **Never claim a widget you have not built.** A `role` you cannot back with its keyboard
  contract is worse than no role: `role="listitem"` on a button destroys the button, `menubar`
  promises menus, `aria-modal` without a trap is a lie. Windows are regions, not dialogs.
- **Focus is state.** Opening the board or the report card moves focus in, traps Tab, makes the
  desktop `inert`, and returns focus to the opener. Tabbing into a buried window raises it.
  A control that becomes `disabled` while focused drops focus to `<body>` — use `aria-disabled`.
- **`prefers-reduced-motion` must reach the JavaScript.** The boot ticker, the typing pause and
  the surveillance hold are timers, not CSS. `pace()` collapses them. The beats still happen; the
  waiting does not.
- **Keyboard routes**: `Ctrl+\`` cycles windows, `Ctrl+D` reaches the dock, `Ctrl+E` the tray,
  `Ctrl+K` the search.
- **Sound** is generated at runtime by `lib/audio/` — no files ship. The mute control lives in the
  menu bar, and the choice persists.

## 23. Testing

Unit: evidence pinning idempotency, the service gate, claim requirement logic, device unlocking,
page variants, the report gate, save migration, engine purity.

The corpus has invariants of its own, and they fail the build: a page on the web with no address,
two documents at one address, a connection nothing the player could hold supports, a fact carried
by a single trace, an untrue document nothing catches, a world that has stopped being mostly
ordinary, a plot fact resting on too few traces to be worked out, a device nothing can open, an
app the dock names and the case never declared, and a case whose only sound claim is behind a
paywall. `tests/unit/content.test.ts` is the corpus report — it
fails with the numbers in the message.

E2E: the full Case 001 golden path (`tests/e2e/case001.spec.ts`), the world surfaces
(`tests/e2e/world.spec.ts`), the narrow layout and the keyboard routes (`tests/e2e/mobile.spec.ts`).

## 24. Definition of done

```
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:e2e -- --project=chromium
```
