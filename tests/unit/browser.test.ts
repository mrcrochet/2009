import { describe, expect, it } from 'vitest'
import { selectPage, selectSearchResults } from '@/engine/selectors'
import { searchIndex } from '@/engine/rules'
import { normalizeUrl } from '@/engine/url'
import { isPageAltered, resolveBlocks } from '@/engine/temporal'
import { BrowserPageSchema } from '@/engine/content-schema'
import { content, dispatch, fresh, run } from './helpers'

describe('fictional browser', () => {
  it('searches its own closed index', () => {
    expect(searchIndex(content, 'phone')).toContain('idx-tradepost')
    expect(searchIndex(content, 'owen rask')).toContain('idx-obit')
    expect(searchIndex(content, 'zzzz nothing here')).toEqual([])
  })

  it('renders an empty-result state rather than reaching outside', () => {
    const state = dispatch(fresh(), { type: 'BROWSER_SEARCHED', query: 'quantum computing stocks' })
    expect(state.browser.view).toBe('results')
    expect(selectSearchResults(state, content)).toEqual([])
  })

  it('keeps a real back-stack', () => {
    let state = run(fresh(), [
      { type: 'BROWSER_SEARCHED', query: 'rask' },
      { type: 'BROWSER_NAVIGATED', url: 'columbia-register.com/obits/rask' },
    ])
    expect(state.browser.view).toBe('page')

    state = dispatch(state, { type: 'BROWSER_WENT_BACK' })
    expect(state.browser.view).toBe('results')
    expect(state.browser.query).toBe('rask')

    state = dispatch(state, { type: 'BROWSER_WENT_BACK' })
    expect(state.browser.view).toBe('home')
    expect(state.browser.url).toBe('corvid.com')
  })

  it('typing an unknown address gives a period-appropriate not-found, not a crash', () => {
    const state = dispatch(fresh(), { type: 'BROWSER_NAVIGATED', url: 'google.com' })
    expect(selectPage(state, content).found).toBe(false)
  })

  it('forgives the things a 2009 address bar forgave', () => {
    expect(normalizeUrl('http://www.TradePost.com/')).toBe('tradepost.com')
    expect(normalizeUrl('  HTTPS://cluster.com/leavoss  ')).toBe('cluster.com/leavoss')
    expect(normalizeUrl('corvid.com/search?q=Owen%20Rask')).toBe('corvid.com/search?q=Owen%20Rask')

    const state = dispatch(fresh(), { type: 'BROWSER_NAVIGATED', url: 'http://www.tradepost.com/' })
    expect(state.browser.url).toBe('tradepost.com')
    expect(selectPage(state, content).found).toBe(true)
  })

  it('goes forward again after going back, and drops the stack on a new destination', () => {
    let state = run(fresh(), [
      { type: 'BROWSER_NAVIGATED', url: 'tradepost.com' },
      { type: 'BROWSER_NAVIGATED', url: 'tradepost.com/pdx/electronics' },
    ])
    expect(state.browser.forward).toHaveLength(0)

    state = dispatch(state, { type: 'BROWSER_WENT_BACK' })
    expect(state.browser.url).toBe('tradepost.com')
    expect(state.browser.forward).toHaveLength(1)

    state = dispatch(state, { type: 'BROWSER_WENT_FORWARD' })
    expect(state.browser.url).toBe('tradepost.com/pdx/electronics')
    expect(state.browser.forward).toHaveLength(0)

    state = dispatch(state, { type: 'BROWSER_WENT_BACK' })
    state = dispatch(state, { type: 'BROWSER_NAVIGATED', url: 'cluster.com' })
    expect(state.browser.forward).toEqual([])
  })

  it('back at the very start of the session does nothing', () => {
    const state = fresh()
    expect(dispatch(state, { type: 'BROWSER_WENT_BACK' })).toBe(state)
    expect(dispatch(state, { type: 'BROWSER_WENT_FORWARD' })).toBe(state)
  })

  it('the home button returns to the search page, not to a dead URL', () => {
    const state = run(fresh(), [
      { type: 'BROWSER_NAVIGATED', url: 'aion-group.com' },
      { type: 'BROWSER_NAVIGATED', url: content.browser.home },
    ])
    expect(state.browser.view).toBe('home')
  })
})

