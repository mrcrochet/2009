import { describe, expect, it } from 'vitest'
import { reduce } from '@/engine/reducer'
import { stamp } from '@/engine/events'
import { content, dispatch, fresh, run } from './helpers'

const last = (state: ReturnType<typeof fresh>) => state.terminal.lines.at(-1)
const text = (state: ReturnType<typeof fresh>) =>
  state.terminal.lines.map((line) => line.text).join('\n')

describe('terminal', () => {
  it('answers help and whoami from authored content', () => {
    let state = dispatch(fresh(), { type: 'TERMINAL_COMMAND_RUN', command: 'help' })
    expect(last(state)?.text).toContain('decrypt <file> --key <word>')

    state = dispatch(state, { type: 'TERMINAL_COMMAND_RUN', command: 'whoami' })
    expect(state.terminal.lines.map((l) => l.text).join('\n')).toContain('read-only on all')
  })

  it('rejects an unknown command in the machine’s own style', () => {
    const state = dispatch(fresh(), { type: 'TERMINAL_COMMAND_RUN', command: 'sudo rm -rf /' })
    expect(last(state)?.text).toBe('nova: sudo: command not found')
    expect(last(state)?.tone).toBe('err')
  })

  it('decrypts with the key the case leaked, and pins what it finds', () => {
    const state = dispatch(fresh(), {
      type: 'TERMINAL_COMMAND_RUN',
      command: 'decrypt marlow-2013.enc --key reyes',
    })
    expect(state.files.decrypted).toEqual({ f5: true })
    expect(state.files.openId).toBe('f5')
    expect(state.evidence.map((e) => e.id)).toContain('e7')
    expect(state.exposure).toBe(5)
  })

  it('counts down wrong keys and eventually reports the player', () => {
    let state = fresh()
    for (let i = 0; i < 2; i += 1) {
      state = dispatch(state, {
        type: 'TERMINAL_COMMAND_RUN',
        command: 'decrypt marlow-2013.enc --key 1111',
      })
    }
    expect(last(state)?.text).toContain('1 attempts')

    state = dispatch(state, {
      type: 'TERMINAL_COMMAND_RUN',
      command: 'decrypt marlow-2013.enc --key 2222',
    })
    expect(last(state)?.text).toBe(content.terminal.decrypt.lockout)
    expect(state.flags.decryptReported).toBe(true)
    expect(state.exposure).toBe(30)
  })

  it('cats a text file but not the binary, and only where the file actually is', () => {
    // There is no `passcodes.txt` in the investigator's home, and the shell says so rather than
    // finding it anyway: the lookup table it used to have would answer from anywhere.
    let state = dispatch(fresh(), { type: 'TERMINAL_COMMAND_RUN', command: 'cat passcodes.txt' })
    expect(last(state)?.text).toContain('No such file or directory')

    state = run(state, [
      { type: 'TERMINAL_COMMAND_RUN', command: 'cd /Volumes/Daniel-MBP/Documents' },
      { type: 'TERMINAL_COMMAND_RUN', command: 'cat passcodes.txt' },
    ])
    expect(text(state)).toContain('phone           — 190455')

    state = dispatch(state, { type: 'TERMINAL_COMMAND_RUN', command: 'cat marlow-2013.enc' })
    expect(last(state)?.text).toBe(content.terminal.catBinary)
  })

  it('clear resets to the banner', () => {
    const state = run(fresh(), [
      { type: 'TERMINAL_COMMAND_RUN', command: 'ls' },
      { type: 'TERMINAL_COMMAND_RUN', command: 'clear' },
    ])
    expect(state.terminal.lines).toHaveLength(1)
    expect(state.terminal.lines[0]?.text).toContain('NOVA console')
  })
})

