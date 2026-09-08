import { describe, expect, it } from 'vitest'
import { reduce } from '@/engine/reducer'
import { stamp } from '@/engine/events'
import { content, dispatch, fresh, run } from './helpers'

const last = (state: ReturnType<typeof fresh>) => state.terminal.lines.at(-1)

describe('terminal', () => {
  it('answers help, ls and whoami from authored content', () => {
    let state = dispatch(fresh(), { type: 'TERMINAL_COMMAND_RUN', command: 'help' })
    expect(last(state)?.text).toContain('decrypt <file> --key <key>')

    state = dispatch(state, { type: 'TERMINAL_COMMAND_RUN', command: 'ls' })
    expect(last(state)?.text).toContain('cibles.enc')

    state = dispatch(state, { type: 'TERMINAL_COMMAND_RUN', command: 'whoami' })
    expect(last(state)?.text).toContain('Rask, Owen T.')
  })

  it('rejects an unknown command in period style', () => {
    const state = dispatch(fresh(), { type: 'TERMINAL_COMMAND_RUN', command: 'sudo rm -rf /' })
    expect(last(state)?.text).toBe('sudo: command not found')
    expect(last(state)?.tone).toBe('err')
  })

  it('decrypts with the key the SMS leaked, and pins what it finds', () => {
    const state = dispatch(fresh(), {
      type: 'TERMINAL_COMMAND_RUN',
      command: 'decrypt cibles.enc --key 0412',
    })
    expect(state.files.decrypted).toEqual({ enc: true })
    expect(state.files.openId).toBe('enc')
    expect(state.evidence.map((e) => e.id)).toContain('1:e7')
    expect(state.heat).toBe(5)
  })

  it('counts down wrong keys and eventually reports the player', () => {
    let state = fresh()
    for (let i = 0; i < 2; i += 1) {
      state = dispatch(state, {
        type: 'TERMINAL_COMMAND_RUN',
        command: 'decrypt cibles.enc --key 1111',
      })
    }
    expect(last(state)?.text).toContain('1 attempts remain')

    state = dispatch(state, {
      type: 'TERMINAL_COMMAND_RUN',
      command: 'decrypt cibles.enc --key 2222',
    })
    expect(last(state)?.text).toBe(content.terminal.decrypt.lockout)
    expect(state.flags.decryptReported).toBe(true)
    expect(state.heat).toBe(30)
  })

  it('cats a text file but not the binary', () => {
    let state = dispatch(fresh(), { type: 'TERMINAL_COMMAND_RUN', command: 'cat READ_ME.txt' })
    expect(last(state)?.text).toContain('Amount due: $10,000.00')

    state = dispatch(state, { type: 'TERMINAL_COMMAND_RUN', command: 'cat cibles.enc' })
    expect(last(state)?.text).toBe('cat: cannot display binary file')
  })

  it('clear resets to the banner', () => {
    const state = run(fresh(), [
      { type: 'TERMINAL_COMMAND_RUN', command: 'ls' },
      { type: 'TERMINAL_COMMAND_RUN', command: 'clear' },
    ])
    expect(state.terminal.lines).toHaveLength(1)
    expect(state.terminal.lines[0]?.text).toContain('Halcyon Terminal')
  })
})

