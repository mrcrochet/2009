import { describe, expect, it } from 'vitest'
import { selectPage, selectSearchResults } from '@/engine/selectors'
import { searchIndex } from '@/engine/rules'
import { normalizeUrl } from '@/engine/url'
import { resolveBlocks } from '@/engine/pages'
import { GAME_WORLD } from '@/content'
import { artifactUrl } from '@/engine/world'
import { content, dispatch, fresh, run } from './helpers'

/** Every flag any page variant keys on, so a check can see every version of the web. */
const EVERY_FLAG: Record<string, boolean> = Object.fromEntries(
  content.browser.pages.flatMap((p) => p.variants.map((v) => [v.whenFlag, true])),
)

describe('fictional browser', () => {
  it('searches its own closed index', () => {
    expect(searchIndex(content, 'richard vale')).toContain('i-vale')
    expect(searchIndex(content, 'marlow')).toContain('i-marlow')
    expect(searchIndex(content, 'zzzz nothing here')).toEqual([])
  })

  it('renders an empty-result state rather than reaching outside', () => {
    const state = dispatch(fresh(), { type: 'BROWSER_SEARCHED', query: 'quantum computing stocks' })
    expect(state.browser.view).toBe('results')
    expect(selectSearchResults(state, content)).toEqual([])
  })

  it('keeps a real back-stack', () => {
    let state = run(fresh(), [
      { type: 'BROWSER_SEARCHED', query: 'vale' },
      { type: 'BROWSER_NAVIGATED', url: 'ridgelinepartners.com/team' },
    ])
    expect(state.browser.view).toBe('page')

    state = dispatch(state, { type: 'BROWSER_WENT_BACK' })
    expect(state.browser.view).toBe('results')
    expect(state.browser.query).toBe('vale')

    state = dispatch(state, { type: 'BROWSER_WENT_BACK' })
    expect(state.browser.view).toBe('home')
    expect(state.browser.url).toBe('orbit.com')
  })

  it('typing an unknown address gives a not-found, not a crash', () => {
    const state = dispatch(fresh(), { type: 'BROWSER_NAVIGATED', url: 'example.com' })
    expect(selectPage(state, content).found).toBe(false)
  })

  it('forgives the things an address bar forgives', () => {
    expect(normalizeUrl('http://www.FremontParking.com/')).toBe('fremontparking.com')
    expect(normalizeUrl('  HTTPS://marlowfoundation.org/filings  ')).toBe(
      'marlowfoundation.org/filings',
    )
    expect(normalizeUrl('orbit.com/search?q=Richard%20Vale')).toBe('orbit.com/search?q=Richard%20Vale')

    const state = dispatch(fresh(), {
      type: 'BROWSER_NAVIGATED',
      url: 'http://www.fremontparking.com/',
    })
    expect(state.browser.url).toBe('fremontparking.com')
    expect(selectPage(state, content).found).toBe(true)
  })

  it('goes forward again after going back, and drops the stack on a new destination', () => {
    let state = run(fresh(), [
      { type: 'BROWSER_NAVIGATED', url: 'marlowfoundation.org' },
      { type: 'BROWSER_NAVIGATED', url: 'marlowfoundation.org/filings' },
    ])
    expect(state.browser.forward).toHaveLength(0)

    state = dispatch(state, { type: 'BROWSER_WENT_BACK' })
    expect(state.browser.url).toBe('marlowfoundation.org')
    expect(state.browser.forward).toHaveLength(1)

    state = dispatch(state, { type: 'BROWSER_WENT_FORWARD' })
    expect(state.browser.url).toBe('marlowfoundation.org/filings')
    expect(state.browser.forward).toHaveLength(0)

    state = dispatch(state, { type: 'BROWSER_WENT_BACK' })
    state = dispatch(state, { type: 'BROWSER_NAVIGATED', url: 'kgw-portland.com' })
    expect(state.browser.forward).toEqual([])
  })

  it('back at the very start of the session does nothing', () => {
    const state = fresh()
    expect(dispatch(state, { type: 'BROWSER_WENT_BACK' })).toBe(state)
    expect(dispatch(state, { type: 'BROWSER_WENT_FORWARD' })).toBe(state)
  })

  it('the home button returns to the search page, not to a dead URL', () => {
    const state = run(fresh(), [
      { type: 'BROWSER_NAVIGATED', url: 'kgw-portland.com' },
      { type: 'BROWSER_NAVIGATED', url: content.browser.home },
    ])
    expect(state.browser.view).toBe('home')
  })
})

