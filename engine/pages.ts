import type { Block, BrowserPage, CaseContent, SearchEntry } from './case-schema'

/**
 * How a page resolves.
 *
 * Content declares variants; the world shows the one whose flag is set. This was keyed on a
 * drift meter as well, which meant the web rewrote itself because a number had grown. What
 * survives is the half that was always the better mechanic: a document reads differently because
 * of something the investigator actually did.
 */

export function resolveBlocks(
  page: BrowserPage,
  flags: Readonly<Record<string, boolean>> = {},
): readonly Block[] {
  // Last matching variant wins, so a case can layer two states on one page by ordering them.
  let best: readonly Block[] = page.blocks
  for (const variant of page.variants) {
    if (flags[variant.whenFlag]) best = variant.blocks
  }
  return best
}

/** True when the page no longer says what it said. */
export function isPageAltered(
  page: BrowserPage,
  flags: Readonly<Record<string, boolean>> = {},
): boolean {
  return page.variants.some((v) => flags[v.whenFlag])
}

export function resolveSearchEntry(
  entry: SearchEntry,
  flags: Readonly<Record<string, boolean>> = {},
): { title: string; snippet: string } {
  let title = entry.title
  let snippet = entry.snippet
  for (const variant of entry.variants) {
    if (flags[variant.whenFlag]) {
      title = variant.title
      snippet = variant.snippet
    }
  }
  return { title, snippet }
}

export function findPage(content: CaseContent, url: string): BrowserPage | null {
  return content.browser.pages.find((p) => p.url === url) ?? null
}

/**
 * True when at least one page the investigator actually read now resolves differently from the
 * version they read. This is what the report notices.
 */
export function hasWitnessedChange(
  content: CaseContent,
  visitedUrls: readonly string[],
  flags: Readonly<Record<string, boolean>>,
): boolean {
  const visited = new Set(visitedUrls)
  return content.browser.pages.some((page) => visited.has(page.url) && isPageAltered(page, flags))
}