describe('the web is actually a web', () => {
  const pageUrls = new Set(content.browser.pages.map((p) => p.url))

  it('every link and nav item on every page resolves to a page that exists', () => {
    for (const page of content.browser.pages) {
      for (const shift of [0, 2]) {
        for (const block of resolveBlocks(page, shift)) {
          if (block.kind === 'nav') {
            for (const item of block.items) {
              expect(pageUrls.has(item.url), `${page.url} → ${item.url}`).toBe(true)
            }
          }
          if (block.kind === 'link' && block.url) {
            expect(pageUrls.has(block.url), `${page.url} → ${block.url}`).toBe(true)
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
      directory!.blocks.flatMap((b) => (b.kind === 'nav' ? b.items.map((i) => i.url) : [])),
    )
    // Every distinct host in the simulation is reachable from the directory, except the
    // search engine itself and the archive you can only find by knowing what to look for.
    const hosts = new Set([...pageUrls].map((u) => u.split('/')[0]))
    for (const host of hosts) {
      if (host === 'corvid.com' || host === 'metzdowd.archive') continue
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
        for (const shift of [0, 2]) {
          for (const block of resolveBlocks(page, shift)) {
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
      { type: 'BROWSER_SEARCHED', query: 'rask' },
      { type: 'BROWSER_NAVIGATED', url: 'columbia-register.com/obits/rask' },
    ])
    expect(after.minuteOfDay - before.minuteOfDay).toBe(3)
  })
})

describe('a choice that rewrites a page', () => {
  const leaPage = content.browser.pages.find((p) => p.url === 'cluster.com/leavoss')!

  it('leaves her post alone by default, and the evidence with it', () => {
    const blocks = resolveBlocks(leaPage, 0, {})
    expect(blocks.some((b) => b.kind === 'evidence' && b.evidenceId === 'e9')).toBe(true)
  })

  it('records the plate when the player tells her to write it down', () => {
    const blocks = resolveBlocks(leaPage, 0, { leaPostedAgain: true })
    expect(blocks.some((b) => b.kind === 'p' && b.text.includes('oregon plate'))).toBe(true)
    expect(blocks.some((b) => b.kind === 'evidence' && b.evidenceId === 'e9')).toBe(true)
  })

  it('deletes the evidence when the player talks her out of it', () => {
    const blocks = resolveBlocks(leaPage, 0, { leaPostRemoved: true })
    expect(blocks.some((b) => b.kind === 'evidence')).toBe(false)
    expect(blocks.some((b) => b.kind === 'p' && b.text.includes('(post removed by author)'))).toBe(
      true,
    )
  })

  it('a decision outranks drift — the page the player changed stays changed', () => {
    const blocks = resolveBlocks(leaPage, 9, { leaPostRemoved: true })
    expect(blocks.some((b) => b.kind === 'evidence')).toBe(false)
  })

  it('ranks a flag above a shift even when both variants match', () => {
    // No authored page carries both kinds, so the ranking has to be exercised directly —
    // otherwise removing it passes the whole suite.
    const page = BrowserPageSchema.parse({
      url: 'test.local',
      background: '#ffffff',
      blocks: [{ kind: 'p', text: 'baseline' }],
      variants: [
        { minShift: 1, blocks: [{ kind: 'p', text: 'drifted' }] },
        { whenFlag: 'decided', blocks: [{ kind: 'p', text: 'decided' }] },
      ],
    })
    expect(resolveBlocks(page, 0, {})[0]).toMatchObject({ text: 'baseline' })
    expect(resolveBlocks(page, 5, {})[0]).toMatchObject({ text: 'drifted' })
    expect(resolveBlocks(page, 5, { decided: true })[0]).toMatchObject({ text: 'decided' })
  })

  it('does not report a decision as the timeline drifting under the player', () => {
    // The Lea page changed because they asked for it. That is not the same thing as a page
    // rewriting itself, and the day-end summary must not conflate them.
    expect(isPageAltered(leaPage, 9)).toBe(false)
  })
})

describe('the address bar is not the location', () => {
  it('typing an address does not move the browser', () => {
    let state = dispatch(fresh(), { type: 'BROWSER_NAVIGATED', url: 'tradepost.com' })
    state = dispatch(state, { type: 'BROWSER_URL_CHANGED', url: 'half-typ' })
    expect(state.browser.url).toBe('tradepost.com')
    expect(state.browser.draftUrl).toBe('half-typ')
    expect(selectPage(state, content).found).toBe(true)
  })

  it('going back discards what was half-typed', () => {
    let state = run(fresh(), [
      { type: 'BROWSER_NAVIGATED', url: 'tradepost.com' },
      { type: 'BROWSER_NAVIGATED', url: 'tradepost.com/pdx/electronics' },
      { type: 'BROWSER_URL_CHANGED', url: 'nonsen' },
    ])
    state = dispatch(state, { type: 'BROWSER_WENT_BACK' })
    expect(state.browser.draftUrl).toBeNull()
    expect(state.browser.url).toBe('tradepost.com')
  })
})

describe('a URL is not a lowercase string', () => {
  it('the host is case-insensitive and the path is not', () => {
    // On a 2009 server `/Terminal/4417` and `/terminal/4417` were different pages, and the game
    // authors paths with capitals. Lowercasing the whole address made an authored page
    // unreachable and silently broke a mystery's unlock condition.
    expect(normalizeUrl('http://GeoHost.COM/Terminal/4417')).toBe('geohost.com/Terminal/4417')
    expect(normalizeUrl('WWW.TradePost.com/pdx/electronics')).toBe('tradepost.com/pdx/electronics')

    const state = dispatch(fresh(), { type: 'BROWSER_NAVIGATED', url: 'GEOHOST.com/Terminal/4417' })
    expect(selectPage(state, content).found).toBe(true)
  })
})
