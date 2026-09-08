import type { GameEvent, TimelineState } from './types'

/**
 * Events are stamped with the in-world minute at which they were dispatched. The reducer then
 * advances time itself, so a replay of the log recomputes identical timestamps.
 */
export type EventInput =
  Omit<GameEvent, 'at'> extends never ? never : DistributiveOmit<GameEvent, 'at'>

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never

/**
 * The event vocabulary as runtime data. `satisfies` ties it to the union, so adding a variant to
 * `GameEvent` without listing it here is a type error rather than a save that silently drops
 * events on replay.
 */
export const GAME_EVENT_TYPES = [
  'WOKE_UP',
  'BOOT_ADVANCED',
  'BOOT_COMPLETED',
  'DESKTOP_ICON_APPEARED',
  'APP_OPENED',
  'APP_CLOSED',
  'APP_FOCUSED',
  'APP_MINIMIZED',
  'APP_ZOOM_TOGGLED',
  'WINDOW_MOVED',
  'PHONE_TOGGLED',
  'PHONE_TAB_CHANGED',
  'PHONE_MOVED',
  'SMS_ADVANCED',
  'MAIL_OPENED',
  'MAIL_UNKNOWN_ARRIVED',
  'THREAD_SELECTED',
  'CHAT_REPLY_SENT',
  'CHAT_STARTED',
  'CHAT_ADVANCED',
  'BROWSER_QUERY_CHANGED',
  'BROWSER_URL_CHANGED',
  'BROWSER_SEARCHED',
  'BROWSER_NAVIGATED',
  'BROWSER_WENT_BACK',
  'BROWSER_WENT_FORWARD',
  'FILE_OPENED',
  'TERMINAL_INPUT_CHANGED',
  'TERMINAL_COMMAND_RUN',
  'NOTES_CHANGED',
  'RECALL_QUERY_CHANGED',
  'RECALL_USED',
  'EVIDENCE_PINNED',
  'EVIDENCE_SELECTION_TOGGLED',
  'CLAIM_SELECTED',
  'CLAIM_ASSERTED',
  'TRAY_TOGGLED',
  'BOARD_TOGGLED',
  'ITEM_PURCHASED',
  'ITEM_LISTED',
  'ITEM_SOLD',
  'DOMAIN_REGISTERED',
  'WATCHLIST_TOGGLED',
  'DAY_ENDED',
  'DAY_CARD_SHOWN',
  'DAY_ADVANCED',
  'TIMELINE_CLAIMED',
  'WAYUP_UNLOCKED',
  'WAYUP_SNAPSHOT_OBSERVED',
  'WAYUP_EVIDENCE_PINNED',
  'MYSTERY_OPENED',
  'WORLD_ARTIFACTS_SEEN',
] as const satisfies readonly GameEvent['type'][]

const KNOWN = new Set<string>(GAME_EVENT_TYPES)

export function isKnownEventType(type: string): type is GameEvent['type'] {
  return KNOWN.has(type)
}

export function stamp(state: TimelineState, input: EventInput): GameEvent {
  return { ...input, at: state.minuteOfDay } as GameEvent
}

/**
 * Events that carry the player's whole current text rather than a delta. Appending one per
 * keystroke makes the log — and therefore every save — grow with the square of what they typed,
 * so the store replaces the previous entry instead. Replay is unaffected: only the last value of
 * a run matters, and that is what survives.
 */
export function supersedesPrevious(event: GameEvent, previous: GameEvent | undefined): boolean {
  if (!previous || previous.type !== event.type) return false
  return event.type === 'NOTES_CHANGED'
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
    // An address typed but never submitted is a draft like any other. Only `view: 'page'` or
    // `'results'` means the player actually went somewhere, and those events are in the log.
    browser: { ...state.browser, query: '', draftUrl: null },
    terminal: { ...state.terminal, input: '' },
  }
}
