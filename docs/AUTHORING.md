# Authoring a case

The architectural claim in `CLAUDE.md` is that **a second case is content, not a rewrite**. This
document is how that claim is cashed. If adding a case requires editing `engine/` or
`components/`, either the case needs a genuinely new mechanic — or the design is wrong and this
guide should be updated to say why.

## The shape of a case

A case is one object satisfying `CaseContentSchema` (`engine/case-schema.ts`), assembled in
`content/cases/<id>/index.ts` and registered in `content/index.ts`:

```ts
const BY_CASE: Readonly<Record<string, CaseContent>> = { case001: CASE_001 }
```

That registration is the only file outside `content/cases/<id>/` that a new case touches.

Content is parsed at module load, so a malformed case fails the build rather than a player's
session. `tests/unit/content.test.ts` is the corpus report: it checks every claim's evidence is
reachable, every search result that promises a page has one, every device the case locks can be
opened, every photograph names a source, every recording carries a recording, and that no emoji
or leftover token from the old product survives anywhere.

## What a case declares

| Block                     | What it decides                                                                 |
| ------------------------- | ------------------------------------------------------------------------------- |
| `apps`, `dock`            | Which applications exist on this workstation, and what each is called           |
| `devices`                 | The sources on the desk, what locks them and what opens them                    |
| `services`                | What forensic recovery is offered, and what it grants                           |
| `evidence`                | What can be pinned, where it came from, how reliable it is                      |
| `claims`                  | What can be asserted, the **exact** evidence set each needs, which are unsound  |
| `mail`, `unknownMail`     | The inbox, and the letter that reads the session back                           |
| `threads`                 | Conversations, and what each choice actually does                               |
| `browser`                 | Pages, links, the search index, bookmarks, and flag-keyed variants              |
| `files`                   | The documents, their nature, and what is sealed                                 |
| `photos`                  | Everything with a picture in it, and the source it came off                     |
| `terminal`                | Commands, and the two or three that reward curiosity                            |
| `relay`                   | The line out to the open web, and what it costs — `null` for a case without one |
| `phone`                   | The handset's screen: SMS and contacts — `null` for a case without one          |
| `report`, `requiredBeats` | What has to have happened, and what the session is read back as                 |

## Five rules that are not negotiable

**1. A claim needs its exact evidence set.** Not a subset, not a superset. `evaluateClaim` is
deliberately strict: relying on more than the claim needs is as wrong as relying on less. Author
at least one `sound: false` claim per case — a claim that can never be accepted, is filed under
the player's name anyway, and comes back at them.

**2. Every choice answers itself.** A `Choice` carries the `reply` it earns. A choice that
appends nothing and lets the script continue teaches the player, in ten seconds, that nothing
they say matters. Use `advances: false` to hold a conversation open, `setsFlag` to reach out of
it, and `requiresEvidence` to withhold a question until the player can back it.

**3. Consequence is content, never a meter.** If a case accumulates exposure, a flag, a purchase
or a kept line and none of it surfaces by the end, that is a hole the player will feel.
`report.deeds` and `report.deeds.flagged` are where a case spends what it collected.

**4. The case must be closeable without paying.** A forensic service may deepen a case; it may
never _be_ the case. If the only sound claim rests on evidence behind a service, the thing being
sold is the ending — and `tests/unit/content.test.ts` fails the build rather than a refund
request.

**5. The world is a web.** Every page needs a route in that is not typing a URL: an index entry,
a bookmark, a link from another page, or a directory listing. `tests/unit/browser.test.ts` walks
the link graph and fails on an island or a dangling link.

## Documents have a nature

A document declares **what it is**, and the build draws it as that. This replaced `icon`, which
was the same fact stated wrongly — a file said how it should look in a list, and so the parking
receipt reached the reader as a column of monospace text with a photograph for an icon.

| `kind`      | What it is, and what the reader draws                                         |
| ----------- | ----------------------------------------------------------------------------- |
| `note`      | Somebody's plain text. Monospace, as it was typed.                            |
| `letter`    | A word-processor document: a page, margins, paragraphs. First line is a head. |
| `sheet`     | Delimited rows. Rendered as the table it already is.                          |
| `scan`      | Paper that went through a scanner: off square, with the lid's shadow.         |
| `audio`     | A recording. Carries `audio`, and is read as much as it is heard.             |
| `encrypted` | Sealed. `kindWhenDecrypted` says what it turns out to be.                     |

Three things follow from this, and each of them fails the build rather than a playtest:

- **A sheet is authored as delimited text**, header row first. `engine/documents.ts` reads it;
  no author writes table markup. A line that is not a row — a `TOTAL`, a truncation note, a
  `[cell comment, D1]` — is kept and printed in the margin rather than dropped. Numeric columns
  are detected and grouped; a column is numeric only if _every_ cell in it is.
