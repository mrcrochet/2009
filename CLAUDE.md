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

### The design rule

> **UNLISTED should feel authored, not decorated.**
> **NOVA should feel functional, not cinematic.**
> **The cases carry the drama.**

Three surfaces, three jobs. The **product** — home, account, auth — is pure black, Inter set
tight with Geist Mono for codes and clocks, white as its only accent, and quiet: no KPI cards, no
gradients behind text, no badges competing with each other. The **workstation** holds one rule of its own: **chrome is dark, documents are light.** The
shell, titlebars, lists, sidebars, toolbars and the Find window are the machine and recede; a
mail message, a spreadsheet, a scan and a web page are somebody else's paper and do not. One
typeface family for both — Inter, with Geist Mono wherever the output is a code, a clock, an
address or a filename. The **workstation** is a credible machine
with its own typefaces and its own chrome, and it is not styled by the product that contains it.
The **cases** are where colour, tension and key art live. A quiet shelf is what lets a poster be
loud.

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
- **The relay is an application on this workstation, and the only route out.** Metered, and
  everything it brings back is captured: an immutable snapshot, held with where it came from and
  what the look cost, so a replay shows the bytes the player read. It is never a tab inside the
  fictional browser, and it is not on the machine until the process has been found — the dock
  hides it and the reducer refuses to open it.
- Consequences are experienced through changing world content, not through a meter.
- Guest can begin immediately with no account.
- Save/account prompt happens only after the case has earned it.
- **Cases arrive the way a streaming service releases series**: a shelf the player chooses from,
  one at a time, some standalone and some in a season. The root of the site is therefore the
  shelf, not a poster for a single case.
- `/` is the **design reference, built** (`components/product/CasesHome.tsx`). Its catalogue,
  counts and session figures are the reference's placeholder data; `SHELF` in `content/index.ts`
  is the seam that replaces them with the registry, and it is derived from `BY_CASE` so the
  wiring cannot invent a case.
- Everything the product has is reachable from the front door. An entry whose page is not built
  keeps the reference's `#` rather than pretending to go somewhere.

### MUST NOT

- SaaS dashboard shell around the investigation.
- Permanent "Cases / Devices / Evidence / Account" navigation inside the workstation.
- Modern giant rounded cards inside the OS. Rounded *windows* are not that: a 10px corner on a
  window is a present-day operating system, a 22px card floating in a blur is a dashboard.
- Emoji as shipping icons.
- AI chat replacing authored narrative.
- External live web search inside the fictional Browser. The relay is the only route out; a case's
  own web and the corpus are one closed internet.
- Hardcoded story logic inside React components.
- Client-side subscription or entitlement checks as the source of truth.
- A price, a card field, or a purchase completed inside the fiction. Recovery is offered in-world
  and bought on `/account`, where a purchase looks like a purchase.

## 3. Canonical world and continuity

Portland, Oregon · present day · USD · **NOVA 3.2** workstation · the **UNLISTED** platform.

**Case 001 — He Never Came Home.** 17 June 2026. Client Claire Mercer; subject Daniel Mercer,
missing since 9 June; Richard Vale, Ridgeline Partners, the Marlow Foundation, Nadia Okafor.

`content/cases/case001/` authors ten pieces of evidence, four claims, five messages, eight
documents, three photographs, two devices, one paid recovery and eleven pages of its own web.
`content/world/` holds sixty-nine artifacts carrying thirteen facts, and `content/index.ts`
projects the case into it, so the searchable world is ninety-four documents deep.

The shape of the corpus is measured, not asserted: **64% ordinary, 12% side story, 7% economic,
13% suggestive, 4% anomalous.** The suggestive facts carry four and five traces, so any two or
three of them are enough and two players can assemble the same conclusion from different halves.
`tests/unit/content.test.ts` fails the build when that stops being true.

## 4. Production stack

- Next.js 16.x App Router
- React 19 + TypeScript (`strict: true`)
- CSS Modules + scoped global CSS tokens. No utility framework dictates the visual language.
  Two stylesheets that never import each other: `styles/product.css` (UNLISTED, scoped to
  `.unlisted`) and `styles/nova.css` (the workstation).
- **Inter + Geist Mono**, and nothing else. The product sets its interface in the system
  grotesk and its data in a mono; so does the workstation, because a present-day forensic tool
  does. The period display face and typewriter mono the machine used to carry were the last
  costume left over from the product this repository used to be.
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
/                          home — the shelf, held sessions, case briefs.
                           The product's front door; light route, no game bundle
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
/api/relay/{search,fetch}  the relay's server half
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

