import { describe, expect, it } from 'vitest'
import {
  cueIndexAt,
  groupDigits,
  groupDigitsIn,
  parseSheet,
  timecode,
  waveform,
} from '@/engine/documents'
import {
  selectDocument,
  selectPhonePhotos,
  selectPhoto,
  selectPhotos,
  selectQuickLook,
} from '@/engine/selectors'
import { content, dispatch, fresh, run } from './helpers'

/**
 * A document's *nature* is authored; the reading of it is derived. These are the derivations, so
 * a component never has to decide what a column of digits means.
 */
describe('reading a document', () => {
  const sheet = content.files.find((f) => f.id === 'f7')!

  it('reads an authored spreadsheet as a table, not as a paragraph', () => {
    const table = parseSheet(sheet.body)
    expect(table.columns).toEqual(['date', 'recipient', 'amount', 'counterparty_on_file'])
    expect(table.rows).toHaveLength(11)
    expect(table.rows.every((r) => r.length === table.columns.length)).toBe(true)
  })

  it('right-aligns a column only when every cell in it is a number', () => {
    const table = parseSheet(sheet.body)
    expect(table.align[2]).toBe('right')
    expect(table.align[0]).toBe('left')
    expect(table.align[1]).toBe('left')
  })

  it('keeps the total and the comment somebody left in a cell', () => {
    const table = parseSheet(sheet.body)
    expect(table.total).toContain('4118204')
    const note = table.notes.find((n) => n.anchor === 'D1')
    expect(note, 'the cell comment survived the parse').toBeDefined()
    expect(note!.text).toContain('asked three people')
  })

  /** Losing a line of an authored document to a parser is worse than printing it in the margin. */
  it('never drops a line it cannot fit into the table', () => {
    const table = parseSheet(content.files.find((f) => f.id === 'f6')!.body)
    expect(table.notes.some((n) => n.text.includes('139 further records'))).toBe(true)
  })

  it('groups digits without asking this machine what country it is in', () => {
    expect(groupDigits('4118204')).toBe('4,118,204')
    expect(groupDigits('412000')).toBe('412,000')
    expect(groupDigits('-1234.5')).toBe('-1,234.5')
    expect(groupDigits('2013-03-14')).toBe('2013-03-14')
    expect(groupDigits('no')).toBe('no')
  })

  /** A total printed ungrouped under a grouped column reads as a different number. */
  it('groups the numbers inside a summary line, and leaves a year alone', () => {
    expect(groupDigitsIn('TOTAL 4118204')).toBe('TOTAL 4,118,204')
    expect(groupDigitsIn('11 rows, 2013')).toBe('11 rows, 2013')
  })
})

describe('a recording', () => {
  it('draws the same waveform every time, because a replay has to look like the session', () => {
    expect(waveform('f8')).toEqual(waveform('f8'))
    expect(waveform('f8')).not.toEqual(waveform('f9'))
    expect(waveform('f8', 12)).toHaveLength(12)
    expect(waveform('f8').every((h) => h > 0 && h <= 1)).toBe(true)
  })

  it('knows which line is being spoken, and that none is before the first', () => {
    const cues = [
      { at: 0.4, who: 'A', text: 'one' },
      { at: 1.8, who: 'A', text: 'two' },
      { at: 3.4, who: 'A', text: 'three' },
    ]
    expect(cueIndexAt(cues, 0)).toBe(-1)
    expect(cueIndexAt(cues, 0.4)).toBe(0)
    expect(cueIndexAt(cues, 1.7)).toBe(0)
    expect(cueIndexAt(cues, 3.4)).toBe(2)
    expect(cueIndexAt(cues, 900)).toBe(2)
  })

  it('counts in minutes and seconds', () => {
    expect(timecode(0)).toBe('0:00')
    expect(timecode(9.7)).toBe('0:09')
    expect(timecode(75)).toBe('1:15')
    expect(timecode(-4)).toBe('0:00')
  })
})

