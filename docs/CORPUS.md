# Authoring the world

`docs/AUTHORING.md` covers a **day**: the thirty hours the player spends in front of the machine,
the mail that arrives, the claim they can assert. This covers the **world** those hours happen
inside — the corpus in `content/world/`, which is everything the machine can find that no day put
there on purpose.

The two are one graph. `content/index.ts` projects every authored day into the corpus so that a
player searching "Marc" reaches the mail they actually read, not a second Marc who exists only in
a database. There is exactly one world, and days are events in it.

## The rule everything else follows

**One fact, many surfaces.**

A fact is a thing that is true in this world. It is never carried by one document. It is carried
by four, or six, on four or six different surfaces, and any two or three of them are enough for a
player to act on. The remaining ones are why the world feels larger than the case.

The reason is not redundancy for its own sake. A fact on one document is a key: find it and there
was nothing to work out, miss it and the chain is dead. A fact on six documents is an
investigation — the player assembles it, and two players assemble it from different halves.

`tests/unit/content.test.ts` fails the build for a fact with fewer than two traces.

## The density target

Per hundred pages a player might read:

| Register     | Share | What it is                                                                     |
| ------------ | ----- | ------------------------------------------------------------------------------ |
| `ordinary`   | ~65   | A band broke up. A cat is missing. Somebody is selling a kiln.                 |
| `economic`   | ~20   | January 2009. A branch closes, a shift is cut, an auction is scheduled.        |
| `sideStory`  | ~10   | A complete small story with a beginning and an end. Not about the case.        |
| `suggestive` | ~4    | Ordinary on its face, wrong once you hold something else.                      |
| `anomalous`  | ~1    | Cannot be explained by anything in the world. One per season, not one per day. |

> If every site on the web is about AION TIME TRAVEL MARC MYSTERY, the world looks artificial
> inside twenty minutes.

An artifact with no `factId` carries no plot, and is counted as ordinary — which is what it is.

The ratio converges by **adding ordinary pages**, not by removing plot ones. A plot fact needs
four to six traces to be solvable from any two, so the suggestive layer has a floor; three plot
facts at five traces each is fifteen artifacts, and fifteen artifacts is 4% only once there are
roughly three hundred and seventy of them. The test asserts wide bounds and its failure message
prints the current shape.

## The four kinds of thing

### Entity

A person, organisation, place, vehicle, account, handle, domain or device. `aliases` is what lets
`saabman81` and `m.deleon` reach the same man; every alias is indexed, so an alias that is a
common word makes the search useless.

`metadata` is an address-book entry — it is shown, in full, the moment the player has read one
thing that mentions this entity. Nothing goes in it that the fiction has not already put within
reach.

### Artifact

