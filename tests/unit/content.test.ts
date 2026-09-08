import { describe, expect, it } from 'vitest'
import { DayContentSchema } from '@/engine/content-schema'
import { day01 } from '@/content/day01'
import { BY_DAY, GAME_WORLD } from '@/content'
import { resolveBlocks } from '@/engine/temporal'
import { content } from './helpers'

/** Authored content is data, and data has to hold together. */
describe('day 01 content', () => {
  it('validates against the schema', () => {
    expect(() => DayContentSchema.parse(day01)).not.toThrow()
  })

  it('is set in the canonical world', () => {
    expect(content.dateISO).toBe('2009-01-15')
    expect(content.location).toBe('Portland, Oregon')
    expect(content.identity).toBe('Owen T. Rask')
    expect(content.osName).toBe('HALCYON 4.1')
    expect(content.economy.bankName).toBe('MERIDIAN SAVINGS & LOAN')
    expect(content.economy.openingCashCents).toBe(43782)
  })

  it('has no leftover Paris/euro prototype content', () => {
    const blob = JSON.stringify(content)
    for (const legacy of ['Paris', 'euro', '€', 'EUR']) {
      expect(blob.includes(legacy), `found legacy token "${legacy}"`).toBe(false)
    }
  })

  it('ships no emoji anywhere in the authored copy', () => {
    // Emoji-by-default code points, plus any character explicitly asking for emoji
    // presentation. Text-presentation symbols a 2009 page would really print — (c), (r) —
    // are not emoji and are allowed.
    const emoji = /\p{Emoji_Presentation}|\uFE0F/u
    expect(emoji.test(JSON.stringify(content))).toBe(false)
  })

  it.each(Object.entries(BY_DAY))('day %s references only evidence that exists', (_day, day) => {
    const ids = new Set(day.evidence.map((e) => e.id))
    for (const claim of day.claims) {
      for (const need of claim.need) expect(ids.has(need), `${claim.id} → ${need}`).toBe(true)
    }
    for (const page of day.browser.pages) {
      for (const shift of [0, 9]) {
        for (const block of resolveBlocks(page, shift)) {
          if (block.kind === 'evidence') expect(ids.has(block.evidenceId)).toBe(true)
        }
      }
    }
    expect(ids.has(day.terminal.decrypt.evidenceId)).toBe(true)
  })

  it.each(Object.entries(BY_DAY))('day %s promises no page it does not have', (_day, day) => {
    const urls = new Set(day.browser.pages.map((p) => p.url))
    for (const entry of day.browser.index) {
      if (entry.go) expect(urls.has(entry.go), `${entry.id} → ${entry.go}`).toBe(true)
    }
    for (const bookmark of day.browser.bookmarks) {
      expect(urls.has(bookmark.url) || bookmark.url === day.browser.home, bookmark.url).toBe(true)
    }
    expect(urls.has(day.browser.directoryUrl)).toBe(true)
  })

  it.each(Object.entries(BY_DAY))(
    'day %s wires every buyable listing to an opportunity',
    (_day, day) => {
      const ids = new Set(day.economy.opportunities.map((o) => o.id))
      for (const page of day.browser.pages) {
        for (const shift of [0, 9]) {
          for (const block of resolveBlocks(page, shift)) {
            if (block.kind === 'listing' && block.action === 'buy') {
              // A listing pointing at another day's item renders as an inert "CONTACT SELLER" —
              // yesterday's advertisement, still priced, silently doing nothing.
              expect(block.itemId && ids.has(block.itemId), `${page.url} → ${block.title}`).toBe(
                true,
              )
            }
          }
        }
      }
    },
  )

  it.each(Object.entries(BY_DAY))('day %s can actually be finished', (_day, day) => {
    // Every beat the gate asks for has to be reachable from something authored.
    const fireable = new Set<string>()
    for (const f of day.files) if (f.beat) fireable.add(f.beat)
    for (const t of day.threads) if (t.beat) fireable.add(t.beat)
    for (const o of day.economy.opportunities) if (o.beat) fireable.add(o.beat)
    // `recall` and `claim` are fired by the engine, not by authored content.
    fireable.add('recall')
    fireable.add('claim')
    for (const beat of day.requiredBeats) {
      expect(fireable.has(beat), `no authored source fires the "${beat}" beat`).toBe(true)
    }
  })

  it.each(Object.entries(BY_DAY))('day %s names its own beats', (_day, day) => {
    expect(new Set(day.requiredBeats).size).toBe(day.requiredBeats.length)
  })

  it('the resale is worth doing and the quota is not reachable in one day', () => {
    const opp = content.economy.opportunities[0]!
    expect(opp.sellCents).toBeGreaterThan(opp.buyCents)
    expect(content.economy.openingCashCents + opp.sellCents).toBeLessThan(
      content.economy.quotaCents,
    )
  })
})

/**
 * The world corpus, checked the way the day content is checked.
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

  it('gives no artifact the same id twice, including the projected days', () => {
    expect(ids.size).toBe(GAME_WORLD.artifacts.length)
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
   * One fact, many surfaces. A fact carried by a single artifact is a key: lose it and the
   * chain is dead, find it and there was nothing to work out.
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