describe('the lockout locks', () => {
  it('refuses the right key once the file has reported', () => {
    let state = fresh()
    for (const key of ['1111', '2222', '3333']) {
      state = dispatch(state, {
        type: 'TERMINAL_COMMAND_RUN',
        command: `decrypt marlow-2013.enc --key ${key}`,
      })
    }
    expect(state.flags.decryptReported).toBe(true)

    const before = state.exposure
    state = dispatch(state, {
      type: 'TERMINAL_COMMAND_RUN',
      command: 'decrypt marlow-2013.enc --key reyes',
    })
    expect(state.files.decrypted.f5).toBeUndefined()
    expect(last(state)?.text).toBe(content.terminal.decrypt.lockout)
    // And exposure stops accruing, so the loudest ending cannot be farmed.
    expect(state.exposure).toBe(before)
  })

  it('opens the file it was given the key to, and no other', () => {
    const state = dispatch(fresh(), {
      type: 'TERMINAL_COMMAND_RUN',
      command: 'decrypt marlow-2013.enc --key reyes',
    })
    expect(state.files.decrypted.f5).toBe(true)
    expect(state.files.decrypted.f2).toBeUndefined()
    expect(state.files.decrypted.f1).toBeUndefined()
  })

  it('counts wrong keys against the file they were tried on', () => {
    const state = run(fresh(), [
      { type: 'TERMINAL_COMMAND_RUN', command: 'decrypt marlow-2013.enc --key 1111' },
      { type: 'TERMINAL_COMMAND_RUN', command: 'decrypt marlow-2013.enc --key 2222' },
    ])
    expect(state.files.decryptAttempts).toEqual({ f5: 2 })
  })

  it('still hands over the evidence when the file was already open', () => {
    const opened = dispatch(fresh(), {
      type: 'TERMINAL_COMMAND_RUN',
      command: 'decrypt marlow-2013.enc --key reyes',
    })
    const forgot = { ...opened, evidence: [] }
    const again = dispatch(forgot, {
      type: 'TERMINAL_COMMAND_RUN',
      command: 'decrypt marlow-2013.enc --key reyes',
    })
    expect(again.evidence.map((e) => e.id)).toContain('e7')
  })

  it('says whose machine this is, once the player can prove whose it is not', () => {
    const before = dispatch(fresh(), { type: 'TERMINAL_COMMAND_RUN', command: 'whoami' })
    const quiet = before.terminal.lines.map((l) => l.text).join('\n')

    const after = run(fresh(), [
      {
        type: 'EVIDENCE_PINNED',
        evidenceId: content.terminal.whoamiAfterEvidence.evidenceId,
        via: 'phone',
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
   * Nothing points along the chain and nothing ever will. A line in the process table, a command
   * that refuses, and a phrase the player has to supply.
   */
  it('refuses the relay until the player supplies the phrase, then stops refusing', () => {
    const relay = content.terminal.relay!

    const cold = dispatch(fresh(), { type: 'TERMINAL_COMMAND_RUN', command: relay.command })
    expect(cold.relay.unlocked).toBe(false)
    expect(cold.windows.some((w) => w.app === 'relay')).toBe(false)
    expect(cold.terminal.lines.map((l) => l.text).join('\n')).toContain('no outbound route')

    // A near miss is still a miss.
    const wrong = dispatch(fresh(), {
      type: 'TERMINAL_COMMAND_RUN',
      command: `${relay.command} --attach the line`,
    })
    expect(wrong.relay.unlocked).toBe(false)

    const open = dispatch(fresh(), {
      type: 'TERMINAL_COMMAND_RUN',
      command: `${relay.command} ${relay.unlockPhrase.toUpperCase()}`,
    })
    expect(open.relay.unlocked).toBe(true)
    // Finding the process opens its window, the way any other application opens.
    expect(open.windows.some((w) => w.app === 'relay')).toBe(true)

    // And once it is known, running it just opens it again.
    const again = dispatch(
      { ...open, windows: open.windows.filter((w) => w.app !== 'relay') },
      { type: 'TERMINAL_COMMAND_RUN', command: relay.command },
    )
    expect(again.windows.some((w) => w.app === 'relay')).toBe(true)
  })

  it('the relay is a case’s decision, not a build-time one', () => {
    // A case with no `relay` block has no such command, and the machine says so in its own words.
    const without = { ...content, terminal: { ...content.terminal, relay: null } }
    const state = reduce(
      fresh(),
      stamp(fresh(), { type: 'TERMINAL_COMMAND_RUN', command: 'relay' }),
      without,
    )
    expect(state.relay.unlocked).toBe(false)
    expect(state.terminal.lines.at(-1)?.text).toContain('command not found')
  })

  it('a flag on a known command is still that command', () => {
    const state = dispatch(fresh(), { type: 'TERMINAL_COMMAND_RUN', command: 'ls -l' })
    expect(text(state)).toContain('Desktop/')
    expect(text(state)).not.toContain('command not found')
  })

  it('ps leaves the one process nothing in the case explains', () => {
    const state = dispatch(fresh(), { type: 'TERMINAL_COMMAND_RUN', command: 'ps' })
    expect(state.terminal.lines.map((l) => l.text).join('\n')).toContain('smirror --peer')
  })
})