A document. It has a `surface` (which application shows it), a `source` (where it lives, in the
world's own words), an ISO `date`, and `mentions` — the entities it is evidence about, which are
the edges of the graph.

**Every artifact on `web` or `archive` must have an address.** `artifactUrl()` takes an explicit
`url`, or derives one from `source` when the source is already URL-shaped
(`geohost.com/Terminal/4417`). A page nobody can type their way to is not on the web, and the test
suite fails for one. Two artifacts must never share an address — the index keeps the first and
drops the rest in silence.

Addresses on other surfaces are ignored. A bank statement whose source reads like a hostname is
still a bank statement.

An `archive` artifact is a page _as it was_. Give it its own address; if it shares one with the
live page, the live page wins and the capture disappears.

**A site is the folder its pages sit in, not the host.** `siteOf` drops a filename segment and
keeps the rest, so `geohost.com/Terminal/4417/links.html` and `…/stock.html` are one site with
`…/4417` as its front page, while `geohost.com/Meadow/2210` is somebody else entirely. The browser
puts the rest of the site in a nav bar under any corpus page. Nothing has to be declared; the
failure mode is a page with no nav bar, never a nav bar belonging to a stranger.

**The corpus does not describe a page a day authors.** One page, one owner. A day's page is
designed — palette, blocks, temporal variants — and a corpus entry at the same address is the
same page listed twice in the search. If a page needs graph metadata, either the day authors it
and the projection carries it, or the corpus owns it and the day links to it.

### Fact

A statement, the entities it is `about`, and its `register` from the table above. The statement is
authoring prose — the player never sees it. It exists so that the traces of one truth can be
counted, and so `factCoverage` can tell the player they have two of six.

### Relation

An edge between two entities, with a `confidence`:

| Confidence | Means                               | Shown as                           |
| ---------- | ----------------------------------- | ---------------------------------- |
| `asserted` | A document says so                  | A plain sentence                   |
| `inferred` | The player could work it out        | The sentence, marked as their work |
| `rumoured` | Somebody claims it and may be wrong | Reported speech: "Somebody says…"  |

The grammar carries the difference, not colour. A rumour written in the same sentence shape as a
document _is_ the problem.

**A relation has to be reachable.** The entity page shows it only when the player holds something
that grounds it:

- `asserted` and `rumoured` need one discovered artifact naming **both** ends.
- `inferred` needs only that both ends have been met — that is what working it out means.
- `sources` overrides either, and is how you say where a rumour was actually voiced. Use it when
  the document that carries the claim never names one of the parties: an anonymous post everybody
  knows is Marc.

A relation nothing supports does not throw and does not fail to render. It simply never appears,
and you never find out. The test suite fails for one.

## Saying a document is wrong

The whole premise is that one of these is a lie. Two fields say so, and **neither reaches a
screen**:

- `reliability` — `reliable`, `mistaken` (sincerely wrong: a clock nobody reset, a neighbour sure
  it was Tuesday), or `deceptive` (written to be believed by someone who would check).
- `contradicts` — artifact ids this one cannot both be true with. Declared in one direction, read
  in both.
- `disputedClaim` — the line of _this_ document that is at issue, quoted. A document is rarely
  wholly false: the email that says "stayed in all evening" also says "call me tomorrow, i have
  something that pays", and the second is true and is the hook into the next day. This is what
  the machine puts on screen, so the player reads the disagreement rather than being told there
  is one. A day's mail and files carry the same field, so a day can name its own contestable
  line.

The player is never told which document is false. They are told that two things they hold cannot
both be true, with both set side by side and the machine picking neither. A page that named the
forgery would be an answer key.

**Every untrue document must be catchable.** The test suite fails for a `mistaken` or `deceptive`
artifact that nothing in the world disagrees with, because a lie the player cannot catch is not a
lie — it is the world telling them something false with no way to know.

The most useful contradictions cross headings. Marc's "stayed in all evening" is a Day 01 email;
the parking stub that refutes it is a corpus document dated the night before. Nobody filed them
together, which is why finding it feels like work rather than like being told.

## How the player reaches any of it

| Route                    | What it does                                                                              |
| ------------------------ | ----------------------------------------------------------------------------------------- |
| Search (`Ctrl+K`)        | Everything, always — with counts per surface, so the world looks larger than the question |
| "Only what I have found" | The same search, restricted to what has been discovered                                   |
| Directory                | Only entities already met. Never a cast list.                                             |
| Browser                  | Any address, authored or corpus                                                           |

The world is cut to the date being played. Every authored day is projected into one graph, so
`worldAsOf` drops anything written later — documents, and the names that appear only in them. A
machine on the fifteenth has no business answering questions about the twentieth, and an entity
left searchable with all its documents removed is worse than either extreme: the player learns
somebody exists, from a machine that cannot say why.

Discovery is derived in the reducer, not dispatched by screens: opening a mail, a file, the bank,
the phone, or navigating to a page marks the corresponding artifact found. A component that forgot
to dispatch would leave a document the player has demonstrably read permanently unfindable.

Nothing gates the _search_ by discovery, deliberately. The player can find a name they have never
met — and the directory will tell them so, and nothing else. The tease is the point; the briefing
is the leak.

## Before you commit

```
npx tsc --noEmit
npx vitest run tests/unit/content.test.ts tests/unit/world.test.ts
npx prettier --check content
```

`tests/unit/content.test.ts` is the corpus report. It fails with the numbers in the message:
unreachable pages, colliding addresses, ungrounded relations, uncatchable lies, single-trace
facts, and the register shape.
