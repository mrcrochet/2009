import type { DayContent } from './content-schema'
import { DEFAULT_WAKE_MINUTE } from './clock'
import { hashSeed } from './seed'
import { SCHEMA_VERSION, type ChatLine, type Stage, type TimelineState } from './types'

export interface CreateTimelineOptions {
  readonly id: string
  readonly ownerId?: string | null
  readonly stage?: Stage
  readonly now?: string
}

export function createTimeline(content: DayContent, opts: CreateTimelineOptions): TimelineState {
  const now = opts.now ?? new Date(0).toISOString()
  const threadIds = content.threads.map((t) => t.id)
  const byThread = <T>(value: T): Record<string, T> =>
    Object.fromEntries(threadIds.map((id) => [id, value]))
  return {
    id: opts.id,
    ownerId: opts.ownerId ?? null,
    schemaVersion: SCHEMA_VERSION,
    seed: hashSeed(opts.id),

    stage: opts.stage ?? 'landing',
    day: content.day,
    dateISO: content.dateISO,
    minuteOfDay: content.wakeMinute ?? DEFAULT_WAKE_MINUTE,

    cashCents: content.economy.openingCashCents,
    memoryIntegrity: 100,
    heat: 0,
    divergence: 0,
    temporalShift: 0,

    bootLine: 0,

    windows: [],
    nextZ: 20,
    desktopIcons: [],
    phone: { open: false, tab: 'sms', x: null, y: null, smsStep: 0 },

    evidence: [],
    selectedEvidenceIds: [],
    selectedClaimId: null,
    lastVerdict: null,
    claimLog: [],

    mail: {
      openId: content.mail[0]?.id ?? '',
      readIds: content.mail[0] ? [content.mail[0].id] : [],
      unknownArrived: false,
    },
    chat: {
      // Whatever the day calls its correspondents, not a hard-coded trio.
      thread: threadIds[0] ?? '',
      log: byThread<readonly ChatLine[]>([]),
      step: byThread(0),
      waiting: byThread(false),
      pendingReply: byThread<string | null>(null),
      pendingAdvance: byThread(true),
    },
    browser: {
      view: 'home',
      url: content.browser.home,
      query: '',
      resultIds: [],
      draftUrl: null,
      history: [],
      forward: [],
    },
    files: { openId: content.files[0]?.id ?? 'readme', decrypted: false, decryptAttempts: 0 },
    terminal: { lines: [content.terminal.banner], input: '' },
    notes: '',
    recalls: [],
    recallQuery: '',

    inventory: [],
    ledger: content.economy.openingLedger.map((l) => ({
      id: l.id,
      date: l.date,
      label: l.label,
      amount: l.amount,
    })),
    domains: [],
    watchlist: [],

    wayup: {
      // Hidden. There is no icon in the dock and no announcement; the player finds a process
      // that should not be running.
      unlocked: false,
      observed: [],
      futureEvidence: [],
      mysteries: [],
      signalSpent: 0,
    },

    ui: { trayOpen: false, boardOpen: false, watched: false, dayCard: false },

    beats: {},
    flags: {},

    eventLog: [],
    createdAt: now,
    updatedAt: now,
  }
}