describe('the lockout locks', () => {
  it('refuses the right key once the file has reported', () => {
    let state = fresh()
    for (const key of ['1111', '2222', '3333']) {
      state = dispatch(state, {
        type: 'TERMINAL_COMMAND_RUN',
        command: `decrypt cibles.enc --key ${key}`,
      })
    }
    expect(state.flags.decryptReported).toBe(true)

    const before = state.heat
    state = dispatch(state, {
      type: 'TERMINAL_COMMAND_RUN',
      command: 'decrypt cibles.enc --key 0412',
    })
    expect(state.files.decrypted.enc).toBeUndefined()
    expect(last(state)?.text).toBe(content.terminal.decrypt.lockout)
    // And heat stops accruing, so the loudest ending cannot be farmed.
    expect(state.heat).toBe(before)
  })

  /**
   * A single boolean meant Thursday's key opened Friday's different file, and three wrong
   * guesses on Thursday locked a player out of a document they had not seen. Two players got
   * materially different days for a reason that was a bug rather than a decision.
   */
  it('opens the file it was given the key to, and no other', () => {
    const state = dispatch(fresh(), {
      type: 'TERMINAL_COMMAND_RUN',
      command: 'decrypt cibles.enc --key 0412',
    })
    expect(state.files.decrypted.enc).toBe(true)
    expect(state.files.decrypted.route).toBeUndefined()
    expect(state.files.decrypted.readme).toBeUndefined()
  })

  it('counts wrong keys against the file they were tried on', () => {
    const state = run(fresh(), [
      { type: 'TERMINAL_COMMAND_RUN', command: 'decrypt cibles.enc --key 1111' },
      { type: 'TERMINAL_COMMAND_RUN', command: 'decrypt cibles.enc --key 2222' },
    ])
    expect(state.files.decryptAttempts).toEqual({ enc: 2 })
  })

  it('still hands over the evidence when the file was opened last night', () => {
    // The night carries `decrypted`; without this the terminal says it worked and gives nothing.
    const opened = dispatch(fresh(), {
      type: 'TERMINAL_COMMAND_RUN',
      command: 'decrypt cibles.enc --key 0412',
    })
    const forgot = { ...opened, evidence: [] }
    const again = dispatch(forgot, {
      type: 'TERMINAL_COMMAND_RUN',
      command: 'decrypt cibles.enc --key 0412',
    })
    expect(again.evidence.map((e) => e.id)).toContain('1:e7')
  })

  /**
   * Authored unqualified, held qualified. Comparing them raw made this unreachable the day
   * evidence ids were namespaced, and nothing failed — the machine simply stopped saying the one
   * thing it knows about the man whose name is on it.
   */
  it('says whose machine this is, once the player can prove it is not theirs', () => {
    const before = dispatch(fresh(), { type: 'TERMINAL_COMMAND_RUN', command: 'whoami' })
    const quiet = before.terminal.lines.map((l) => l.text).join('\n')

    const after = run(fresh(), [
      {
        type: 'EVIDENCE_PINNED',
        evidenceId: content.terminal.whoamiAfterEvidence.evidenceId,
        via: 'files',
      },
      { type: 'TERMINAL_COMMAND_RUN', command: 'whoami' },
    ])
    const loud = after.terminal.lines.map((l) => l.text).join('\n')

    expect(loud.length).toBeGreaterThan(quiet.length)
    for (const line of content.terminal.whoamiAfterEvidence.lines) {
      expect(loud).toContain(line.text)
    }
  })

  /**
   * Three pages that never mention each other: a ring directory saying nine members and no
   * owner, a process list holding nine of something, and a links page from 2004 naming the host
   * the graphic has always come from. Nothing points along the chain and nothing ever will.
   */
  it('refuses the relay until the player supplies the host, then stops refusing', () => {
    const relay = content.terminal.relay!

    const cold = dispatch(fresh(), { type: 'TERMINAL_COMMAND_RUN', command: relay.command })
    expect(cold.wayup.unlocked).toBe(false)
    expect(cold.ui.wayupOpen).toBe(false)
    expect(cold.terminal.lines.map((l) => l.text).join('\n')).toContain('listener not attached')

    // A near miss is still a miss.
    const wrong = dispatch(fresh(), {
      type: 'TERMINAL_COMMAND_RUN',
      command: `${relay.command} --attach geohost.com`,
    })
    expect(wrong.wayup.unlocked).toBe(false)

    const open = dispatch(fresh(), {
      type: 'TERMINAL_COMMAND_RUN',
      command: `${relay.command} --attach ${relay.unlockPhrase.toUpperCase()}`,
    })
    expect(open.wayup.unlocked).toBe(true)
    expect(open.ui.wayupOpen).toBe(true)

    // And once it is known, running it just opens it.
    const again = dispatch(
      { ...open, ui: { ...open.ui, wayupOpen: false } },
      { type: 'TERMINAL_COMMAND_RUN', command: relay.command },
    )
    expect(again.ui.wayupOpen).toBe(true)
  })

  it('the relay is a day’s decision, not a build-time one', () => {
    // A day with no `relay` block has no such command, and the machine says so in its own words.
    const without = { ...content, terminal: { ...content.terminal, relay: null } }
    const state = reduce(
      fresh(),
      stamp(fresh(), { type: 'TERMINAL_COMMAND_RUN', command: 'qlmux' }),
      without,
    )
    expect(state.wayup.unlocked).toBe(false)
    expect(state.terminal.lines.at(-1)?.text).toContain('command not found')
  })

  it('a flag on a known command is still that command', () => {
    const state = dispatch(fresh(), { type: 'TERMINAL_COMMAND_RUN', command: 'ls -l' })
    expect(last(state)?.text).toContain('cibles.enc')
  })

  it('ps leaves the surveillance in the process table', () => {
    const state = dispatch(fresh(), { type: 'TERMINAL_COMMAND_RUN', command: 'ps' })
    expect(state.terminal.lines.map((l) => l.text).join('\n')).toContain('hd_sync --remote --quiet')
  })
})
