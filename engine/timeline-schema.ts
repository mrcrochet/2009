import { z } from 'zod'
import { GAME_EVENT_TYPES } from './events'
import { SCHEMA_VERSION } from './types'

/**
 * A runtime shape for `TimelineState`.
 *
 * The engine's types vanish at compile time, so anything arriving from IndexedDB, from Postgres,
 * or from a client's `PUT /api/timelines/:id` was attacker-shaped and unchecked. This is the
 * boundary. It is deliberately strict about the numbers that mean something — money is integer
 * cents, coherence is 0–100, the day is a small positive integer — and permissive about the
 * text, which is the player's own.
 */

const cents = z.number().int().finite()
const minute = z
  .number()
  .int()
  .min(0)
  .max(24 * 60)

const AppId = z.enum(['mail', 'msg', 'web', 'files', 'bank', 'mkt', 'notes', 'term', 'recall'])
const ThreadId = z.enum(['unknown', 'marc', 'lea'])
const SourceKind = z.enum(['mail', 'bank', 'files', 'browser', 'phone', 'terminal', 'messenger'])

const WindowStateSchema = z.object({
  app: AppId,
  x: z.number().finite(),
  y: z.number().finite(),
  z: z.number().int(),
  minimized: z.boolean(),
  zoomed: z.boolean(),
})

const BrowserEntrySchema = z.object({
  view: z.enum(['home', 'results', 'page']),
  url: z.string().max(2048),
  query: z.string().max(2048),
  resultIds: z.array(z.string().max(128)).max(64),
})

const ChatLineSchema = z.object({
  who: z.string().max(64),
  text: z.string().max(4096),
  mine: z.boolean(),
  time: z.string().max(16),
})

const ClaimAttemptSchema = z.object({
  claimId: z.string().max(64),
  claimText: z.string().max(512),
  evidenceIds: z.array(z.string().max(64)).max(32),
  verdict: z.enum(['accepted', 'insufficient', 'refused']),
  message: z.string().max(2048),
  at: minute,
  onRecord: z.boolean(),
})

const RecallResultSchema = z.object({
  query: z.string().max(256),
  text: z.string().max(4096),
  confidence: z.enum(['HIGH', 'MEDIUM', 'LOW', 'FRACTURED', 'NONE']),
  memoryId: z.string().max(64).nullable(),
  cost: z.number().int().min(0).max(100),
  at: minute,
})

const BeatId = z.enum(['readme', 'marc', 'recall', 'money', 'claim'])

export const TimelineStateSchema = z.object({
  id: z.string().min(1).max(64),
  ownerId: z.string().max(64).nullable(),
  schemaVersion: z.number().int().min(1).max(SCHEMA_VERSION),
  seed: z.number().int(),

  stage: z.enum(['landing', 'boot', 'playing', 'day-end']),
  day: z.number().int().min(1).max(30),
  dateISO: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  minuteOfDay: minute,

  cashCents: cents,
  memoryIntegrity: z.number().int().min(0).max(100),
  heat: z.number().int().min(0),
  divergence: z.number().int().min(0),
  temporalShift: z.number().int().min(0),

  bootLine: z.number().int().min(0).max(64),

  windows: z.array(WindowStateSchema).max(16),
  nextZ: z.number().int(),
  desktopIcons: z.array(z.string().max(64)).max(32),
  phone: z.object({
    open: z.boolean(),
    tab: z.enum(['sms', 'photos', 'contacts']),
    x: z.number().finite().nullable(),
    y: z.number().finite().nullable(),
    smsStep: z.number().int().min(0).max(64),
  }),

  evidence: z
    .array(z.object({ id: z.string().max(64), discoveredBy: SourceKind, discoveredAt: minute }))
    .max(128),
  selectedEvidenceIds: z.array(z.string().max(64)).max(128),
  selectedClaimId: z.string().max(64).nullable(),
  lastVerdict: ClaimAttemptSchema.nullable(),
  claimLog: z.array(ClaimAttemptSchema).max(128),

  mail: z.object({
    openId: z.string().max(64),
    readIds: z.array(z.string().max(64)).max(128),
    unknownArrived: z.boolean(),
  }),
  chat: z.object({
    thread: ThreadId,
    log: z.record(ThreadId, z.array(ChatLineSchema).max(256)),
    step: z.record(ThreadId, z.number().int().min(0).max(64)),
    waiting: z.boolean(),
    pendingReply: z.string().max(4096).nullable(),
    pendingAdvance: z.boolean(),
  }),
  browser: BrowserEntrySchema.extend({
    history: z.array(BrowserEntrySchema).max(64),
    forward: z.array(BrowserEntrySchema).max(64),
  }),
  files: z.object({
    openId: z.string().max(64),
    decrypted: z.boolean(),
    decryptAttempts: z.number().int().min(0).max(64),
  }),
  terminal: z.object({
    lines: z
      .array(
        z.object({
          text: z.string().max(8192),
          tone: z.enum(['prompt', 'out', 'ok', 'err', 'dim']),
        }),
      )
      .max(512),
    input: z.string().max(2048),
  }),
  // The player's own writing. Capped because it is stored, not because it is suspect.
  notes: z.string().max(20_000),
  recalls: z.array(RecallResultSchema).max(128),
  recallQuery: z.string().max(256),

  inventory: z
    .array(
      z.object({
        id: z.string().max(64),
        label: z.string().max(256),
        acquiredFor: cents,
        state: z.enum(['held', 'listed', 'sold']),
        soldFor: cents.nullable(),
      }),
    )
    .max(64),
  ledger: z
    .array(
      z.object({
        id: z.string().max(64),
        date: z.string().max(32),
        label: z.string().max(256),
        amount: cents,
      }),
    )
    .max(256),
  domains: z.array(z.string().max(255)).max(64),
  watchlist: z.array(z.string().max(16)).max(32),

  ui: z.object({
    trayOpen: z.boolean(),
    boardOpen: z.boolean(),
    watched: z.boolean(),
    dayCard: z.boolean(),
  }),

  // A beat that has not fired is simply absent, so this is a partial record.
  beats: z.partialRecord(BeatId, z.boolean()),
  flags: z.record(z.string().max(64), z.boolean()),

  createdAt: z.string().max(64),
  updatedAt: z.string().max(64),
})

/** The snapshot as it is stored — the event log lives beside it. */
export const StoredSnapshotSchema = TimelineStateSchema

export const StoredTimelineSchema = z.object({
  id: z.string().min(1).max(64),
  ownerId: z.string().max(64).nullable(),
  schemaVersion: z.number().int().min(1).max(SCHEMA_VERSION),
  day: z.number().int().min(1).max(30),
  snapshot: StoredSnapshotSchema,
  // Payload shapes are the reducer's business, but the vocabulary is not open: an unrecognised
  // type is a forged or corrupt log, not a newer client.
  events: z
    .array(z.object({ type: z.enum(GAME_EVENT_TYPES), at: minute }).passthrough())
    .max(20_000),
  updatedAt: z.string().max(64),
  createdAt: z.string().max(64),
})

export type ValidatedStoredTimeline = z.infer<typeof StoredTimelineSchema>
