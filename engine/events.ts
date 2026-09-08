import type { GameEvent, TimelineState } from './types'

/**
 * Events are stamped with the in-world minute at which they were dispatched. The reducer then
 * advances time itself, so a replay of the log recomputes identical timestamps.
 */
export type EventInput = Omit<GameEvent, 'at'> extends never ? never : DistributiveOmit<GameEvent, 'at'>

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never

export function stamp(state: TimelineState, input: EventInput): GameEvent {
  return { ...input, at: state.minuteOfDay } as GameEvent
}

export function isMeaningful(event: GameEvent): boolean {
  // Keystroke-level events are state, not history worth persisting on their own.
  switch (event.type) {
    case 'TERMINAL_INPUT_CHANGED':
    case 'RECALL_QUERY_CHANGED':
    case 'BROWSER_QUERY_CHANGED':
    case 'BROWSER_URL_CHANGED':
      return false
    default:
      return true
  }
}

/**
 * Text the player is part-way through typing. These buffers are deliberately kept out of the
 * event log — a save should not carry one row per keystroke — so they are also not part of what
 * a replay reproduces. Every *submitted* input (a search, a Recall, a command) is a real event
 * and does replay.
 */
export function withoutDraftInput(state: TimelineState): TimelineState {
  return {
    ...state,
    recallQuery: '',
    browser: { ...state.browser, query: '' },
    terminal: { ...state.terminal, input: '' },
  }
}
