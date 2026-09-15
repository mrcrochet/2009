import { describe, expect, it } from 'vitest'
import { CaseContentSchema } from '@/engine/case-schema'
import { case001 } from '@/content/cases/case001'
import { BY_CASE, GAME_WORLD } from '@/content'
import { artifactUrl } from '@/engine/world'
import { WORLD } from '@/content/world'
import { resolveBlocks } from '@/engine/pages'
import { content } from './helpers'

/** Authored content is data, and data has to hold together. */
describe('case 001 content', () => {
  it('validates against the schema', () => {
    expect(() => CaseContentSchema.parse(case001)).not.toThrow()
  })

  it('is set in the canonical world', () => {
    expect(content.id).toBe('case001')
    expect(content.dateISO).toBe('2026-06-17')
    expect(content.location).toBe('Portland, Oregon')
    expect(content.osName).toBe('NOVA 3.2')
    expect(content.client).toBe('Claire Mercer')
  })

  it('has no leftover 2009 content', () => {
    const blob = JSON.stringify(content)
    // The machine is called NOVA now, so the old machine's name is the token to forbid.
    for (const legacy of ['HALCYON', 'Owen T. Rask', 'Aion', 'Meridian', 'Quoteline', 'Recall']) {
      expect(blob.includes(legacy), `found legacy token "${legacy}"`).toBe(false)
    }
  })

  it('ships no emoji anywhere in the authored copy', () => {
    // Emoji-by-default code points, plus any character explicitly asking for emoji presentation.
    // Text-presentation symbols a real page would print — (c), (r) — are not emoji.
    const emoji = /\p{Emoji_Presentation}|️/u
    expect(emoji.test(JSON.stringify(content))).toBe(false)
  })

  it.each(Object.entries(BY_CASE))('case %s references only evidence that exists', (_id, kase) => {
    const ids = new Set(kase.evidence.map((e) => e.id))
    for (const claim of kase.claims) {
      for (const need of claim.need) expect(ids.has(need), `${claim.id} → ${need}`).toBe(true)
    }
    // A page, a decrypt or a pin can only ever offer evidence this case authored.
    for (const page of kase.browser.pages) {
      for (const flags of [{}, everyFlag(kase)]) {
        for (const block of resolveBlocks(page, flags)) {
          if (block.kind === 'evidence') expect(ids.has(block.evidenceId)).toBe(true)
        }
      }
    }
    expect(ids.has(kase.terminal.decrypt.evidenceId)).toBe(true)
    for (const service of kase.services) {
      for (const granted of service.grantsEvidenceIds) expect(ids.has(granted)).toBe(true)
    }
  })

  /**
   * The rule the business model rests on.
   *
   * A forensic service may deepen a case. It may never *be* the case: if a sound claim can only
   * be assembled by paying, then the thing being sold is the ending, and every sentence in the
   * offer copy saying otherwise is false. This is the check that makes that promise true, and it
   * fails the build rather than a refund request.
   */
  it.each(Object.entries(BY_CASE))('case %s can be closed without paying', (_id, kase) => {
    const withheld = new Set(kase.services.flatMap((s) => s.grantsEvidenceIds))
    const soundClaims = kase.claims.filter((c) => c.sound)
    expect(soundClaims.length, 'a case with no sound claim cannot be closed at all').toBeGreaterThan(
      0,
    )
    const free = soundClaims.filter((claim) => claim.need.every((id) => !withheld.has(id)))
    expect(
      free.length,
      `every sound claim in ${kase.id} needs evidence that is behind a paid service`,
    ).toBeGreaterThan(0)
  })

  it.each(Object.entries(BY_CASE))('case %s promises no page it does not have', (_id, kase) => {
    const urls = new Set(kase.browser.pages.map((p) => p.url))
    for (const entry of kase.browser.index) {
      if (entry.go) expect(urls.has(entry.go), `${entry.id} → ${entry.go}`).toBe(true)
    }
    for (const bookmark of kase.browser.bookmarks) {
      expect(urls.has(bookmark.url) || bookmark.url === kase.browser.home, bookmark.url).toBe(true)
    }
    expect(urls.has(kase.browser.directoryUrl)).toBe(true)
  })

  /**
   * Which applications exist is a case's decision now. That freedom is only safe if a dock entry
   * or an `opensApp` link naming an application the case never declared fails here — otherwise it
   * is a button that opens nothing, discovered by a player.
   */
  it.each(Object.entries(BY_CASE))('case %s only names apps it declares', (_id, kase) => {
    const declared = new Set(kase.apps.map((a) => a.id))
    for (const id of kase.dock) {
      expect(declared.has(id) || id === 'phone', `dock names an undeclared app "${id}"`).toBe(true)
    }
    for (const page of kase.browser.pages) {
      for (const block of resolveBlocks(page, everyFlag(kase))) {
        if (block.kind === 'link' && block.opensApp) {
          expect(declared.has(block.opensApp), `${page.url} opens "${block.opensApp}"`).toBe(true)
        }
      }
    }
    // A case that ships a phone has to put one in the dock, and one that does not, must not.
    expect(kase.dock.includes('phone')).toBe(kase.phone !== null)
  })

  it.each(Object.entries(BY_CASE))('case %s can actually be finished', (_id, kase) => {
    // Every beat the gate asks for has to be reachable from something authored.
    const fireable = new Set<string>()
    for (const f of kase.files) if (f.beat) fireable.add(f.beat)
    for (const t of kase.threads) if (t.beat) fireable.add(t.beat)
    for (const d of kase.devices) if (d.beat) fireable.add(d.beat)
    // `claim` is fired by the engine, not by authored content.
    fireable.add('claim')
    for (const beat of kase.requiredBeats) {
      expect(fireable.has(beat), `no authored source fires the "${beat}" beat`).toBe(true)
    }
  })

  it.each(Object.entries(BY_CASE))('case %s names its own beats', (_id, kase) => {
    expect(new Set(kase.requiredBeats).size).toBe(kase.requiredBeats.length)
  })

  /**
   * A device nothing can open is a locked box with no key in the world — which is a different
   * thing from a device the player has not opened yet, and only one of them is a case.
   */
  it.each(Object.entries(BY_CASE))('case %s can open every device it locks', (_id, kase) => {
    const blob = JSON.stringify({ files: kase.files, mail: kase.mail, threads: kase.threads })
    for (const device of kase.devices) {
      if (device.unlocked || !device.unlockKey) continue
      expect(
        blob.includes(device.unlockKey),
        `nothing in ${kase.id} carries the key to "${device.label}"`,
      ).toBe(true)
    }
  })
})

