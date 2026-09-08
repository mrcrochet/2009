# 2009 — Product Spec (v1, Day 01)

## Canonical world

| Field           | Value                                      |
| --------------- | ------------------------------------------ |
| Date            | Thursday, 15 January 2009                  |
| Wake time       | 07:32                                      |
| Location        | Portland, Oregon                           |
| Currency        | USD (stored as integer cents)              |
| Player identity | Owen T. Rask (not the player's own)        |
| Fictional OS    | HALCYON 4.1 (build 4.1.882)                |
| Bank            | Meridian Savings & Loan, checking ····4471 |
| Opening balance | $437.82 (43782 cents)                      |
| Core mystery    | Aion Group                                 |
| Contacts        | Marc Deleon, Lea Voss, "M"                 |
| Quota           | $10,000.00 within 30 days                  |

## Stage machine

`landing → boot → playing → day-end`

- **landing** — the marketing surface. One action: `WAKE UP`.
- **boot** — HALCYON 4.1 console boot, 10 lines at 170ms, then a 700ms hold.
- **playing** — full-viewport HALCYON desktop. After 1100ms Ember Messenger opens itself with a
  message from an unknown handle. After 2600ms `READ_ME.txt` appears on the desktop.
- **day-end** — surveillance reveal (3400ms), then the Day 01 summary card.

## Applications (Day 01)

| App id   | Title            | Window                   |
| -------- | ---------------- | ------------------------ |
| `mail`   | Corvid Mail      | 640×410                  |
| `msg`    | Ember Messenger  | 318×392                  |
| `web`    | Halcyon Browser  | 720×472                  |
| `files`  | Files            | 600×352                  |
| `bank`   | Meridian Savings | 472×364                  |
| `mkt`    | Quoteline        | 520×340                  |
| `notes`  | Notes            | 352×300                  |
| `term`   | Terminal         | 568×328                  |
| `recall` | Recall           | 428×352                  |
| `phone`  | Nokora N90       | 296×552 in-world overlay |

## Investigation

Evidence is a first-class object:

```ts
{
  ;(id, source, text, discoveredBy, discoveredAt, tags, reliability)
}
```

Flow: **discover → pin → tray → board → select evidence → assert claim → consequence.**

A claim requires an _exact_ evidence set (no extras, no omissions). Verdicts:

- `ACCEPTED` — requirements met and the claim is sound.
- `INSUFFICIENT` — requirements not met.
- `REFUSED` — the claim is unsound even when "supported". It is **filed anyway, under the
  player's name**, and produces a consequence at day end.

Day 01 claims: `c1`–`c6` (see `content/day01/claims.ts`). `c4` ("Marc works for the Aion
Group") is the trap: it can never be accepted.

## Dialogue

Every choice answers itself. A choice carries the reply it earns, so asking Marc where he was on
the 14th gets an answer to _that_ question before he changes the subject. A choice may also:

- **hold the conversation** (`advances: false`), leaving the other option open;
- **set a world flag** (`setsFlag`), which is how a conversation reaches out and changes a page;
- **require evidence** (`requiresEvidence`), so an accusation is unavailable until the player is
  holding the thing that proves it.

The load-bearing example: Lea has already posted about the car parked outside her building. She
asks what to do. Tell her to write down the plate and the page gains a post; talk her out of it
and the post comes down — **and `e9` with it, so claim `c5` becomes unprovable**. The player
deletes the evidence they needed by giving advice that sounded kind. That is the game's thesis
expressed as a mechanic rather than a meter.

## Recall

Recall is **not** a chat assistant.

1. The player types a concept.
2. The engine resolves it against a structured authored memory library with synonyms.
3. Every retrieval costs **9** points of memory integrity (floor 24).
4. Confidence: `HIGH | MEDIUM | LOW | FRACTURED | NONE`.
5. Below 78 integrity, non-NONE memories degrade one step and gain a drift line. Below 52 they
   become `FRACTURED` and report two incompatible versions.
6. No grounded match returns **"No recollection."** — never an invented historical outcome.

## Fictional Browser

A closed 2009 internet simulation — and an actual _web_, not a set of islands.

- **Search** runs against an internal index only. It never calls a real search engine.
- **Every site has a front page**, and sites link to each other: the Register's business article
  links to Lea's Cluster page, Namewell's WHOIS links to the Meridian branch listing that shares
  its address, nullcache threads link to each other.
- **The Corvid Directory** (`corvid.com/directory`) is the way in when the player does not know
  what to search for. An empty result set points there rather than dead-ending.
- **A bookmarks bar** carries what was already on this machine when the player woke up —
  including `aion-group.com`, which nobody explains.
- **Back, forward and the address bar** all work. The address bar forgives a scheme, a `www.`,
  a trailing slash and stray case. An unknown host gets a period error page.
- **A link can hand the player back to the machine**: "Online Banking" on the Meridian site opens
  the Meridian Savings application rather than faking a login.
- Pages may resolve to a different variant after temporal shifts. When the business article
  changes, the Register's own front page changes with it.

`tests/unit/browser.test.ts` walks the link graph and fails if any page becomes an island or any
link points at a page that does not exist.

## Temporal engine

Three internal quantities, none of them a permanent HUD:

- `memoryIntegrity` — 100 → 24, spent by Recall.
- `divergence` — how far the world has moved from its authored baseline.
- `temporalShift` — the counter that content variants key off.

`temporalShift` increases on: a Recall retrieval (+1), registering a domain (+1), completing the
resale (+1). At `temporalShift >= 2` the Columbia Register business article resolves to its
altered variant — the same URL, different text, plus a line telling the player it changed.

## Money loop (Day 01)

1. Marc, in Ember Messenger, mentions a phone on TradePost.
2. Browser → `tradepost.com/pdx/electronics` → **BUY — MEET SELLER**: −$60.00, +45 minutes.
3. **POST FOR RESALE**: +120 minutes, then after 2.2s it sells: +$340.00, `temporalShift +1`.
4. Both legs appear in the Meridian Savings activity list.

Domains at `namewell.com/register` cost $9.95 each and each registration shifts the timeline.

Quoteline cannot trade on Day 01: placing orders requires a $2,000 brokerage deposit against a
balance that peaks at $717.82. It offers the one thing that costs no money — a **watchlist**.
Writing down what you know raises `heat`, and at 23:41 the unknown sender counts the names back.

A second TradePost listing (`tradepost-parts`, $40 → $15, 155 minutes) exists to lose. One
opportunity teaches only that future knowledge pays.

## Day 01 gate

`End day 01` appears in the menu bar only once **all five** beats are true:

| Beat     | Fired by                            |
| -------- | ----------------------------------- |
| `readme` | opening `READ_ME.txt`               |
| `marc`   | replying to Marc in Ember Messenger |
| `recall` | running a Recall retrieval          |
| `money`  | the TradePost resale completing     |
| `claim`  | asserting any claim on the board    |

## Day 01 end

1. All windows close, phone closes, tray and board close.
2. Surveillance overlay: a red pulsing indicator at the top of the screen — someone was watching.
3. A new mail arrives from `UNKNOWN` (23:39). It quotes back any claim filed under the player's
   name, escalates with `heat`, counts the characters typed into Notes (never a word of them),
   and counts the names on the watchlist.
4. The summary reports **deeds** as well as numbers — what the player did to 15 January 2009,
   every line derived from state that already exists.
5. After 3400ms the Day 01 summary card: balance, quota, memory coherence, claims on record,
   holdings, whether a page changed, and the surveillance line.
6. `CONTINUE YOUR TIMELINE` → save/auth/entitlement boundary. `Save this timeline — free` →
   account creation that claims the local timeline.

## Commercial boundary

Day 01 is free and account-free. Day 02+ requires an entitled account. Entitlement is resolved
server-side; the client only _renders_ the result.
