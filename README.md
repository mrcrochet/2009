# UNLISTED

A browser-native investigation product: part narrative game, part SaaS.

You are an investigator. A **case** arrives with whatever it arrives with — in Case 001, a
read-only image of a missing man's laptop, his handset with a passcode nobody has, and a sister
who does not believe the police. You work it at a **workstation** until you can file a report,
and what you file goes on the record under your name.

The fictional operating system, **NOVA**, is the product: once a case is open there is no website
chrome left on screen.

> This repository was **2009**, a time-travel business simulation. That product is complete on the
> branch `archive/2009`; [`docs/ARCHIVE_2009.md`](docs/ARCHIVE_2009.md) says what survived the cut
> and what did not.

## Running it

```bash
npm install
npm run dev          # http://localhost:3000
```

Case 001 is fully playable with **no configuration and no account**. Supabase, Stripe, analytics,
error reporting and the relay to the open web all degrade to a working local-only state when their
environment variables are absent — the relay's degraded state is an authored screen rather than an
error. Copy `.env.example` to `.env.local` to turn any of them on.

## Verifying it

```bash
npm run typecheck
npm run lint
npm run test                       # unit, component and content-invariant tests
npm run build
npm run test:e2e -- --project=chromium   # Case 001 end to end, the world, the narrow layout
```

## What is where

| Path                   | What it holds                                                                                                     |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `engine/`              | The pure engine — types, events, reducer, rules, selectors, the world graph. No framework, no I/O.                |
| `content/cases/`       | Authored cases: apps, devices, services, mail, threads, browser, files, terminal, relay, phone, report.           |
| `content/world/`       | The corpus the cases happen inside — entities, artifacts, relations, facts.                                       |
| `components/game/`     | The workstation: menu bar, desktop, dock, window manager, phone, evidence tray, board, search, and the apps.      |
| `state/`               | The Zustand store that wraps the reducer.                                                                         |
| `lib/`                 | Adapters: IndexedDB persistence + migrations, Supabase, Stripe, analytics, errors, the relay.                     |
| `app/`                 | Next.js routes — a light landing, the game, account, auth, billing.                                               |
| `supabase/migrations/` | Schema and row-level security.                                                                                    |

The dependency arrow points one way: `content → engine → lib → components → app`. `engine/` and
`content/` import nothing from a framework, a network client or a platform SDK, and
`tests/unit/engine-purity.test.ts` fails the build if that ever stops being true. **A second case
is content, not a rewrite** — which apps exist, which file lands on the desktop, what opens a
device and what the machine calls itself are all a case's decisions.

## Two rules the build enforces, not the copy

- **A case can be closed without paying.** Forensic recovery is a real one-time purchase offered
  inside the fiction, and no sound claim may rest on evidence behind one.
  `tests/unit/content.test.ts` fails if one does.
- **Entitlement is server-side.** `services` on the state is a projection of a grant, never the
  check; the reducer refuses to pin evidence the investigation was not granted.

## Documentation

- [`CLAUDE.md`](CLAUDE.md) — product rules, stack, and the non-negotiables
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — layering, the reducer, persistence, entitlement
- [`docs/CASE001_ACCEPTANCE.md`](docs/CASE001_ACCEPTANCE.md) — acceptance criteria mapped to tests
- [`docs/AUTHORING.md`](docs/AUTHORING.md) — how to add a case without touching the engine
- [`docs/CORPUS.md`](docs/CORPUS.md) — how to author the world cases happen inside, and what the build enforces
- [`docs/MYSTERY_AUTHORING.md`](docs/MYSTERY_AUTHORING.md) — the editorial line on real-world mysteries
- [`docs/PRODUCT_SPEC.md`](docs/PRODUCT_SPEC.md) — the detail underneath, partly superseded by the pivot
- [`docs/ARCHIVE_2009.md`](docs/ARCHIVE_2009.md) — what the previous product was, and where it lives
