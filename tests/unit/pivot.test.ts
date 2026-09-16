import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Nothing still wears the old product's name.
 *
 * This repository was **2009**, a time-travel business simulation, and the pivot to UNLISTED was
 * done in pieces. Each piece left something behind, and the things it left were not comments: a
 * share card advertising a game that no longer exists, a paywall blurb selling "Days 02–30", a
 * storage key, a link with `?day=2` on it that the router had stopped understanding.
 *
 * Editorial care will not hold this line — the last four leftovers were found by reading files
 * one at a time, months after everyone had agreed the pivot was finished. A failing test will.
 *
 * `content/` is deliberately not scanned for the bare year: the Marlow Foundation was founded in
 * 2009, and a case set in the present may say so.
 */

const BUILD = ['app', 'components', 'lib', 'engine', 'state', 'styles']
const ALL = [...BUILD, 'content']

/** Names, mechanics and identifiers that belonged to the product this one replaced. */
const GONE = [
  'HALCYON',
  'Owen T. Rask',
  'Marc Deleon',
  'Lea Voss',
  'Aion Group',
  'Meridian Savings',
  'Quoteline',
  'Nokora',
  'Corvid',
  'TradePost',
  'Namewell',
  'nullcache',
  'Columbia Register',
  'GeoHost',
  'Ember Messenger',
  'Way Up',
  'wayup',
  'temporalShift',
  'memoryIntegrity',
  'cashCents',
  'DAY_ADVANCED',
  'timelineId',
  'Day 01',
  'Day 02',
  'day=2',
]

/**
 * The one place the old name is allowed, and has to be.
 *
 * A browser database can be replaced but not renamed, so opening the current one carries forward
 * whatever is in the old one. It cannot do that without naming it.
 */
const LEGACY_DB_EXEMPTION = 'lib/persistence/db.ts'

/**
 * The home page's catalogue names a case "The 2009 archive".
 *
 * That is a title in the design reference, not a leftover: the year is the name of a thing inside
 * the fiction the way "the 2013 filing" is in Case 001. The exemption is by file and by nothing
 * else, so a real leftover anywhere in the build still fails.
 */
const REFERENCE_TITLE_EXEMPTION = 'components/product/CasesHome.tsx'

function sourceFiles(roots: readonly string[]): string[] {
  const out: string[] = []
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      if (entry === 'node_modules' || entry.startsWith('.')) continue
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) walk(full)
      else if (/\.(ts|tsx|css)$/.test(entry)) out.push(full)
    }
  }
  for (const root of roots) walk(root)
  return out
}

describe('nothing still wears the old product’s name', () => {
  it('finds files to check at all, so a broken walk cannot pass silently', () => {
    expect(sourceFiles(ALL).length).toBeGreaterThan(50)
  })

  it.each(GONE)('no shipped source names "%s"', (token) => {
    const offenders = sourceFiles(ALL).filter((file) =>
      readFileSync(file, 'utf8').toLowerCase().includes(token.toLowerCase()),
    )
    expect(offenders, `${token} survives in ${offenders.join(', ')}`).toEqual([])
  })

  it('no storage key, log prefix or package name is still the old one', () => {
    const offenders = sourceFiles(ALL).filter(
      (file) => file !== LEGACY_DB_EXEMPTION && readFileSync(file, 'utf8').includes('two009'),
    )
    expect(offenders, `two009 survives in ${offenders.join(', ')}`).toEqual([])
    expect(JSON.parse(readFileSync('package.json', 'utf8')).name).toBe('unlisted')
  })

  /**
   * The year itself, in the build only. A route that still says 2009 is not a stale comment —
   * it is the product introducing itself to somebody who has never opened it.
   */
  it('names no year the build has no business naming', () => {
    const offenders = sourceFiles(BUILD)
      .filter((file) => file !== REFERENCE_TITLE_EXEMPTION)
      .filter((file) => readFileSync(file, 'utf8').includes('2009'))
    expect(offenders, `2009 survives in ${offenders.join(', ')}`).toEqual([])
  })

  it('sends nobody to a route the router stopped understanding', () => {
    // A case is selected by name. `?day=` was the old product's season position.
    const offenders = sourceFiles(ALL).filter((file) => /[?&]day=/.test(readFileSync(file, 'utf8')))
    expect(offenders).toEqual([])
  })
})
