import type { Block, BrowserPage, DayContent, SearchEntry } from './content-schema'
import type { TimelineState } from './types'

/**
 * The temporal engine. Content declares variants keyed on `minShift`; the world resolves to the
 * highest variant the player has unlocked. Divergence is experienced as changed world content,
 * not as a meter.
 */

export function resolveBlocks(page: BrowserPage, temporalShift: number): readonly Block[] {
  let best: readonly Block[] = page.blocks
  let bestShift = -1
  for (const variant of page.variants) {
    if (temporalShift >= variant.minShift && variant.minShift > bestShift) {
      best = variant.blocks
      bestShift = variant.minShift
    }
  }
  return best
}

export function isPageAltered(page: BrowserPage, temporalShift: number): boolean {
  return page.variants.some((v) => temporalShift >= v.minShift)
}

export function resolveSearchEntry(
  entry: SearchEntry,
  temporalShift: number,
): { title: string; snippet: string } {
  let title = entry.title
  let snippet = entry.snippet
  let bestShift = -1
  for (const variant of entry.variants) {
    if (temporalShift >= variant.minShift && variant.minShift > bestShift) {
      title = variant.title
      snippet = variant.snippet
      bestShift = variant.minShift
    }
  }
  return { title, snippet }
}

export function findPage(content: DayContent, url: string): BrowserPage | null {
  return content.browser.pages.find((p) => p.url === url) ?? null
}

/**
 * True when at least one page the player has actually visited now resolves to a different
 * variant than the one they read. This is what the Day 01 summary reports.
 */
export function hasWitnessedShift(content: DayContent, state: TimelineState): boolean {
  const visited = new Set<string>(state.browser.history.map((h) => h.url).concat(state.browser.url))
  return content.browser.pages.some(
    (page) => visited.has(page.url) && isPageAltered(page, state.temporalShift),
  )
}
