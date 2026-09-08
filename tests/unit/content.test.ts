import { describe, expect, it } from 'vitest'
import { DayContentSchema } from '@/engine/content-schema'
import { day01 } from '@/content/day01'
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
    const emoji = /\p{Extended_Pictographic}/u
    expect(emoji.test(JSON.stringify(content))).toBe(false)
  })

  it('references only evidence that exists', () => {
    const ids = new Set(content.evidence.map((e) => e.id))
    for (const claim of content.claims) {
      for (const need of claim.need) expect(ids.has(need), `${claim.id} → ${need}`).toBe(true)
    }
    for (const page of content.browser.pages) {
      for (const block of page.blocks) {
        if (block.kind === 'evidence') expect(ids.has(block.evidenceId)).toBe(true)
      }
    }
    expect(ids.has(content.terminal.decrypt.evidenceId)).toBe(true)
  })

  it('every search result that promises a page has one', () => {
    const urls = new Set(content.browser.pages.map((p) => p.url))
    for (const entry of content.browser.index) {
      if (entry.go) expect(urls.has(entry.go), `${entry.id} → ${entry.go}`).toBe(true)
    }
  })

  it('every buyable listing has an authored opportunity', () => {
    const ids = new Set(content.economy.opportunities.map((o) => o.id))
    for (const page of content.browser.pages) {
      for (const block of page.blocks) {
        if (block.kind === 'listing' && block.action === 'buy') {
          expect(block.itemId && ids.has(block.itemId), `${block.title}`).toBe(true)
        }
      }
    }
  })

  it('the resale is worth doing and the quota is not reachable in one day', () => {
    const opp = content.economy.opportunities[0]!
    expect(opp.sellCents).toBeGreaterThan(opp.buyCents)
    expect(content.economy.openingCashCents + opp.sellCents).toBeLessThan(content.economy.quotaCents)
  })
})
