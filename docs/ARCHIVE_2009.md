# The 2009 archive

This repository was a different product until the pivot. **2009** was a time-travel business
simulation: the player woke on 15 January 2009 with knowledge from 2026, $437.82, an identity that
was not theirs, and a $10,000 quota due in thirty days.

It is complete, playable and green on the branch **`archive/2009`**, at commit `bc257c3`.

```
git switch archive/2009     # the whole product as it stood
git switch main             # UNLISTED
```

## What survived the cut

Most of the difficult work, because almost none of it was about 1929 dollars or a beige desktop:

| Kept                         | Why it was portable                                               |
| ---------------------------- | ----------------------------------------------------------------- |
| `engine/` reducer and events | Event sourcing is not a setting. Replay, limits and purity carried |
| `content/world/` machinery   | One fact, many surfaces; every page has an address                 |
| `WindowManager`, `WindowFrame`, the dock, the phone overlay | An OS shell is genre-agnostic |
| The relay (`wayup`)          | Reading the live web as immutable snapshots — *better* in the present |
| Persistence, RLS, billing    | The boundary never knew what year the fiction was in              |

## What did not

- `content/day01`, `content/day02` and the Portland-2009 corpus — setting-specific
- The economy: cash, the ledger, the quota, Quoteline, Meridian Savings
- **Recall** and the temporal-divergence engine — the future-memory mechanic was the premise
- The thirty-day arc, and with it `DAY_ADVANCED` and the night

## Why saves are refused rather than migrated

`lib/persistence/migrations.ts` ships an empty chain. Versions 1–12 were saves of the other game,
and there is no function from "day 4 of thirty, $717.82, 91% coherence" to an investigation on a
case. Reshaping one would hand a player a file they never built. Such a save is quarantined by the
loader, which is the correct outcome for a save of a product that no longer exists.

## If 2009 comes back

It should come back as **a case**, not as a restored branch. A case volume whose file dates are
impossible is the strongest version of that material this product can hold — and the engine that
would run it is already the one on `main`.