describe('the web is actually a web', () => {
  const pageUrls = new Set(content.browser.pages.map((p) => p.url))

  /**
   * A case's pages and the corpus are one internet.
   *
   * This used to check a link against the case's own pages only, which would have made linking
   * to the rest of the web a test failure — and the rest of the web is the point of having a
   * corpus. What has to be true is narrower and stricter: every address written on a page goes
   * somewhere, whether that somewhere was authored by this case or by the world it happens in.
   */
  const reachableUrls = new Set([
    ...pageUrls,
    ...GAME_WORLD.artifacts.flatMap((a) => {
      const url = artifactUrl(a)
      return url ? [url] : []
    }),
  ])

  it('every link and nav item on every page resolves to a page that exists', () => {
    for (const page of content.browser.pages) {
      for (const flags of [{}, EVERY_FLAG]) {
        for (const block of resolveBlocks(page, flags)) {
          if (block.kind === 'nav') {
            for (const item of block.items) {
              expect(reachableUrls.has(item.url), `${page.url} → ${item.url}`).toBe(true)
            }
          }
          if (block.kind === 'link' && block.url) {
            expect(reachableUrls.has(block.url), `${page.url} → ${block.url}`).toBe(true)
          }
        }
      }
    }
  })

  it('every bookmark goes somewhere', () => {
    for (const b of content.browser.bookmarks) {
      expect(pageUrls.has(b.url) || b.url === content.browser.home, b.url).toBe(true)
    }
  })

  it('the directory exists and reaches every site in the simulation', () => {
    const directory = content.browser.pages.find((p) => p.url === content.browser.directoryUrl)
    expect(directory).toBeDefined()

    const listed = new Set(
      directory!.blocks.flatMap((b) =>
        b.kind === 'nav' ? b.items.map((i) => i.url) : b.kind === 'link' && b.url ? [b.url] : [],
      ),
    )
    // Every distinct host in the simulation is reachable from the directory, except the search
    // engine itself.
    const hosts = new Set([...pageUrls].map((u) => u.split('/')[0]))
    for (const host of hosts) {
      if (host === content.browser.home) continue
      expect(
        [...listed].some((u) => u.split('/')[0] === host),
        `directory misses ${host}`,
      ).toBe(true)
    }
  })

  it('every page except the search home can be reached without typing a URL', () => {
    const reachable = new Set<string>([content.browser.directoryUrl])
    for (const entry of content.browser.index) if (entry.go) reachable.add(entry.go)
    for (const b of content.browser.bookmarks) reachable.add(b.url)

    // Walk the link graph until it stops growing.
    let grew = true
    while (grew) {
      grew = false
      for (const page of content.browser.pages) {
        if (!reachable.has(page.url)) continue
        for (const flags of [{}, EVERY_FLAG]) {
          for (const block of resolveBlocks(page, flags)) {
            const urls =
              block.kind === 'nav'
                ? block.items.map((i) => i.url)
                : block.kind === 'link' && block.url
                  ? [block.url]
                  : []
            for (const url of urls) {
              if (!reachable.has(url)) {
                reachable.add(url)
                grew = true
              }
            }
          }
        }
      }
    }

    for (const page of content.browser.pages) {
      expect(reachable.has(page.url), `${page.url} is an island`).toBe(true)
    }
  })

  it('an empty search still offers the player the directory', () => {
    const state = dispatch(fresh(), { type: 'BROWSER_SEARCHED', query: 'nothing at all' })
    expect(selectSearchResults(state, content)).toEqual([])
    expect(content.browser.directoryLabel.length).toBeGreaterThan(0)
  })

  it('costs time to browse', () => {
    const before = fresh()
    const after = run(before, [
      { type: 'BROWSER_SEARCHED', query: 'vale' },
      { type: 'BROWSER_NAVIGATED', url: 'ridgelinepartners.com/team' },
    ])
    expect(after.minute - before.minute).toBe(3)
  })
})

describe('the address bar is not the location', () => {
  it('typing an address does not move the browser', () => {
    const state = dispatch(fresh(), { type: 'BROWSER_URL_CHANGED', url: 'marlowfoundation.org' })
    expect(state.browser.draftUrl).toBe('marlowfoundation.org')
    expect(state.browser.url).toBe(content.browser.home)
    expect(state.browser.view).toBe('home')
  })

  it('submitting it does, and clears the draft', () => {
    let state = dispatch(fresh(), { type: 'BROWSER_URL_CHANGED', url: 'marlowfoundation.org' })
    state = dispatch(state, { type: 'BROWSER_NAVIGATED', url: 'marlowfoundation.org' })
    expect(state.browser.draftUrl).toBeNull()
    expect(state.browser.url).toBe('marlowfoundation.org')
  })
})

describe('a URL is not a lowercase string', () => {
  it('the host is case-insensitive and the path is not', () => {
    expect(normalizeUrl('MarlowFoundation.ORG/Filings')).toBe('marlowfoundation.org/Filings')
    const state = dispatch(fresh(), { type: 'BROWSER_NAVIGATED', url: 'MARLOWFOUNDATION.ORG' })
    expect(selectPage(state, content).found).toBe(true)
  })
})