- **A recording carries a record, never a media file.** No audio ships — the rule that sound is
  generated at runtime is not suspended because the sound is content — so `audio` is
  `durationSec`, a `channel` line, and `cues` at their timecodes. The waveform is derived from
  the document's id, so it is the same in a replay as it was in the session. **The transcript is
  legible without pressing play**: a document a player cannot read with the sound off is a
  document the case did not really give them. A cue with an empty `who` is a sound that is not
  speech — a line staying open, a door.
- **A scan is still text.** Author the words; the paper, the skew and the banding are the
  build's.

## Photographs belong to a source

`photos` is authored on the case, not on the phone, and each one names the `sourceId` it came
off — a device in `devices`, or `null` for something the case simply supplied.

That one field is what makes both surfaces honest. The handset's roll shows a picture and the
line a phone would print under it; the workstation's viewer shows the same file with `detail` —
what the extraction found. **A picture off a source nobody has unlocked is not on this machine**,
so it is on neither surface, and the corpus holds one photograph rather than two copies of one.

A photo naming a device the case never attached fails `tests/unit/content.test.ts`, because it
is a file no player could ever reach.

## Making the world change

A page variant keys on a decision the player made:

```ts
variants: [{ whenFlag: 'valeNotified', blocks: [...] }]
```

The load-bearing example in Case 001: telling Richard Vale you are looking sets `valeNotified`,
and Ridgeline Partners' own site loses a sentence. Same address, different page, and the report
says what you did to get it. A page that rewrites itself for no reason the player can trace is
atmosphere; a page that changes because they picked up the telephone is the game.

## What the surfaces cost to get right

The case is the unit, and every one of these was found by authoring rather than by design:

- **A document that only said how it should look.** `icon` described a list glyph, so a scanned
  receipt and a spreadsheet arrived at the reader as the same block of monospace text. A document
  declares its `kind` now, and the glyph is derived from it, so the two can no longer disagree.
- **A photograph that belonged to a window.** Photos were authored inside `phone`, which made the
  workstation's viewer either impossible or a second copy. They belong to the case and name their
  source, and both surfaces read the same files.
- **A locked source that was not locked.** The handset showed its thread, its roll and its
  contacts whatever the device said, which made the passcode the case hides — and the beat that
  fires on finding it — decoration.
- **A hardcoded map of one case's beats.** The report gate named Day 01's characters from inside
  the menu bar, so the second case would have told the player to answer somebody who is not in
  it. It is `beatHints` now.
- **An application id that was a closed union of ten.** A case that opens with a disk-image
  viewer and no mail client is the one thing a case-shaped product has to be able to ship.

## The relay

A case with a line out authors a `relay` block (`RelayConfigSchema`) and a `terminal.relay`
block. `null` in either means the process is not on this machine.

Every word the console says is authored. The register is a Unix daemon's — it reports carrier and
bytes and refusals, never explains itself, and never speaks in the voice of the product. One line
of that written in a component and the fiction starts sounding like software describing itself.

Three prices, all the case's decision: `searchCost` to ask, `openCost` to open one of the answers,
and `keepExposure` to carry a line back. Signal buys the looking; exposure is the price of the
carrying, because a sentence from outside the case is now inside it.

The one field takes either a question or an address, and the console works out which. Asking
needs an index and there may not be one; dialling needs nothing but the address. On a deployment
with no provider, dialling is the whole of what the relay can do — which is what the authored
offline copy already says.

A kept line is shown in the tray and on the board and is **never selectable for a claim**. It came
from outside the case and nothing inside the case can be made to rest on it. That is the spend:
building your file beside a paragraph you know is true and cannot use.

## Mysteries

A case is not the world. The corpus every case is searched against — and projected into — is
authored separately; see [`CORPUS.md`](CORPUS.md).

A mystery is not a case. See [`MYSTERY_AUTHORING.md`](MYSTERY_AUTHORING.md) for the editorial
framework, what the build enforces about it, and why there is no mode meaning "adapts a real
unsolved case".

## When a case genuinely needs new machinery

Add it to `engine/`, then:

1. Add the event to the `GameEvent` union **and** to `GAME_EVENT_TYPES` — `satisfies` makes the
   second a compile error if you forget.
2. Extend `engine/investigation-schema.ts` if it adds state.
3. Bump `SCHEMA_VERSION` and append a migration step. The chain must stay contiguous;
   `tests/unit/migrations.test.ts` checks that.
4. Keep the reducer pure. Timers live in `components/game/GameRoot.tsx` and dispatch ordinary
   events, which is what keeps `tests/unit/replay.test.ts` green.

## The voice

Flat, precise, second person. No exclamation marks, no jokes, no winking at the reader. The
people writing inside a case are tired, careful, and not performing for anybody. Nothing on this
machine is aware it is in a product, and nothing written for it should sound like marketing for
the thing it is part of.
