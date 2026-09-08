import { describe, expect, it } from 'vitest'
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
    expect(state.files.decrypted).toBe(true)
    expect(state.files.openId).toBe('enc')
    expect(state.evidence.map((e) => e.id)).toContain('e7')
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
    expect(state.files.decrypted).toBe(false)
    expect(last(state)?.text).toBe(content.terminal.decrypt.lockout)
    // And heat stops accruing, so the loudest ending cannot be farmed.
    expect(state.heat).toBe(before)
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
