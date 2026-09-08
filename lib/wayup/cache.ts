import { createHash } from 'node:crypto'
import type { WayUpBlock, WayUpDocument, WayUpLink, WayUpSnapshot } from './types'

/**
 * Turns a live document into an immutable snapshot.
 *
 * This is the piece that makes a non-deterministic web safe for a deterministic engine. The
 * engine never stores a URL to re-fetch; it stores a snapshot id, and the snapshot is a value
 * that cannot change afterwards. Replaying a save therefore shows the page as it was on the day
 * the player read it, not as it is today, which is both correct engineering and, as it happens,
 * exactly the fiction.
 */

const MAX_BLOCKS = 400
const MAX_BLOCK_CHARS = 4_000

/** Hex SHA-256 over the normalised content, deliberately excluding the capture time. */
export function contentHashOf(
  canonicalUrl: string,
  title: string,
  blocks: readonly WayUpBlock[],
): string {
  const hash = createHash('sha256')
  hash.update(canonicalUrl)
  hash.update('\n')
  hash.update(title)
  for (const block of blocks) {
    hash.update('\n')
    hash.update(block.kind)
    hash.update('\n')
    hash.update(block.kind === 'list' ? block.items.join('') : 'text' in block ? block.text : '')
  }
  return hash.digest('hex')
}

/**
 * The id folds in the content hash on purpose.
 *
 * Capturing an unchanged page twice yields the same id, so a timeline that reads the same
 * article twice holds one snapshot. A page that has changed yields a different id, which is the
 * whole temporal-checksum mechanic obtained for free rather than bolted on.
 */
export function snapshotIdFor(canonicalUrl: string, contentHash: string): string {
  const digest = createHash('sha256').update(`${canonicalUrl}\n${contentHash}`).digest('hex')
  return `wu_${digest.slice(0, 32)}`
}

/**
 * Markdown or plain text into blocks HALCYON can draw.
 *
 * Only the block kinds the renderer knows are produced; anything unrecognised becomes a
 * paragraph. Nothing here can emit markup: the output is text in a discriminated union, and the
 * renderer sets it as a text node.
 */
export function toBlocks(text: string): WayUpBlock[] {
  const blocks: WayUpBlock[] = []
  const paragraphs = text.split(/\n{2,}/)

  for (const raw of paragraphs) {
    if (blocks.length >= MAX_BLOCKS) break
    const paragraph = raw.trim()
    if (paragraph.length === 0) continue

    const heading = /^(#{1,6})\s+(.*)$/.exec(paragraph)
    if (heading) {
      const depth = heading[1]!.length
      blocks.push({
        kind: 'heading',
        level: depth <= 1 ? 1 : depth === 2 ? 2 : 3,
        text: clip(heading[2] ?? ''),
      })
      continue
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(paragraph)) {
      blocks.push({ kind: 'rule' })
      continue
    }

    if (paragraph.split('\n').every((line) => /^\s*>/.test(line))) {
      blocks.push({ kind: 'quote', text: clip(paragraph.replace(/^\s*>\s?/gm, '')) })
      continue
    }

    if (paragraph.startsWith('```')) {
      blocks.push({ kind: 'code', text: clip(paragraph.replace(/^```[^\n]*\n?|\n?```$/g, '')) })
      continue
    }

    const lines = paragraph.split('\n')
    if (lines.length > 1 && lines.every((line) => /^\s*([-*+]|\d+\.)\s+/.test(line))) {
      blocks.push({
        kind: 'list',
        items: lines.map((line) => clip(line.replace(/^\s*([-*+]|\d+\.)\s+/, ''))).slice(0, 100),
      })
      continue
    }

    blocks.push({ kind: 'p', text: clip(paragraph.replace(/\n/g, ' ')) })
  }

  return blocks
}

function clip(value: string): string {
  return value.length > MAX_BLOCK_CHARS ? `${value.slice(0, MAX_BLOCK_CHARS)}…` : value
}

export function snapshotFrom(document: WayUpDocument, provider: string): WayUpSnapshot {
  const blocks = toBlocks(document.text)
  const contentHash = contentHashOf(document.canonicalUrl, document.title, blocks)
  return {
    id: snapshotIdFor(document.canonicalUrl, contentHash),
    canonicalUrl: document.canonicalUrl,
    title: document.title,
    remoteFetchedAt: document.remoteFetchedAt,
    contentHash,
    blocks,
    outgoingLinks: document.links.slice(0, 60),
    provider,
    byteLength: document.text.length,
  }
}

/**
 * A per-process memo, so opening the same page twice in one session costs one outbound request.
 *
 * Deliberately not the durable store: persistence belongs to the timeline (IndexedDB for guests,
 * Supabase for accounts), because a snapshot is part of a save, not part of a server's cache.
 * This only stops the obvious duplicate.
 */
const memo = new Map<string, { snapshot: WayUpSnapshot; at: number }>()
const MEMO_TTL_MS = 5 * 60 * 1000
const MEMO_MAX = 200

export function rememberSnapshot(snapshot: WayUpSnapshot): void {
  if (memo.size >= MEMO_MAX) {
    const oldest = [...memo.entries()].sort((a, b) => a[1].at - b[1].at)[0]
    if (oldest) memo.delete(oldest[0])
  }
  memo.set(snapshot.canonicalUrl, { snapshot, at: Date.now() })
}

export function recallSnapshot(canonicalUrl: string): WayUpSnapshot | null {
  const hit = memo.get(canonicalUrl)
  if (!hit) return null
  if (Date.now() - hit.at > MEMO_TTL_MS) {
    memo.delete(canonicalUrl)
    return null
  }
  return hit.snapshot
}

export function __clearSnapshotMemo(): void {
  memo.clear()
}

// ------------------------------------------------------------- extraction
//
// Lives here rather than in `provider.ts` for one reason: `provider.ts` holds the API key and
// carries `server-only`, and this is the code most worth testing. Turning hostile markup into
// text is a normalisation concern anyway, which is what this module is.

export function normaliseLinks(urls: readonly string[]): WayUpLink[] {
  const seen = new Set<string>()
  const out: WayUpLink[] = []
  for (const url of urls) {
    if (out.length >= 60) break
    if (!/^https?:\/\//i.test(url) || seen.has(url)) continue
    seen.add(url)
    let label = url
    try {
      const parsed = new URL(url)
      label = `${parsed.hostname}${parsed.pathname === '/' ? '' : parsed.pathname}`
    } catch {
      /* keep the raw string */
    }
    out.push({ label: label.slice(0, 120), url })
  }
  return out
}

/**
 * A deliberately small HTML-to-text pass.
 *
 * This is not a parser and does not try to be: it strips the things that execute or style, then
 * takes the text. Anything it fails to understand degrades into plain text, which is the safe
 * direction — the output is rendered by HALCYON as text blocks and is never inserted as markup.
 */
export function extractFromHtml(
  html: string,
  baseUrl: string,
): {
  title: string
  text: string
  links: WayUpLink[]
} {
  const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1]?.trim() ?? baseUrl

  const links: string[] = []
  const hrefs = /<a\b[^>]*\bhref\s*=\s*["']([^"']+)["']/gi
  let match: RegExpExecArray | null
  while ((match = hrefs.exec(html)) && links.length < 200) {
    const href = match[1]
    if (!href) continue
    try {
      links.push(new URL(href, baseUrl).toString())
    } catch {
      /* a relative href we cannot resolve is not a link */
    }
  }

  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<\/(p|div|section|article|li|h[1-6]|tr|blockquote)>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return { title: decodeEntities(title).slice(0, 300), text, links: normaliseLinks(links) }
}

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}
