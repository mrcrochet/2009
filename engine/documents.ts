/**
 * What a document *is*, worked out from what the case authored.
 *
 * A case writes a spreadsheet as a spreadsheet and a receipt as a receipt; it should not also
 * have to write the table markup, and a React component may not decide that a column of dollars
 * is a column of dollars. So the reading happens here, where it is pure, testable and shared by
 * every surface that shows the document — the Files body, Quick Look, and the report.
 */

import { mulberry32, hashSeed } from './seed'

// ---------------------------------------------------------------------------
// Sheets
// ---------------------------------------------------------------------------

export type CellAlign = 'left' | 'right'

export interface SheetTable {
  readonly columns: readonly string[]
  readonly align: readonly CellAlign[]
  readonly rows: readonly (readonly string[])[]
  /** A summary line the author wrote under the table, e.g. `TOTAL 4118204`. */
  readonly total: string | null
  /** Lines that are not rows: a truncation note, a cell comment somebody left in the file. */
  readonly notes: readonly SheetNote[]
}

export interface SheetNote {
  /** `D1` from `[cell comment, D1]` — the cell it hangs off, when the author named one. */
  readonly anchor: string | null
  readonly text: string
}

const COMMENT = /^\[([^\]]*)\]\s*(.*)$/
const TOTAL = /^(total|sum)\b/i
/** `cell comment, D1` → `D1`. An author writes the prose; the anchor is the last field. */
const ANCHOR = /,\s*([A-Z]{1,2}\d{1,4})\s*$/

/**
 * Reads the delimited block out of an authored body.
 *
 * Deliberately forgiving: a case's spreadsheet is prose with commas in it, not RFC 4180, and a
 * row that does not fit the header is kept as a note rather than dropped. Losing a line of an
 * authored document to a parser is worse than showing it in the margin.
 */
export function parseSheet(body: string): SheetTable {
  const lines = body.split('\n')
  let header: string[] | null = null
  const rows: string[][] = []
  const notes: SheetNote[] = []
  let total: string | null = null

  for (const raw of lines) {
    const line = raw.trim()
    if (line === '') continue

    const fields = line.split(',').map((f) => f.trim())

    if (!header) {
      if (fields.length > 1) header = fields
      else notes.push(note(line))
      continue
    }

    if (TOTAL.test(line) && total === null) {
      total = line
      continue
    }

    if (fields.length === header.length && !COMMENT.test(line)) {
      rows.push(fields)
      continue
    }

    notes.push(note(line))
  }

  const columns = header ?? []
  const align = columns.map((_, i): CellAlign =>
    rows.length > 0 && rows.every((r) => isNumeric(r[i] ?? '')) ? 'right' : 'left',
  )

  return { columns, align, rows, total, notes }
}

function note(line: string): SheetNote {
  const match = COMMENT.exec(line)
  if (!match) return { anchor: null, text: line }
  const inside = match[1] ?? ''
  const anchor = ANCHOR.exec(inside)
  return { anchor: anchor?.[1] ?? null, text: (match[2] ?? '').trim() }
}

function isNumeric(cell: string): boolean {
  return cell !== '' && /^-?\d+(\.\d+)?$/.test(cell)
}

/**
 * Thousands separators, done by hand.
 *
 * `toLocaleString` would render this machine's idea of a number rather than the case's — the
 * corpus is Portland, Oregon and USD, and a build running under a French locale must not quietly
 * turn $4,118,204 into 4 118 204.
 */
export function groupDigits(cell: string): string {
  if (!isNumeric(cell)) return cell
  const negative = cell.startsWith('-')
  const [whole = '', fraction] = (negative ? cell.slice(1) : cell).split('.')
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `${negative ? '-' : ''}${grouped}${fraction ? `.${fraction}` : ''}`
}

/**
 * The same grouping, applied to the numbers inside a line of prose.
 *
 * A summary row is a sentence an author wrote — `TOTAL 4118204` — not a cell, and printing the
 * total ungrouped directly under a column of grouped figures reads as a different number.
 *
 * Five digits and up, deliberately: in prose a four-digit run is usually a year, and turning
 * 2013 into 2,013 in the middle of a sentence is a worse error than leaving a small total plain.
 */
export function groupDigitsIn(line: string): string {
  return line.replace(/\d{5,}/g, (run) => groupDigits(run))
}

// ---------------------------------------------------------------------------
// Recordings
// ---------------------------------------------------------------------------

/**
 * The bars of a recording's waveform.
 *
 * Derived from the document's id rather than authored, because nobody should have to hand-write
 * sixty numbers to describe nine seconds of a man leaving a voicemail — and derived rather than
 * random, because the same recording has to look the same in a replay as it did in the session.
 * Speech, not a sine wave: syllables, and gaps between them.
 */
export function waveform(id: string, bars = 64): readonly number[] {
  const rand = mulberry32(hashSeed(id))
  const out: number[] = []
  // A syllable is a short swell. Between them the line drops to room tone rather than to zero.
  let remaining = 0
  let peak = 0
  for (let i = 0; i < bars; i += 1) {
    if (remaining <= 0) {
      remaining = 2 + Math.floor(rand() * 5)
      peak = rand() < 0.22 ? 0.12 + rand() * 0.14 : 0.42 + rand() * 0.58
    }
    remaining -= 1
    const jitter = 0.82 + rand() * 0.36
    out.push(Math.min(1, Math.max(0.06, peak * jitter)))
  }
  return out
}

export interface TimedCue {
  readonly at: number
  readonly who: string
  readonly text: string
}

/** Which line is being spoken at `t` seconds, or -1 before the first one. */
export function cueIndexAt(cues: readonly TimedCue[], t: number): number {
  let index = -1
  for (let i = 0; i < cues.length; i += 1) {
    const cue = cues[i]
    if (cue && cue.at <= t) index = i
    else break
  }
  return index
}

/** `0:09`. Recordings in this product are seconds and minutes long, never hours. */
export function timecode(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds))
  const mins = Math.floor(whole / 60)
  const secs = whole % 60
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`
}
