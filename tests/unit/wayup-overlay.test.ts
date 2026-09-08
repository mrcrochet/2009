import { describe, expect, it } from 'vitest'
import {
  assertOverlayIsOurs,
  createOverlay,
  isCapturedSnapshot,
  isFictionalOverlay,
  mergeSearchResults,
  OverlayRefused,
  scanForRealWorld,
  type OverlayDraft,
} from '@/lib/wayup/overlay'
import { OWNED_DOMAINS, REAL_ENTITY_DENYLIST, UNIVERSE } from '@/lib/wayup/universe'
import type { WayUpBlock, WayUpResult, WayUpSnapshot } from '@/lib/wayup/types'

const p = (text: string): WayUpBlock => ({ kind: 'p', text })

function draft(overrides: Partial<OverlayDraft> = {}): OverlayDraft {
  return {
    overlayId: 'ov_test_0001',
    subject: 'aion',
    title: 'Aion Group — Settlements',
    address: 'aion-group.com/archive/173',
    snippet: 'Settlements. Recovery. Actuarial.',
    blocks: [p('This domain is registered and in use. No public information is available.')],
    ...overrides,
  }
}

const refusalFor = (d: OverlayDraft): string | null => {
  try {
    assertOverlayIsOurs(d)
    return null
  } catch (error) {
    return error instanceof OverlayRefused ? error.reason : 'unexpected-error'
  }
}

// ---------------------------------------------------------------- the rule

describe('an overlay may only be about something we invented', () => {
  it('accepts a page about Aion Group', () => {
    expect(refusalFor(draft())).toBeNull()
    const overlay = createOverlay(draft())
    expect(overlay.subject).toBe('aion')
    expect(overlay.provenance).toBe('not-present-in-baseline-web')
  })

  it('refuses a subject that is not in the registry', () => {
    expect(refusalFor(draft({ subject: 'reuters' }))).toBe('unknown-subject')
    expect(refusalFor(draft({ subject: '' }))).toBe('unknown-subject')
  })

  it('refuses an address on a host we do not own', () => {
    expect(refusalFor(draft({ address: 'aion-group.co/archive' }))).toBe('address-not-ours')
    expect(refusalFor(draft({ address: 'archive.org/aion' }))).toBe('address-not-ours')
  })

  it('refuses an address belonging to a different entity of ours', () => {
    // Ours, but not Aion's. An overlay must not appear to live on the bank's site.
    expect(refusalFor(draft({ address: 'meridiansavings.com/aion' }))).toBe('address-wrong-entity')
  })

  it('refuses the generic domains the game sells the player, review or not', () => {
    // shortclip.com, cloudrent.com and socialgraph.net are plausible enough to have real
    // registrants today, so a 2026 page *about one of them* is a statement about somebody's
    // actual property. They are fine as fictional listings inside the 2009 registrar; they are
    // not in the overlay registry, and no sign-off can put them there. The beat where a domain
    // the player bought resurfaces in 2026 is worth having — with a name unmistakably ours.
    const speculative = draft({
      subject: 'shortclip',
      address: 'shortclip.com/about',
      title: 'shortclip.com',
      snippet: 'a page that may belong to somebody',
      blocks: [p('nothing here yet')],
    })
    expect(refusalFor(speculative)).toBe('unknown-subject')
    expect(refusalFor({ ...speculative, reviewed: true, reviewNote: 'signed' })).toBe(
      'unknown-subject',
    )
  })

  it('will not accept a review nobody signed', () => {
    // Otherwise the escape hatch is a boolean, and a boolean is a reflex.
    const risky = draft({ blocks: [p('Superseded by a filing at nytimes.com.')] })
    expect(refusalFor({ ...risky, reviewed: true })).toBe('unsigned-review')
    expect(refusalFor({ ...risky, reviewed: true, reviewNote: '   ' })).toBe('unsigned-review')
    expect(refusalFor({ ...risky, reviewed: true, reviewNote: 'legal ok' })).toBeNull()
  })
})

// --------------------------------------------------- naming the real world

