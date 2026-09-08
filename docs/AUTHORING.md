# Authoring a day

The architectural claim in `CLAUDE.md` is that **Days 02–30 are content, not rewrites**. This
document is how that claim is cashed. If adding a day requires editing `engine/` or
`components/`, either the day needs a genuinely new mechanic — or the design is wrong and this
guide should be updated to say why.

## The shape of a day

A day is one object satisfying `DayContentSchema` (`engine/content-schema.ts`), assembled in
`content/dayNN/index.ts` and registered in `content/index.ts`:

```ts
const BY_DAY: Readonly<Record<number, DayContent>> = { 1: DAY_01, 2: DAY_02 }
```

That registration is the only file outside `content/dayNN/` that a new day touches.

Content is parsed at module load, so a malformed day fails the build rather than a player's
session. Run `npm run test` — `tests/unit/content.test.ts` checks the invariants that matter:
every claim's evidence is reachable, every search result that promises a page has one, every
listing has an opportunity, and no emoji or legacy Paris/euro tokens survive anywhere.

## The pieces, and what each is for

| Module        | What it decides                                                                    |
| ------------- | ---------------------------------------------------------------------------------- |
| `evidence.ts` | What can be pinned, where it came from, how reliable it is                         |
| `claims.ts`   | What can be asserted, the **exact** evidence set each needs, and which are unsound |
| `recall.ts`   | The memory library and the cost curve                                              |
| `emails.ts`   | The inbox, and the day-end letter that reads the day back                          |
| `chats.ts`    | Threads, and what each choice actually does                                        |
| `browser.ts`  | Pages, links, the search index, bookmarks, and temporal variants                   |
| `files.ts`    | The desktop, and what is locked                                                    |
| `terminal.ts` | Commands, and the two or three that reward curiosity                               |
| `economy.ts`  | Money, opportunities, quotes, the opening ledger                                   |
| `phone.ts`    | SMS, photos, contacts                                                              |

## Five rules that are not negotiable

**1. A claim needs its exact evidence set.** Not a subset, not a superset. `evaluateClaim` is
deliberately strict: relying on more than the claim needs is as wrong as relying on less. Author
at least one `sound: false` claim per day — a claim that can never be accepted, is filed under
the player's name anyway, and comes back at them.

**2. Every choice answers itself.** A `Choice` carries the `reply` it earns. A choice that
appends nothing and lets the script continue teaches the player, in ten seconds, that nothing
they say matters. Use `advances: false` to hold a conversation open, `setsFlag` to reach out of
it, and `requiresEvidence` to withhold a question until the player can back it.

**3. Consequence is content, never a meter.** If a day accumulates `heat`, a flag, a purchase or
a watchlist and none of it surfaces by the last hour, that is a hole the player will feel. The
day-end letter (`unknownMail.heatLines`, `notesLine`, `watchlistLine`) and `selectDeeds` are
where a day spends what it collected.

**4. Recall refuses more than it answers.** `NONE` is a real answer and often the better one — a
memory the player wants and cannot have is worth more than one they get. Never author a
future-knowledge tip that simply pays. Withhold the number.

**5. The world is a web.** Every page needs a route in that is not typing a URL: an index entry,
a bookmark, a link from another page, or a directory listing. `tests/unit/browser.test.ts` walks
the link graph and fails on an island or a dangling link.

## Making the world change

A page variant keys on either drift or a decision:

```ts
variants: [
  { minShift: 2, blocks: [...] },              // the timeline moved under the player
  { whenFlag: 'leaPostRemoved', blocks: [...] } // the player did this
]
```

A decision outranks drift. Only `minShift` variants count as the world having _changed under_
the player, so only those are reported in the summary — `isPageAltered` deliberately ignores
flag variants, because a page the player asked to change is not the same thing as a page
rewriting itself behind their back.

## What a second day cost

Day 02 exists. It is 2,463 lines under `content/day02/` and **one line** outside it — the
registration in `content/index.ts` — and it needed no engine or component change to author. That
is the claim above, cashed.

Authoring it found nine things, and seven were fixed rather than worked around:

- **Cross-day claims were invisible to the invariant suite.** `carriedEvidence` was never
  consulted, so every claim resting on an earlier day failed a test the engine was already
  handling correctly.
- **A claim trusted the event.** `evaluateClaim` was given the selected ids without checking the
  player held them, so "needs what you found yesterday" was a fact about the tray rather than
  about the engine.
- **Decryption was one boolean for the whole machine.** Thursday's key opened Friday's different
  file, and three wrong guesses on Thursday locked a player out of a document they had not seen.
  It is per file now, and running `decrypt` on a file opened last night still hands over the
  evidence rather than saying it worked and giving nothing.
- **`whoami` had a dead branch.** It compared an authored `e1` against a held `1:e1` and had done
  since evidence ids were namespaced, so the machine had quietly stopped saying the one thing it
  knows about the man whose name is on it.
- **The second morning had no opening.** `DAY_ADVANCED` went straight to `playing`, and every
  scripted beat — the boot console, the messenger that opens itself, the icon that appears —
  hangs off `boot → playing`. Day two arrived on a bare desktop in silence, and threw away the
  login banner, which on the sixteenth is the day's whole premise.
- **`BankApp` named `e4` in the component.** Every day for the next twenty-eight would have had
  to author an `e4` and make it the bank fact. It reads `economy.accountEvidenceId` now.
- **A purchase there was no money for did nothing, silently.** The button stayed lit and the
  reducer refused, which reads as a broken page rather than as an empty account.

Two remain, and are the known cost of the next day:

- **A day cannot post an overnight transaction.** `openingCashCents` and `openingLedger` are read
  only by `createTimeline`; `DAY_ADVANCED` preserves `cashCents` and `ledger` untouched. A day
  whose plot is money moving without the player has nowhere to say so. Day 02 expressed it
  through `accountLabel` instead, which is arguably better, but the gap is real.
- **A day cannot re-serve an address an earlier day owns.** Every browser page is projected into
  the world graph at its own URL, and two documents may not share an address. So a day needs its
  own URL space — `tradepost.com/pdx/phones` rather than `tradepost.com` again — and
  `directoryUrl`, every bookmark, and every `nav`/`link` target must be day-local. Yesterday's
  addresses still resolve, as flattened corpus pages. In practice this is a constraint that
  improves the fiction: somebody edited the bookmarks bar overnight, and that is content.

## Mysteries

A day is not the world. The corpus every day is searched against — and projected into — is
authored separately; see [`CORPUS.md`](CORPUS.md).

A mystery is not a day. See [`MYSTERY_AUTHORING.md`](MYSTERY_AUTHORING.md) for the editorial
framework, what the build enforces about it, and why there is no mode meaning "adapts a real
unsolved case".

## When a day genuinely needs new machinery

Add it to `engine/`, then:

1. Add the event to the `GameEvent` union **and** to `GAME_EVENT_TYPES` — `satisfies` makes the
   second a compile error if you forget.
2. Extend `engine/timeline-schema.ts` if it adds state.
3. Bump `SCHEMA_VERSION` and append a migration step. The chain must stay contiguous;
   `tests/unit/migrations.test.ts` checks that.
4. Keep the reducer pure. Timers live in `components/game/GameRoot.tsx` and dispatch ordinary
   events, which is what keeps `tests/unit/replay.test.ts` green.

## The voice

Flat, precise, second person. No exclamation marks, no jokes, no winking at the reader. The
narrator is frightened and being careful. A 2009 machine and the people using it do not know
what 2026 sounds like — and neither does anything they write.
