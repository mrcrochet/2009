# 2009

A browser-native interactive narrative and business simulation.

You wake up on **15 January 2009** in Portland, Oregon with $437.82, an identity that is not
yours, everything you remember from 2026, and a $10,000 quota due in thirty days. You can spend
what you know about the future — but spending it moves the world, and the memories go first.

This repository is the production implementation of the Claude Design handoff kept in `design/`.
The fictional operating system, **HALCYON 4.1**, is the product: after `WAKE UP` there is no
website chrome left on screen.

## Running it

```bash
npm install
npm run dev          # http://localhost:3000
```

Day 01 is fully playable with **no configuration and no account**. Supabase, Stripe, analytics
and error reporting all degrade to a working local-only state when their environment variables
are absent. Copy `.env.example` to `.env.local` to turn any of them on.

## Verifying it

```bash
npm run typecheck
npm run lint
npm run test                       # 101 unit + component tests
npm run build
npm run test:e2e -- --project=chromium   # the full Day 01 golden path
```

## What is where

| Path                   | What it holds                                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `engine/`              | The pure game engine — types, events, reducer, rules, selectors, temporal logic. No framework, no I/O.             |
| `content/`             | Every authored word: mail, dialogue, browser pages, evidence, claims, memories, economy. Validated by Zod at load. |
| `components/game/`     | HALCYON: menu bar, desktop, dock, window manager, phone, evidence tray, investigation board, the nine apps.        |
| `state/`               | The Zustand store that wraps the reducer.                                                                          |
| `lib/`                 | Adapters: IndexedDB persistence + migrations, Supabase, Stripe, analytics, errors.                                 |
| `app/`                 | Next.js routes — a light landing, the game, account, auth, billing.                                                |
| `supabase/migrations/` | Schema and row-level security.                                                                                     |
| `design/`              | The Claude Design handoff. Reference only; never built or shipped.                                                 |

The dependency arrow points one way: `content → engine → lib → components → app`. `engine/` and
`content/` import nothing from a framework, a network client or a platform SDK, and
`tests/unit/engine-purity.test.ts` fails the build if that ever stops being true. Days 02–30 are
meant to be content, not a rewrite.

## Documentation

- [`CLAUDE.md`](CLAUDE.md) — product rules, stack, and the non-negotiables
- [`docs/PRODUCT_SPEC.md`](docs/PRODUCT_SPEC.md) — the canonical world and Day 01 in detail
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — layering, the reducer, persistence, entitlement
- [`docs/DAY01_ACCEPTANCE.md`](docs/DAY01_ACCEPTANCE.md) — acceptance criteria mapped to tests
- [`docs/AUTHORING.md`](docs/AUTHORING.md) — how to add a day without touching the engine
- [`docs/MYSTERY_AUTHORING.md`](docs/MYSTERY_AUTHORING.md) — the editorial line on real-world mysteries, and what the build enforces