describe('an overlay may not name the real world', () => {
  it('refuses a real company in the title', () => {
    expect(refusalFor(draft({ title: 'Aion Group acquired by Google' }))).toBe(
      'real-world-reference',
    )
  })

  it('refuses a real company in the body, even when the subject is ours', () => {
    const d = draft({
      blocks: [p('Aion Group was incorporated in 2017 and later sold to Microsoft.')],
    })
    expect(refusalFor(d)).toBe('real-world-reference')
  })

  it('refuses a real entity in any case', () => {
    for (const shout of ['REUTERS', 'reuters', 'Reuters']) {
      expect(refusalFor(draft({ blocks: [p(`Filed with ${shout}.`)] })), shout).toBe(
        'real-world-reference',
      )
    }
  })

  it('refuses a real person, caught as an unregistered proper noun', () => {
    const d = draft({ blocks: [p('The registrant of record is Jonathan Blake.')] })
    expect(refusalFor(d)).toBe('real-world-reference')
  })

  it('refuses a foreign hostname anywhere in the text', () => {
    const d = draft({ blocks: [p('Mirrored at nytimes.com for the archive.')] })
    expect(refusalFor(d)).toBe('real-world-reference')
  })

  it('refuses ways to contact a real person', () => {
    const cases: [string, string][] = [
      ['email', 'Write to settlements@some-firm.co.uk.'],
      ['handle', 'See @aiongroupreal for updates.'],
      ['phone', 'Reception: 212-887-4400.'],
      ['street', 'Registered at 1140 SE Morrison St.'],
    ]
    for (const [label, text] of cases) {
      expect(refusalFor(draft({ blocks: [p(text)] })), label).toBe('real-world-reference')
    }
  })

  it('leaves our own vocabulary alone', () => {
    // Every one of these is a multi-word Title Case name, and none may be flagged.
    const ours = draft({
      blocks: [
        p('The Columbia Register reported that Meridian Savings & Loan closed the account.'),
        p('Marc Deleon and Lea Voss were both named. Owen T. Rask was not.'),
        p('Filed from the Halcyon Browser through the Way Up Machine.'),
      ],
    })
    expect(refusalFor(ours)).toBeNull()
  })

  it('allows the fictional 555 telephone block and refuses everything else', () => {
    expect(scanForRealWorld('Call 503-555-0148.')).toEqual([])
    expect(scanForRealWorld('Call 503-224-9000.').map((f) => f.rule)).toContain('telephone-number')
  })

  it('does not mistake a filename for a domain', () => {
    expect(scanForRealWorld('See cibles.enc and README.txt in the archive.')).toEqual([])
  })

  it('does not flag an ordinary sentence opening', () => {
    expect(scanForRealWorld('This Machine is registered. There Is nothing else.')).toEqual([])
  })

  it('reports the reviewed escape hatch rather than hiding it', () => {
    const risky = draft({ blocks: [p('Superseded by a filing at nytimes.com.')] })
    expect(refusalFor(risky)).toBe('real-world-reference')

    const signed = createOverlay({ ...risky, reviewed: true, reviewNote: 'legal ok 2026-09-08' })
    expect(signed.reviewed).toBe(true)
    expect(signed.reviewNote).toBe('legal ok 2026-09-08')
  })
})

// ------------------------------------------------------- attempted bypasses

describe('attempts to get something past the check', () => {
  it('cannot hide a real name inside one of ours', () => {
    // "Aionics" is not "Aion". Masking without token boundaries used to eat the prefix and let
    // the rest through as a fragment.
    expect(refusalFor(draft({ blocks: [p('Acquired by Aionics Holdings in 2019.')] }))).toBe(
      'real-world-reference',
    )
  })

  it('cannot smuggle a real name through the path of an address we own', () => {
    expect(refusalFor(draft({ address: 'aion-group.com/google-filings' }))).toBe(
      'real-world-reference',
    )
  })

  it('cannot use even a signed review to claim a subject that is not ours', () => {
    // The escape hatch is for a scan finding a human has weighed. It is not a way to write about
    // somebody else, however willing that human is to sign for it.
    const signed = { reviewed: true, reviewNote: 'legal ok' }
    expect(refusalFor(draft({ subject: 'nytimes', ...signed }))).toBe('unknown-subject')
  })

  it('cannot use even a signed review to move onto somebody else’s domain', () => {
    const signed = { reviewed: true, reviewNote: 'legal ok' }
    expect(refusalFor(draft({ address: 'nytimes.com/aion', ...signed }))).toBe('address-not-ours')
  })

  it('a bare address with no path is still checked', () => {
    expect(refusalFor(draft({ address: 'example.com' }))).toBe('address-not-ours')
    expect(refusalFor(draft({ address: '' }))).toBe('address-not-ours')
  })
})

// -------------------------------------------------- structural separation

describe('an overlay is structurally not a capture', () => {
  const snapshot: WayUpSnapshot = {
    id: 'wu_abc',
    canonicalUrl: 'https://example.com/',
    title: 'Example',
    remoteFetchedAt: '2026-09-08T00:00:00.000Z',
    contentHash: 'a'.repeat(64),
    blocks: [p('real')],
    outgoingLinks: [],
    provider: 'firecrawl',
    byteLength: 4,
  }

  it('a real snapshot is not an overlay', () => {
    expect(isFictionalOverlay(snapshot)).toBe(false)
    expect(isCapturedSnapshot(snapshot)).toBe(true)
  })

  it('an overlay is not a snapshot', () => {
    const overlay = createOverlay(draft())
    expect(isCapturedSnapshot(overlay)).toBe(false)
    expect(isFictionalOverlay(overlay)).toBe(true)
    // The fields that make a capture a capture are simply absent.
    for (const field of ['contentHash', 'remoteFetchedAt', 'provider', 'canonicalUrl']) {
      expect(field in overlay, field).toBe(false)
    }
  })

  it('an overlay cannot arrive from storage or the network', () => {
    const overlay = createOverlay(draft())
    const roundTripped: unknown = JSON.parse(JSON.stringify(overlay))
    // The symbol does not survive serialisation, which is the whole point.
    expect(isFictionalOverlay(roundTripped)).toBe(false)
  })

  it('an object that merely claims to be one is refused at the merge', () => {
    const forged = {
      overlayId: 'ov_forged',
      subject: 'aion',
      title: 'Aion Group',
      address: 'aion-group.com/x',
      snippet: '',
      blocks: [],
      provenance: 'not-present-in-baseline-web',
      reviewed: false,
      reviewNote: null,
    } as unknown as ReturnType<typeof createOverlay>

    expect(() => mergeSearchResults([], forged)).toThrow(OverlayRefused)
  })
})