**Data-driven content.** Mail, dialogue, browser pages, files, photographs, devices, evidence,
claims, services and reports live under `content/`, validated by Zod. React components render
content; they never own narrative truth. Which applications exist, which file lands on the
desktop and what opens a device are all the case's decisions.

**A document declares what it is.** `kind` — `note`, `letter`, `sheet`, `scan`, `audio`,
`encrypted` — and the build draws it as that: a spreadsheet as a table with the comment somebody
left in a cell, a receipt as paper off a flatbed, a voicemail as a transport over a transcript
that is legible whether or not it is played. No audio or image files ship; a recording is a
`durationSec`, a channel and timed cues, and its waveform is derived from its id so a replay
looks like the session. See `docs/AUTHORING.md`.

**A photograph belongs to the source it came off.** `photos` are authored on the case with a
`sourceId`; the handset's roll and the workstation's viewer are two surfaces over one set of
files, and a picture off a source nobody has unlocked is on neither. The same rule gives a
locked handset a lock screen instead of the thread it is hiding.

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

See `docs/PRODUCT_SPEC.md` for the stage machine, the apps, the investigation, devices, the
fictional Browser and the relay, as Case 001 actually ships them.

## 15. Persistence

Guest: local UUID investigation, debounced IndexedDB autosave of event log + latest snapshot.
Authenticated: Supabase Auth (cookie/SSR). After Case 001 the local investigation can be claimed
and synced once; the server then owns cloud state. RLS restricts rows to their owner. Every
investigation carries `schemaVersion` and passes through `lib/persistence/migrations.ts`, whose
chain deliberately starts empty: a 2009 save is quarantined, never reshaped.

## 16. Database

See `supabase/migrations/`. Never store Stripe secret keys or service-role keys in the client.
The nouns are current — `investigations`, `investigation_events`, `relay_snapshots`,
`kept_lines` — renamed in `20260617000005_investigations.sql` rather than dropped and recreated,
so row-level security survived untouched. **Migration filenames are history**: the file still
called `wayup.sql` created the relay's tables under the mechanic's old codename, and renaming an
applied migration is how a schema stops being reproducible.

The guest store is `unlisted` in IndexedDB. A database cannot be renamed, only replaced, so
opening it carries forward whatever was in the old one and then deletes it
(`lib/persistence/db.ts`).

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

Light front door — `/` ships no game bundle; lazy-loaded game bundle and heavy apps; no rerender storms while dragging
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
  `Ctrl+K` the search. `Space` on a file or a frame is Quick Look, and `Space` again puts it
  down — a way to read a document without opening the application that owns it.
- **Sound** is generated at runtime by `lib/audio/` — no files ship. The mute control lives in the
  menu bar, and the choice persists.

## 23. Testing

Unit: evidence pinning idempotency, the service gate, claim requirement logic, device unlocking,
page variants, the report gate, save migration, engine purity, and the reading of a document —
the sheet parser, the waveform's determinism, what a locked source yields, and what Quick Look
refuses to hold up.

`tests/unit/library.test.tsx` holds the home page to the reference: three sidebar groups, the
continue hero and its two posters, four rails, a season of five with one locked, the held session
bar, the brief's open and close, and a `<symbol>` behind every `<use>`.

Every selector that builds an object is memoised and asserted stable in
`tests/unit/selectors.test.ts`. Through `useSyncExternalStore` a fresh reference per render is
not a slow render; it is an infinite one, and the application does not start.

The corpus has invariants of its own, and they fail the build: a page on the web with no address,
two documents at one address, a connection nothing the player could hold supports, a fact carried
by a single trace, an untrue document nothing catches, a world that has stopped being mostly
ordinary, a plot fact resting on too few traces to be worked out, a device nothing can open, an
app the dock names and the case never declared, a recording with nothing recorded or a
transcript that runs past the end of it, a spreadsheet that does not parse, a photograph filed
under a source the case never attached, and a case whose only sound claim is behind a paywall.
`tests/unit/content.test.ts` is the corpus report — it fails with the numbers in the message.

E2E: the front door and the boundary it stops at (`tests/e2e/home.spec.ts`), the full Case 001
golden path from that door (`tests/e2e/case001.spec.ts`), the world surfaces
(`tests/e2e/world.spec.ts`), the document surfaces — the reader, Quick Look, the viewer and the
lock screen (`tests/e2e/documents.spec.ts`) — and the narrow layout and the keyboard routes
(`tests/e2e/mobile.spec.ts`).

## 24. Definition of done

```
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:e2e -- --project=chromium
```
