# UNLISTED — Product Spec

`CLAUDE.md` is the contract. This is the detail underneath it, written against what the code and
`content/cases/case001/` actually ship rather than against an intention. Where a number appears
here it is authored somewhere real, and the file it is authored in is named.

The spec this replaced described **2009** — a thirty-day business simulation with a memory
mechanic and a cash quota. That product is complete on `archive/2009` and described in
[`ARCHIVE_2009.md`](ARCHIVE_2009.md). Nothing below is about it.

## Canonical world

| Field         | Value                                | Authored in                 |
| ------------- | ------------------------------------ | --------------------------- |
| Case          | 001 — He Never Came Home (`case001`) | `title`, `number`           |
| Date          | Wednesday, 17 June 2026              | `dateISO`                   |
| Session start | 19:12, running 260 in-world minutes  | `startMinute`               |
| Location      | Portland, Oregon                     | `location`                  |
| Currency      | USD                                  | —                           |
| Investigator  | the player, under their own name     | `investigator`              |
| Workstation   | NOVA 3.2 (build 3.2.114)             | `osName`, `boot`            |
| Platform      | UNLISTED                             | —                           |
| Client        | Claire Mercer                        | `client`                    |
| Subject       | Daniel Mercer, missing since 9 June  | `summary`                   |
| Cast          | Richard Vale, Nadia Okafor           | `content/world/entities.ts` |

There is no balance, no quota, no day counter and no season. **The unit is a case.**

## Stage machine

`intake → boot → playing → report`

- **intake** — the state a fresh investigation is created in. The landing route (`/`) is an
  ordinary web page with no game bundle; opening the case is the last ordinary chrome the player
  sees.
- **boot** — the NOVA console ticker: seven authored lines at 170 ms, then a 700 ms hold
  (`boot`, `bootIntervalMs`, `bootHoldMs`). Every one of these is a timer in `GameRoot.tsx`, and
  `pace()` collapses them when the player has asked for reduced motion.
- **playing** — the full-viewport workstation. At 1100 ms Dispatch opens itself with a message
  (`messengerOpensAtMs`); at 2600 ms the intake note appears on the desktop
  (`desktopIconAtMs`, `desktopIconFileId`).
- **report** — every window closes, the surveillance overlay holds for 3400 ms
  (`report.surveillanceDelayMs`), then the report card.

## Applications

Which applications exist is the **case's** decision, not the build's. `WindowManager.tsx` holds
the registry of what this build can render; the case's `apps` array is the roster, and an app a
case names that this build does not have renders as a window saying so rather than as a crash.

| App id      | Title      | Window  |
| ----------- | ---------- | ------- |
| `mail`      | Relay Mail | 640×410 |
| `msg`       | Dispatch   | 318×392 |
| `web`       | Orbit      | 720×472 |
| `files`     | Files      | 792×468 |
| `photos`    | Photos     | 668×472 |
| `devices`   | Devices    | 520×380 |
| `notes`     | Notes      | 352×300 |
| `term`      | Console    | 568×328 |
| `directory` | Directory  | 640×420 |

Not applications, and deliberately so: the **phone** is an in-world overlay you can pick up and
put down, the **evidence tray** is a collapsible strip, the **investigation board**, the **relay
console** and **Quick Look** are focused modes that take the screen. None of them is a tab, and
none of them is a permanent navigation rail.

## Documents

A document declares what it is — `note`, `letter`, `sheet`, `scan`, `audio`, `encrypted` — and
the reader draws it as that. A spreadsheet is a table with row numbers and the comment somebody
left in a cell; a receipt is paper off a flatbed; a voicemail is a transport over a transcript
that is legible whether or not it is ever played. `engine/documents.ts` does the reading,
`components/game/DocumentView.tsx` does the drawing, and no component decides what a document
says. The authoring rules are in [`AUTHORING.md`](AUTHORING.md).

**Space** holds the selected document up over the machine and Space again puts it down. Quick
Look renders the same `DocumentView` the reader does — a preview that is a reduced version of a
document is a second place for a document to be wrong.

## Sources

The workstation is the machine; a phone, a disk image or a drive is a **source attached to it**,
and a case may attach two, one or none. Case 001 attaches two:

| Device       | Kind   | State at intake            | What opens it                             |
| ------------ | ------ | -------------------------- | ----------------------------------------- |
| `dev-phone`  | phone  | connected, **locked**      | `190455`, written down in `passcodes.txt` |
| `dev-laptop` | laptop | connected, open, read-only | —                                         |