/** Every flag any authored variant keys on, so a check can see every version of a page. */
function everyFlag(kase: (typeof BY_CASE)[string]): Record<string, boolean> {
  const flags: Record<string, boolean> = {}
  for (const page of kase.browser.pages) {
    for (const variant of page.variants) flags[variant.whenFlag] = true
  }
  return flags
}

/**
 * The world corpus, checked the way the case content is checked.
 *
 * These are the invariants a content file can break silently. A relation nothing supports does
 * not throw and does not fail to render — it simply never appears, and the author never learns
 * that the connection they wrote is unreachable.
 */
describe('the world corpus holds together', () => {
  const ids = new Set(GAME_WORLD.artifacts.map((a) => a.id))
  const entities = new Set(GAME_WORLD.entities.map((e) => e.id))

  it('every relation can reach the player through something they could hold', () => {
    for (const relation of GAME_WORLD.relations) {
      const label = `${relation.from} -${relation.relation}-> ${relation.to}`

      if (relation.sources.length > 0) {
        for (const source of relation.sources)
          expect(ids.has(source), `${label} cites a missing artifact "${source}"`).toBe(true)
        continue
      }

      const mentions = (id: string) => GAME_WORLD.artifacts.some((a) => a.mentions.includes(id))
      const grounded =
        relation.confidence === 'inferred'
          ? mentions(relation.from) && mentions(relation.to)
          : GAME_WORLD.artifacts.some(
              (a) => a.mentions.includes(relation.from) && a.mentions.includes(relation.to),
            )

      expect(grounded, `nothing in the world supports ${label}`).toBe(true)
    }
  })

  it('every endpoint, mention and owner names an entity that exists', () => {
    for (const relation of GAME_WORLD.relations) {
      expect(entities.has(relation.from), `unknown entity ${relation.from}`).toBe(true)
      expect(entities.has(relation.to), `unknown entity ${relation.to}`).toBe(true)
    }
    for (const artifact of GAME_WORLD.artifacts) {
      for (const mention of artifact.mentions)
        expect(entities.has(mention), `${artifact.id} mentions unknown ${mention}`).toBe(true)
      if (artifact.ownerEntityId)
        expect(entities.has(artifact.ownerEntityId), `${artifact.id} has an unknown owner`).toBe(
          true,
        )
    }
  })

  it('gives no artifact the same id twice, including the projected cases', () => {
    expect(ids.size).toBe(GAME_WORLD.artifacts.length)
  })

  /**
   * The ratio the whole corpus exists to hold.
   *
   * If every site on the web is about the case, the world is artificial inside twenty minutes.
   * The target is roughly 65 ordinary / 20 economic / 10 side-story / 4 suggestive / 1 anomalous
   * per hundred pages, measured per artifact rather than per fact because the thing being
   * rationed is what a player reads, not what an author files.
   */
  it('is mostly not about the case', () => {
    const register = new Map(WORLD.facts.map((f) => [f.id, f.register]))
    const tally: Record<string, number> = {
      ordinary: 0,
      economic: 0,
      sideStory: 0,
      suggestive: 0,
      anomalous: 0,
    }
    for (const artifact of WORLD.artifacts) {
      // A page carrying no fact carries no plot, which is what ordinary means.
      const key = (artifact.factId && register.get(artifact.factId)) || 'ordinary'
      tally[key] = (tally[key] ?? 0) + 1
    }

    const total = WORLD.artifacts.length
    const pct = (key: string) => Math.round(((tally[key] ?? 0) / total) * 100)
    const shape = Object.keys(tally)
      .map((key) => `${key} ${pct(key)}%`)
      .join(' · ')

    expect(pct('ordinary'), `too little ordinary world: ${shape}`).toBeGreaterThanOrEqual(50)
    expect(pct('anomalous'), `too much wonder: ${shape}`).toBeLessThanOrEqual(5)
    expect(
      pct('suggestive') + pct('anomalous'),
      `the plot is eating the world: ${shape}`,
    ).toBeLessThanOrEqual(20)
  })

  /**
   * A page nobody can reach is not on the web. The corpus is the rest of the internet, and all of
   * it has to be *openable*, or the search is a list of places the player is not allowed to go.
   */
  it('gives every page on the web an address', () => {
    const unreachable = GAME_WORLD.artifacts
      .filter((a) => (a.surface === 'web' || a.surface === 'archive') && !artifactUrl(a))
      .map((a) => a.id)
    expect(unreachable, `${unreachable.length} pages with no address`).toEqual([])
  })

  it('never puts two documents at the same address', () => {
    const seen = new Map<string, string>()
    for (const artifact of GAME_WORLD.artifacts) {
      const url = artifactUrl(artifact)
      if (!url) continue
      const first = seen.get(url)
      // The index keeps the first and drops the rest in silence, so the loser is unreachable.
      expect(first, `${artifact.id} and ${first} both live at ${url}`).toBeUndefined()
      seen.set(url, artifact.id)
    }
  })

  /**
   * The rule a game about a forged document lives or dies by. A lie the player cannot catch is
   * not a lie, it is a false fact — the world simply told them something untrue and there was
   * never a way to know.
   */
  it('gives every untrue document something that catches it', () => {
    const suspect = GAME_WORLD.artifacts.filter((a) => a.reliability !== 'reliable')
    for (const artifact of suspect) {
      const contradicted =
        artifact.contradicts.length > 0 ||
        GAME_WORLD.artifacts.some((other) => other.contradicts.includes(artifact.id))
      expect(
        contradicted,
        `${artifact.id} is ${artifact.reliability} and nothing in the world disagrees with it`,
      ).toBe(true)
    }
  })

  it('never asks the player to disbelieve a document on nothing but its own say-so', () => {
    for (const artifact of GAME_WORLD.artifacts) {
      for (const other of artifact.contradicts) {
        expect(ids.has(other), `${artifact.id} contradicts a missing "${other}"`).toBe(true)
        expect(other, `${artifact.id} contradicts itself`).not.toBe(artifact.id)
      }
    }
  })

  /**
   * One fact, many surfaces. A fact carried by a single artifact is a key: lose it and the chain
   * is dead, find it and there was nothing to work out.
   */
  it('carries every fact on at least two traces', () => {
    for (const fact of GAME_WORLD.facts) {
      const traces = GAME_WORLD.artifacts.filter((a) => a.factId === fact.id)
      expect(
        traces.length,
        `"${fact.statement}" rests on ${traces.length} trace(s)`,
      ).toBeGreaterThan(1)
    }
  })
})