describe('what is on this machine', () => {
  const unlocked = () =>
    run(fresh(), [{ type: 'DEVICE_UNLOCK_ATTEMPTED', deviceId: 'dev-phone', key: '190455' }])

  /**
   * The rule the viewer rests on. A photograph belongs to the source it came off; a source
   * nobody has opened has had nothing extracted from it, and a grid that shows the frames anyway
   * is handing over the contents of a locked phone.
   */
  it('shows nothing off a source nobody has opened', () => {
    expect(selectPhotos(fresh(), content)).toHaveLength(0)
    expect(selectPhonePhotos(fresh(), content)).toHaveLength(0)
    expect(selectPhoto(fresh(), content, 'p1')).toBeNull()
  })

  it('shows every frame once the source is open', () => {
    const state = unlocked()
    expect(selectPhotos(state, content).map((p) => p.id)).toEqual(['p1', 'p2', 'p3'])
    expect(selectPhonePhotos(state, content).map((p) => p.id)).toEqual(['p1', 'p2', 'p3'])
  })

  /** The handset shows a picture and a line; the workstation shows what the extraction found. */
  it('gives the viewer the extraction the handset would never print', () => {
    const photo = selectPhoto(unlocked(), content, 'p1')!
    expect(photo.source).toBe("Daniel's NOVA M12")
    expect(photo.detail.length).toBeGreaterThan(0)
    expect(photo.detail.join(' ')).toContain('No GPS block')
  })

  it('refuses to select a frame off a locked source', () => {
    const state = dispatch(fresh(), { type: 'PHOTO_SELECTED', photoId: 'p2' })
    expect(state.media.openPhotoId).not.toBe('p2')
  })

  it('moves the viewer when the frame is reachable', () => {
    const state = dispatch(unlocked(), { type: 'PHOTO_SELECTED', photoId: 'p3' })
    expect(state.media.openPhotoId).toBe('p3')
  })
})

describe('quick look', () => {
  it('holds up a document the case authored', () => {
    const state = dispatch(fresh(), { type: 'QUICK_LOOK_OPENED', ref: { kind: 'file', id: 'f3' } })
    const held = selectQuickLook(state, content)
    expect(held?.kind).toBe('file')
    expect(held && held.kind === 'file' && held.document.name).toBe('receipt-fremont-0609.pdf')
  })

  it('refuses a reference to something that is not there', () => {
    const state = dispatch(fresh(), {
      type: 'QUICK_LOOK_OPENED',
      ref: { kind: 'file', id: 'nope' },
    })
    expect(state.ui.quickLook).toBeNull()
  })

  /** A second way to read a document, never a way round the rule about which documents exist. */
  it('refuses a picture off a source nobody has opened', () => {
    const state = dispatch(fresh(), { type: 'QUICK_LOOK_OPENED', ref: { kind: 'photo', id: 'p1' } })
    expect(state.ui.quickLook).toBeNull()
  })

  it('puts it down', () => {
    const state = run(fresh(), [
      { type: 'QUICK_LOOK_OPENED', ref: { kind: 'file', id: 'f1' } },
      { type: 'QUICK_LOOK_CLOSED' },
    ])
    expect(state.ui.quickLook).toBeNull()
    expect(selectQuickLook(state, content)).toBeNull()
  })

  it('reads a held document as read', () => {
    const state = dispatch(fresh(), { type: 'QUICK_LOOK_OPENED', ref: { kind: 'file', id: 'f3' } })
    expect(state.discovered).toContain(`${content.id}.file.f3`)
  })
})

describe('a sealed document', () => {
  it('says it is sealed, and does not preview what is inside it', () => {
    const doc = selectDocument(fresh(), content, 'f5')!
    expect(doc.sealed).toBe(true)
    expect(doc.kind).toBe('encrypted')
    expect(doc.body).not.toContain('MARLOW FOUNDATION')
    expect(doc.evidenceId).toBeNull()
  })

  it('becomes what it turns out to be once it is open', () => {
    const state = run(fresh(), [
      { type: 'APP_OPENED', app: 'term' },
      {
        type: 'TERMINAL_COMMAND_RUN',
        command: `decrypt marlow-2013.enc --key ${content.terminal.decrypt.key}`,
      },
    ])
    const doc = selectDocument(state, content, 'f5')!
    expect(doc.sealed).toBe(false)
    expect(doc.kind).toBe('scan')
    expect(doc.body).toContain('MARLOW FOUNDATION')
    expect(doc.evidenceId).toBe('e7')
  })
})
