import type { CaseContent } from './case-schema'
import { hashSeed } from './seed'
import { projectedId } from './world/project'
import {
  SCHEMA_VERSION,
  type ChatLine,
  type DeviceState,
  type InvestigationState,
  type Stage,
} from './types'

export interface CreateInvestigationOptions {
  readonly id: string
  readonly ownerId?: string | null
  readonly stage?: Stage
  readonly now?: string
  /**
   * Services already granted to this investigator, read from the server.
   *
   * Passed in rather than looked up, because the engine may not reach the network and a pure
   * function may not ask a question it cannot replay. An empty list is the honest default: the
   * case is completable from it.
   */
  readonly services?: readonly string[]
}

export function createInvestigation(
  content: CaseContent,
  opts: CreateInvestigationOptions,
): InvestigationState {
  const now = opts.now ?? new Date(0).toISOString()
  const threadIds = content.threads.map((t) => t.id)
  const byThread = <T>(value: T): Record<string, T> =>
    Object.fromEntries(threadIds.map((id) => [id, value]))

  // What the case put on the desk before the investigator sat down.
  const devices: Record<string, DeviceState> = Object.fromEntries(
    content.devices.map((device) => [
      device.id,
      { id: device.id, connected: device.connected, unlocked: device.unlocked },
    ]),
  )

  return {
    id: opts.id,
    ownerId: opts.ownerId ?? null,
    schemaVersion: SCHEMA_VERSION,
    seed: hashSeed(opts.id),

    stage: opts.stage ?? 'intake',
    caseId: content.id,
    dateISO: content.dateISO,
    minute: 0,

    exposure: 0,

    // The workstation opens with a message already on screen and a file already on the desktop.
    // They have been read whether or not the player ever clicks anything, so the world has to
    // know that.
    discovered: [
      ...(content.mail[0] ? [projectedId.mail(content.id, content.mail[0].id)] : []),
      ...(content.files[0] ? [projectedId.file(content.id, content.files[0].id)] : []),
    ],
    evidence: [],
    claimLog: [],
    notes: '',
    flags: {},
    devices,
    services: opts.services ?? [],

    relay: {
      unlocked: content.relay?.availableAtStart ?? false,
      captures: [],
      kept: [],
      mysteries: [],
      signalSpent: 0,
    },

    bootLine: 0,

    windows: [],
    nextZ: 20,
    desktopIcons: [],
    phone: { open: false, tab: 'sms', x: null, y: null, smsStep: 0 },

    selectedEvidenceIds: [],
    selectedClaimId: null,
    lastVerdict: null,

    mail: {
      openId: content.mail[0]?.id ?? '',
      readIds: content.mail[0] ? [content.mail[0].id] : [],
      unknownArrived: false,
    },
    chat: {
      // Whatever the case calls its correspondents, not a hard-coded trio.
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
      resultUrls: [],
      draftUrl: null,
      history: [],
      forward: [],
    },
    files: { openId: content.files[0]?.id ?? '', decrypted: {}, decryptAttempts: {} },
    media: { openPhotoId: content.photos[0]?.id ?? '' },
    terminal: { lines: [content.terminal.banner], input: '' },

    ui: {
      trayOpen: false,
      boardOpen: false,
      watched: false,
      reportCard: false,
      quickLook: null,
    },

    beats: {},

    eventLog: [],
    createdAt: now,
    updatedAt: now,
  }
}