A locked source yields nothing, and the rule holds on every surface: the handset shows a lock
screen instead of its thread, and a photograph taken on it is in neither the phone's roll nor the
workstation's viewer until somebody opens it. `tests/unit/content.test.ts` fails a case that locks
a device nothing in it can open.

## Investigation

Evidence is a first-class object (`engine/types.ts#Evidence`), and the loop is:

**discover → pin → tray → board → select evidence → assert claim → consequence.**

A claim requires an _exact_ evidence set — no extras, no omissions. Verdicts:

- `ACCEPTED` — the set is right and the claim is sound.
- `INSUFFICIENT` — the set is not right.
- `REFUSED` — the claim is unsound however it is supported. It is **filed anyway, under the
  player's name**, and the report says so.

Case 001 authors four claims. `c1`, `c2` and `c4` are sound; `c3` — "Daniel Mercer left Portland
of his own accord" — is the one that can never be accepted and is filed regardless.

**No sound claim may need evidence that is behind a paid service.** This is the rule the business
model rests on and it fails the build, not a refund request (`tests/unit/content.test.ts`).

## The report gate

`requiredBeats` decides when a report can be filed. Case 001 asks for three:

| Beat        | Fired by                         |
| ----------- | -------------------------------- |
| `statement` | opening `draft-statement-v3.doc` |
| `claire`    | answering the client in Dispatch |
| `claim`     | asserting any claim on the board |

`beatHints` supplies the line the gate shows for each outstanding beat. It used to be a hardcoded
map in the menu bar naming Day 01's characters, which meant the second case would have told the
player to answer somebody who is not in it.

## The report

Consequences are content, not a meter. `report.deeds` templates read state that already exists —
how much was pinned, how many findings were filed under the player's name, which sources were
opened, how many characters were typed into a notebook that is not theirs, how many lines were
carried in from outside the case — and `report.deeds.flagged` adds a line per world flag the
session set: telling Vale you were looking, decrypting a filing on a read-only image, getting
into the handset with the client's permission and not the subject's.

Then: the save ask. `report.saveHeadline`, `saveBody`, `primaryCta`, and `priceLine`, which says
Case 001 is free and always will be.

## Dialogue

Every choice answers itself. A `Choice` carries the reply it earns, and may also **hold the
conversation** (`advances: false`), **set a world flag** (`setsFlag`) — which is how a
conversation reaches out and changes a page — or **require evidence** (`requiresEvidence`), so an
accusation is unavailable until the player is holding the thing that proves it.

The load-bearing example in Case 001: telling Richard Vale you are looking sets `valeNotified`,
and Ridgeline Partners' own website loses a sentence. The report notices.

## The fictional Browser

A closed internet — and an actual _web_, not a set of islands.

- **Search** runs against an internal index only. It never calls a real search engine; the relay
  is the only route out.
- **Every page has an address**, two documents may never share one, and the case's pages and the
  corpus are one internet. `tests/unit/browser.test.ts` walks the link graph and fails if a page
  becomes an island or a link points at a page that does not exist.
- **The Directory** is the way in when the player does not know what to search for, and it holds
  only what this machine has learned. It is never a cast list.
- **Back, forward and the address bar** all work. The bar forgives a scheme, a `www.`, a trailing
  slash and stray case. An unknown host gets an in-period error page.
- **A page may change**, keyed on a world flag, at the same URL — and says that it changed.

## The relay

The only route to the open web, and it is metered. Case 001 authors `signalBudget: 24`, a search
at 1 and an open at 2, and it is **not available at start**: the player has to find the process
running and open the line (`relay.availableAtStart: false`).

What comes back is an **immutable snapshot**, captured once and referenced by id, so a replay
shows the bytes the player read rather than whatever the site says today. Keeping a line records
its provenance — the excerpt, its hash, the address and the title as they stood at capture — and
costs exposure. Every refusal the route can produce has an authored line; none of the server's own
wording reaches the player. See [`RELAY_PERSISTENCE.md`](RELAY_PERSISTENCE.md).

## Commercial boundary

Case 001 is free and account-free, start to finish, with no account prompt until the case has
earned it. Another case requires an entitled account, and **entitlement is resolved server-side**
(`lib/billing/entitlement.ts`); the client only renders the answer.

**Forensic services** are one-time purchases offered inside a case — Case 001 offers one, the
recovery of 90 further days of call metadata. Two rules hold them honest and both are code:
`services` on the state is a projection of a server-side entitlement and never the check, and no
sound claim may require what is behind one. No price, no card field and no purchase happens inside
the fiction: recovery is offered in-world and bought on `/account`, where a purchase looks like a
purchase.
