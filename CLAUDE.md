# CLAUDE.md — 2009

## 1. Product identity

**2009** is a browser-native interactive narrative / business simulation.

Premise: the player wakes up on **15 January 2009** with knowledge from 2026, **$437.82**, an
identity that is not theirs, and a **$10,000 quota due in 30 days**. They can exploit future
knowledge, but acting on it changes the timeline and progressively makes their memories
unreliable.

The product combines: an immersive fictional operating system, investigation/deduction,
business and investing decisions, a simulated 2009 web, messaging and relationships, a
future-memory "Recall" mechanic, and temporal divergence with consequences.

The Claude Design handoff (`design/2009.dc.html`) is the UI/UX source of truth. Production code
recreates it. It is never reinterpreted into a dashboard.

## 2. Canonical design rules

### MUST
- Full viewport game surface after **WAKE UP**.
- HALCYON top menu bar, desktop, dock, draggable overlapping windows.
- Phone is an in-world movable overlay, not a tab.
- Evidence tray is lightweight and collapsible.
- Investigation Board is a focused in-world mode.
- Cash lives in Bank; investments live in Quoteline/finance apps.
- Recall is an app **and** a resource mechanic.
- Divergence is experienced through changing world content, not only a meter.
- Guest can begin immediately with no account.
- Save/account prompt happens only after the experience has earned it.

### MUST NOT
- SaaS dashboard shell around the game.
- Permanent "Phone / Computer / Business / Timeline" navigation.
- Modern giant rounded cards inside HALCYON.
- Emoji as shipping icons.
- AI chat replacing authored narrative.
- External live web search inside the fictional Browser.
- Hardcoded story logic inside React components.
- Client-side subscription checks as the source of truth.

## 3. Canonical world and continuity

Portland, Oregon · 15 January 2009 · USD · **Owen T. Rask** identity · **HALCYON 4.1** ·
**Aion Group** · **Meridian Savings & Loan** · Marc Deleon · Lea Voss · "M".

The older Paris/euro vertical slice is legacy. Its mechanics may inspire implementation; its
setting and dashboard UI are not canonical.

## 4. Production stack

- Next.js 16.x App Router
- React 19 + TypeScript (`strict: true`)
- CSS Modules + scoped global CSS tokens for the game shell. No utility framework dictates the
  HALCYON visual language.
- Zustand for client runtime orchestration, backed by a **pure deterministic reducer/event engine**
- Zod for validating authored game content
- IndexedDB (Dexie) for guest local-first saves
- Supabase Postgres + Auth for cloud saves/accounts (SSR/cookie patterns + RLS)
- Stripe Billing/Checkout + customer portal for subscription entitlement
- Thin analytics adapter (PostHog-compatible) for product events
- Thin error adapter (Sentry-compatible) for errors
- Vitest + React Testing Library for unit/component tests
- Playwright for full Day 01 flows

**The core game engine (`engine/`, `content/`) must not import Next.js, Supabase, Stripe,
analytics, or any UI framework.** This is enforced by `tests/unit/engine-purity.test.ts`.

## 5. Route map

```
/                      marketing landing (light route, no game bundle)
/play                  guest/new timeline launch
/play/[timelineId]     resume a local/cloud timeline
/auth/sign-in          auth flows
/auth/callback
/account               save/account/subscription management
/billing/success       Stripe return
/api/billing/checkout  create Stripe checkout session
/api/billing/portal    create customer portal session
/api/billing/webhook   Stripe webhook
/api/timelines         cloud timeline sync (RLS-backed)
```

The in-game OS does **not** use URL navigation for individual apps/windows. Window/app state is
game state.

## 6. Repository architecture

See `docs/ARCHITECTURE.md`.

## 7. Game engine rules

**Event-sourced.** Every meaningful player action emits a typed event. UI/game state is derived
from `reduce(state, event, content)`. The event log is kept so saves can be debugged, replayed
and migrated.

**Integer money.** Money is stored as integer cents. Never floating point for authoritative
balances.

**Deterministic by default.** Day 01 is authored and deterministic. Any later randomness uses a
seeded PRNG (`engine/seed.ts`) recorded in the timeline.

**Data-driven content.** Emails, dialogue, browser pages, evidence, claims, recall memories,
economy opportunities and temporal shifts live under `content/`, validated by Zod. React
components render content; they never own narrative truth.

## 8. Core state model

`engine/types.ts#TimelineState`. Do **not** expose all of it as a permanent HUD.

## 9. Window manager

`components/game/WindowManager.tsx` — open/focus/close/minimize, z-order, Pointer Events drag,
viewport clamping, cascade, persisted positions, keyboard focus, double-click titlebar zoom, and
a mobile fallback (single foregrounded window + dock task switcher).

## 10–14

See `docs/PRODUCT_SPEC.md` for apps, investigation, Recall, the fictional Browser and the
temporal engine.

## 15. Persistence

Guest: local UUID timeline, debounced IndexedDB autosave of event log + latest snapshot.
Authenticated: Supabase Auth (cookie/SSR). After Day 01 the local timeline can be claimed and
synced once; the server then owns cloud state. RLS restricts rows to their owner. Every timeline
carries `schemaVersion` and passes through `lib/persistence/migrations.ts`.

## 16. Database

See `supabase/migrations/`. Never store Stripe secret keys or service-role keys in the client.

## 17. Subscription/paywall boundary

Landing and Day 01 are free and account-free. At Day 01 end: cliffhanger, then summary.
"Continue Day 02" requires saving/claiming the timeline. **Entitlement is checked server-side**
(`lib/billing/entitlement.ts`). Unentitled users are sent to Stripe Checkout. Plans/prices come
from `lib/billing/plans.ts` reading env, never from component strings.

## 18. Analytics

Typed adapter in `lib/analytics/`. Never send note contents, freeform Recall queries, message
drafts, or other private text.

## 19. Errors and observability

Error boundary around the game shell; graceful local-save failure; Stripe webhook idempotency;
server logging adapter; dev debug panel behind `NEXT_PUBLIC_DEBUG_PANEL` only.

## 20. Performance

Light landing route; lazy-loaded game bundle and heavy apps; no rerender storms while dragging
(transforms during drag, commit on release); `prefers-reduced-motion` respected; no layout shift
during boot→desktop.

## 21. Mobile

HALCYON remains the shell. One foregrounded app window at a time, dock/task switcher, phone as
full-height in-world overlay, evidence tray as bottom sheet, board as a full-screen workspace.
Never miniaturize the whole desktop.

## 22. Accessibility

Keyboard access to dock/apps/windows; visible period-appropriate focus states; Escape closes
overlays when safe; reduced motion; optional sound with a mute state; semantic buttons/inputs
despite period styling; never rely on color alone for evidence/verdict states.

## 23. Testing

Unit: money invariants, evidence pinning idempotency, Recall cost/degradation, claim requirement
logic, temporal article mutation, Day 01 gating, save migration, engine purity.
E2E: the full Day 01 golden path (`tests/e2e/day01.spec.ts`).

## 24. Definition of done

```
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:e2e -- --project=chromium
```