// ------------------------------------------------------------------ merge

describe('merging never touches a real result', () => {
  const real: readonly WayUpResult[] = [
    { title: 'One', url: 'https://a.example/1', snippet: 'first' },
    { title: 'Two', url: 'https://b.example/2', snippet: 'second' },
    { title: 'Three', url: 'https://c.example/3', snippet: 'third' },
  ]

  it('passes real results through by reference and keeps their order', () => {
    const entries = mergeSearchResults(real, createOverlay(draft()))
    const passed = entries.flatMap((e) => (e.kind === 'real' ? [e.result] : []))
    expect(passed).toHaveLength(real.length)
    passed.forEach((result, index) => {
      // Identity, not just equality: nothing was rewritten on the way through.
      expect(result).toBe(real[index])
    })
  })

  it('never places the overlay above every real result', () => {
    for (let i = 0; i < 50; i += 1) {
      const overlay = createOverlay(draft({ overlayId: `ov_${i}` }))
      const entries = mergeSearchResults(real, overlay)
      expect(entries[0]?.kind, `overlay ${i}`).toBe('real')
    }
  })

  it('is deterministic, so a replay shows it in the same place', () => {
    const overlay = createOverlay(draft({ overlayId: 'ov_stable' }))
    const first = mergeSearchResults(real, overlay).findIndex((e) => e.kind === 'overlay')
    const second = mergeSearchResults(real, overlay).findIndex((e) => e.kind === 'overlay')
    expect(first).toBe(second)
    expect(first).toBeGreaterThan(0)
  })

  it('shows the overlay alone when the real web returned nothing', () => {
    const entries = mergeSearchResults([], createOverlay(draft()))
    expect(entries).toHaveLength(1)
    expect(entries[0]?.kind).toBe('overlay')
  })

  it('changes nothing when there is no overlay', () => {
    const entries = mergeSearchResults(real, null)
    expect(entries.every((e) => e.kind === 'real')).toBe(true)
    expect(entries).toHaveLength(3)
  })
})

// --------------------------------------------------------------- registry

describe('the registry', () => {
  it('contains nothing from the real world', () => {
    for (const entity of UNIVERSE) {
      for (const alias of entity.aliases) {
        for (const real of REAL_ENTITY_DENYLIST) {
          expect(
            alias.toLowerCase().includes(real.toLowerCase()),
            `${entity.id} alias "${alias}" contains the real name "${real}"`,
          ).toBe(false)
        }
      }
    }
  })

  it('contains nothing that is not ours', () => {
    for (const entity of UNIVERSE) {
      // There is one provenance. A category meaning "probably fine" is the kind of guardrail
      // that erodes, so the registry does not have one.
      expect(entity.provenance, entity.id).toBe('invented')
      expect(entity.aliases.length, entity.id).toBeGreaterThan(0)
    }
    const domains = UNIVERSE.flatMap((e) => e.domains)
    for (const domain of domains) {
      expect(domain, domain).toMatch(
        /^(aion-group|meridiansavings|corvid|cluster|tradepost|namewell|nullcache|columbia-register|geohost)\.(com|org)$/,
      )
    }
  })

  it('owns every domain an overlay is allowed to be addressed to', () => {
    for (const entity of UNIVERSE) {
      for (const domain of entity.domains) {
        expect(OWNED_DOMAINS.has(domain.toLowerCase()), domain).toBe(true)
      }
    }
  })
})

// ------------------------------------------------------- documented limits

/**
 * These pass on purpose. A scanner that quietly failed at these while looking thorough would be
 * worse than one whose gaps are written down, because the next author would trust it.
 */
describe('what the scan provably cannot catch', () => {
  it('misses a single-word real company that is not on the denylist', () => {
    expect(scanForRealWorld('Acquired by Nortel in 2011.')).toEqual([])
  })

  it('misses a real person written in lower case', () => {
    // Which is exactly how this game's characters type.
    expect(scanForRealWorld('marc says jonathan blake signed it')).toEqual([])
  })

  it('misses an unmistakable description that names nobody', () => {
    const text = 'The search company that bought the video site in 2006 now owns the registrar.'
    expect(scanForRealWorld(text)).toEqual([])
  })
})
