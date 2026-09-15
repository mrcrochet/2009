import { describe, expect, it } from 'vitest'
import {
  selectCanFileReport,
  selectReportSummary,
  selectMail,
  selectOutstandingBeats,
} from '@/engine/selectors'
import { content, dispatch, fresh, run, throughTheGate } from './helpers'

describe('the report gate', () => {
  it('stays shut until every beat has fired', () => {
    let state = fresh()
    expect(selectCanFileReport(state, content)).toBe(false)
    expect(selectOutstandingBeats(state, content)).toEqual(['statement', 'claire', 'claim'])

    state = dispatch(state, { type: 'FILE_OPENED', fileId: 'f2' })
    expect(state.beats.statement).toBe(true)
    expect(selectCanFileReport(state, content)).toBe(false)
    expect(selectOutstandingBeats(state, content)).toEqual(['claire', 'claim'])
  })

  it('opens once all three have', () => {
    const state = throughTheGate(fresh())
    expect(state.beats).toMatchObject({ statement: true, claire: true, claim: true })
    expect(selectCanFileReport(state, content)).toBe(true)
  })

  it('answering the unknown handle does not count as answering the client', () => {
    const state = run(fresh(), [
      { type: 'CHAT_STARTED', thread: 'unknown' },
      { type: 'CHAT_REPLY_SENT', thread: 'unknown', text: 'Who is this?' },
    ])
    expect(state.beats.claire).toBeUndefined()
  })

  it('filing clears the desk and turns the watcher on', () => {
    let state = throughTheGate(fresh())
    state = run(state, [
      { type: 'APP_OPENED', app: 'devices' },
      { type: 'PHONE_TOGGLED' },
      { type: 'TRAY_TOGGLED', open: true },
    ])
    expect(state.windows.length).toBeGreaterThan(0)

    state = dispatch(state, { type: 'REPORT_FILED' })
    expect(state.stage).toBe('report')
    expect(state.windows).toEqual([])
    expect(state.phone.open).toBe(false)
    expect(state.ui.trayOpen).toBe(false)
    expect(state.ui.watched).toBe(true)
    expect(state.ui.reportCard).toBe(false)
    expect(state.minute).toBe(content.sessionMinutes)

    state = dispatch(state, { type: 'REPORT_CARD_SHOWN' })
    expect(state.ui.reportCard).toBe(true)
  })

  it('the unknown mail quotes back whatever the player filed under their name', () => {
    let state = throughTheGate(fresh())
    state = run(state, [
      { type: 'EVIDENCE_PINNED', evidenceId: 'e1', via: 'mail' },
      { type: 'EVIDENCE_PINNED', evidenceId: 'e3', via: 'files' },
      // An unsound claim is refused and filed anyway — that is what puts it on the record.
      { type: 'CLAIM_ASSERTED', claimId: 'c3', evidenceIds: ['e1', 'e3'] },
      { type: 'REPORT_FILED' },
    ])

    const inbox = selectMail(state, content)
    expect(inbox[0]?.from).toBe('—')
    expect(inbox[0]?.body[1]).toContain('Daniel Mercer left Portland of his own accord.')
  })

  it('says something else when the record is clean', () => {
    const state = dispatch(throughTheGate(fresh()), { type: 'REPORT_FILED' })
    expect(selectMail(state, content)[0]?.body[1]).toBe(content.unknownMail.withoutClaim)
  })

  it('summarises the session honestly', () => {
    let state = throughTheGate(fresh())
    state = run(state, [
      { type: 'EVIDENCE_PINNED', evidenceId: 'e1', via: 'mail' },
      { type: 'REPORT_FILED' },
    ])
    const summary = selectReportSummary(state, content)
    expect(summary.evidenceCount).toBe(1)
    expect(summary.claimCount).toBe(0)
    expect(summary.exposure).toBeGreaterThanOrEqual(0)
  })
})

describe('what the case remembers', () => {
  it('reports what the player did, not only what they have', () => {
    let state = throughTheGate(fresh())
    state = run(state, [
      { type: 'TERMINAL_COMMAND_RUN', command: 'decrypt marlow-2013.enc --key reyes' },
      { type: 'DEVICE_UNLOCK_ATTEMPTED', deviceId: 'dev-phone', key: '190455' },
      { type: 'REPORT_FILED' },
    ])

    const { deeds } = selectReportSummary(state, content)
    expect(deeds).toContain('You opened an encrypted filing on a read-only image. The console logged it.')
    expect(deeds.some((d) => d.includes('You got into the handset'))).toBe(true)
    expect(deeds.some((d) => d.includes("Daniel's NOVA M12"))).toBe(true)
  })

  it('the unknown mail gets louder the louder the player was', () => {
    const quiet = dispatch(throughTheGate(fresh()), { type: 'REPORT_FILED' })
    expect(selectMail(quiet, content)[0]?.body.join(' ')).not.toContain('watching it now')

    let loud = run(throughTheGate(fresh()), [
      { type: 'DEVICE_UNLOCK_ATTEMPTED', deviceId: 'dev-phone', key: '190455' },
      { type: 'EVIDENCE_PINNED', evidenceId: 'e1', via: 'mail' },
      { type: 'EVIDENCE_PINNED', evidenceId: 'e3', via: 'files' },
      { type: 'CLAIM_ASSERTED', claimId: 'c3', evidenceIds: ['e1', 'e3'] },
      { type: 'CLAIM_ASSERTED', claimId: 'c3', evidenceIds: ['e1'] },
    ])
    loud = dispatch(loud, { type: 'REPORT_FILED' })
    expect(loud.exposure).toBeGreaterThanOrEqual(20)
    expect(selectMail(loud, content)[0]?.body.join(' ')).toContain('watching it now')
  })

  it('the machine counts what was written in Notes, and never quotes it', () => {
    const note = 'the receipt is timed after vale says he last saw him'
    let state = run(throughTheGate(fresh()), [{ type: 'NOTES_CHANGED', value: note }])
    state = dispatch(state, { type: 'REPORT_FILED' })
    const body = selectMail(state, content)[0]?.body.join(' ') ?? ''
    expect(body).toContain(`${note.length} characters`)
    expect(body).not.toContain('the receipt is timed')
  })
})

describe('a case’s gate is about that case', () => {
  it('beats are named by the case, not by a closed union', () => {
    expect(content.requiredBeats).toEqual(['statement', 'claire', 'claim'])
    const state = dispatch(fresh(), { type: 'FILE_OPENED', fileId: 'f2' })
    expect(state.beats.statement).toBe(true)
    expect(selectCanFileReport(state, { ...content, requiredBeats: ['statement'] })).toBe(true)
    expect(selectCanFileReport(state, { ...content, requiredBeats: ['something-else'] })).toBe(
      false,
    )
  })

  it('the deeds are authored, not derived in the engine', () => {
    const state = run(fresh(), [
      { type: 'TERMINAL_COMMAND_RUN', command: 'decrypt marlow-2013.enc --key reyes' },
    ])
    const quiet = {
      ...content,
      report: {
        ...content.report,
        deeds: {
          ...content.report.deeds,
          flagged: [{ whenFlag: 'decrypted', text: 'ANOTHER CASE WOULD SAY THIS.' }],
        },
      },
    }
    const deeds = selectReportSummary(state, quiet).deeds
    expect(deeds).toContain('ANOTHER CASE WOULD SAY THIS.')
    expect(deeds).not.toContain(
      'You opened an encrypted filing on a read-only image. The console logged it.',
    )
  })
})
