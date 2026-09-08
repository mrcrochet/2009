# Authoring a mystery

The premise of this document is that real internet mysteries are the richest available source of
**structure** for this game, and the most dangerous available source of **content**. The rule
that follows from that is one line:

> Use real mysteries as a grammar, never as a canon of conspiracy.

A mechanism — clues hidden across several media, a broadcast with no sender, a community
reconstructing a story from fragments — is a shape anyone may build with. The texts, images,
puzzles, characters and causalities of an existing work are not. And the cases with the most
compelling structure are very often the ones entangled with a real death, a real crime, or an
accusation about a real person that was never established.

## Three layers of truth

| Layer                     | What it is                                                                                                       | What it may do                                                                                                                                                             |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Historical Web**        | The web that really existed: services, archives, cultural events, the first Bitcoin posts, the free hosts dying. | State facts, with a citation. Never recast a real person as a character in a conspiracy.                                                                                   |
| **Fictional Shadow Web**  | Aion, Meridian, Corvid, GeoHost, nullcache, the Quiet Line — everything we invented.                             | Anything. This is where borrowed _shapes_ get rebuilt from scratch with our own names, documents and causalities.                                                          |
| **Way Up / Temporal Web** | The real present-day internet, captured as immutable snapshots, plus the anomalies belonging to a timeline.      | A real source is never altered to make it say something false. Fictional material stays structurally separate in the data model even while it is mysterious to the player. |

Roughly 70% of the season should be wholly original, 20% contextualised historical web
archaeology, and 10% documentary reference. That ratio is what gives the world the texture of
the real 2009 without turning the game into an aggregator of theories about real people.

## The contract, and what the build enforces

Every mystery is a `MysterySchema` object in `content/mysteries/`. Several parts of the editorial
rule are not advice here; they fail `npm run test`:

- `legal.realPersons` must be **literally false**. Not absent — asserted, so an author has to
  look at it.
- `legal.copiedAssets: true` is rejected outright.
- `mode: 'historical'` without `sources` is rejected. A fact the player can check is worth more
  than one they must take on faith, and an unsourced historical claim is a rumour with better
  typography.
- `mode: 'fictionalized'` without `structuralInspiration` is rejected, so a reviewer can judge
  the distance kept from whatever lent its shape.
- **There is no mode meaning "adapts a real unsolved case."** The schema does not offer it.
- Every `unlock` condition must point at evidence, a page or a mystery that actually exists.
- `legal.reviewed` is a human sign-off, and the suite reports how many mysteries lean on it. A
  growing number is a smell, not a pass.

## Notation

`timelineDependency` — how far the content bends to what the player did.

`T0` static · `T1` small variants · `T2` conditioned on divergence · `T3` depends on Way Up
observations or contradictions between them · `T4` shared across players.

Higher is not better. Each step up is a step away from a save that replays from its own log.

`signalCost` — what looking into 2026 costs, in narrative rather than in requests.

`0` local 2009 · `1–3` an archive or a single snapshot · `4–6` a search or a second hop ·
`7–9` a source that is temporally unstable or deeply hidden · `10–12` reserved for the rare
world-level anomaly. A day that spends 10 on something ordinary has spent the word's meaning
along with it.

## Rules of construction

**A local answer need not resolve the whole thing.** Finding that a packet reads
`11:42 / PORT 1705` can finish a day's investigation and open a question that stays open for a
chapter. `leavesOpen` is a required field for that reason.

**Not every anomaly is Aion.** If every thread leads back to one antagonist the world collapses
to a single explanation very quickly. Some things come from Aion, some from other travellers,
some are the ordinary behaviour of a relay reaching seventeen years, and some are never
explained.

**A global mystery's payoff is a change in the world**, never a number going up. A page appears;
every player receives the same mail at the same minute; an old document's checksum stops
matching. `fragmentsRequired` must exceed one, because the point is that somebody has to talk to
a stranger.

**The relay observes; it does not adjudicate.** Web pages change for ordinary reasons, and web
archives are incomplete for ordinary reasons. The interface says _the remote document changed_.
It never says _the timeline changed_. Deciding which it was is the player's job, and sometimes
there is no answer.

## The line to hold

> The closer a mystery comes to a real death, a real crime, a private person, a minor, an
> anonymous identity or an unestablished accusation, the further the fiction moves from the
> source.

At the far end of that scale the correct answer is to take the _structure_ and nothing else —
no names, no dates, no locations, no quoted material, and no reference in any shipped file to
the case that inspired it. Where the structure is genuinely inseparable from the harm, the
answer is not to build it.

This is an editorial standard, not legal advice. Anything touching a real person should be read
by someone qualified before it ships.

## Worked example: The Dead City

`content/mysteries/dead-city.ts`, and the reason it is first.

A scheduling fact drove the design. The large free host really did die in 2009 — announced in
April, deleted in October — while Season 1 runs 15 January to roughly 14 February. **The real
event falls entirely outside the window the player is standing in.** It cannot be watched.

That is better than watching it. The player is from 2026 and can Recall that the free hosts die
this year, months before anyone in 2009 has been told. What they act on is not news; it is
foreknowledge, which is the premise of the game.

So the layers separate exactly as they should: the real closure is a **cited fact** reachable
through Recall, and `geohost.com` is **ours**, dying on our schedule, inside the season. Nine
ordinary pages — model trains, a wedding, a fan club — carry the same graphic from the same
address since 1998. Seven have already been removed by their owners.

Nothing about the real host is bent to fit.
