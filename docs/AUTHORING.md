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
