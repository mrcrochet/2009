import { z } from 'zod'
import { GAME_EVENT_TYPES } from './events'
import { SCHEMA_VERSION } from './types'

/**
 * A runtime shape for `InvestigationState`.
 *
 * The engine's types vanish at compile time, so anything arriving from IndexedDB, from Postgres,
 * or from a client's `PUT` was attacker-shaped and unchecked. This is the boundary. It is
 * deliberately strict about the values that mean something and permissive about the text, which
 * is the player's own.
 */

const minute = z
  .number()
  .int()
  .min(0)
  .max(24 * 60)

/**
 * Open, because a case registers its own applications.
 *
 * It was an enum of ten app ids, which would now reject a save from any case that shipped an
 * application this build's enum had never heard of — that is, from every case after the first.
 * The reducer already refuses an app the loaded case did not declare, which is the check that
 * can actually be made here.
 */
const AppId = z.string().min(1).max(64)
const ThreadId = z.string().min(1).max(64)
const SourceKind = z.enum([
  'mail',
  'files',
  'browser',
  'phone',
  'terminal',
  'messenger',
  'device',
])

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

export const InvestigationStateSchema = z.object({
  id: z.string().min(1).max(64),
  ownerId: z.string().max(64).nullable(),
  schemaVersion: z.number().int().min(1).max(SCHEMA_VERSION),
  seed: z.number().int(),

  stage: z.enum(['intake', 'boot', 'playing', 'report']),
  caseId: z.string().min(1).max(64),
  dateISO: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  minute,

  exposure: z.number().int().min(0),

  bootLine: z.number().int().min(0).max(64),

  windows: z.array(WindowStateSchema).max(16),
  nextZ: z.number().int(),
  desktopIcons: z.array(z.string().max(64)).max(32),
  devices: z.record(
    z.string().max(64),
    z.object({
      id: z.string().max(64),
      connected: z.boolean(),
      unlocked: z.boolean(),
    }),
  ),
  phone: z.object({
    open: z.boolean(),
    tab: z.enum(['sms', 'photos', 'contacts']),
    x: z.number().finite().nullable(),
    y: z.number().finite().nullable(),
    smsStep: z.number().int().min(0).max(64),
  }),

  /**
   * Services granted to this investigation.
   *
   * Accepted from a save because it is a projection, not a grant. A forged list buys nothing:
   * the entitlement is checked server-side and the content behind it is served, not unlocked
   * here.
   */
  services: z.array(z.string().max(128)).max(64),

  discovered: z.array(z.string().max(128)).max(4096),
  evidence: z
    .array(
      z.object({
        id: z.string().max(64),
        discoveredBy: SourceKind,
        discoveredAt: minute,
      }),
    )
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
    waiting: z.record(ThreadId, z.boolean()),
    pendingReply: z.record(ThreadId, z.string().max(4096).nullable()),
    pendingAdvance: z.record(ThreadId, z.boolean()),
  }),
  browser: BrowserEntrySchema.extend({
    draftUrl: z.string().max(2048).nullable(),
    history: z.array(BrowserEntrySchema).max(64),
    forward: z.array(BrowserEntrySchema).max(64),
  }),
  files: z.object({
    openId: z.string().max(64),
    decrypted: z.record(z.string().max(64), z.boolean()),
    decryptAttempts: z.record(z.string().max(64), z.number().int().min(0).max(64)),
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

  wayup: z.object({
    unlocked: z.boolean(),
    observed: z.array(z.string().max(128)).max(512),
    kept: z
      .array(
        z.object({
          id: z.string().max(64),
          snapshotId: z.string().max(128),
          excerpt: z.string().max(4096),
          excerptHash: z.string().length(64),
          sourceUrl: z.string().max(2048).default(''),
          sourceTitle: z.string().max(300).default(''),
          capturedAt: minute,
        }),
      )
      .max(256),
    mysteries: z.array(z.string().max(64)).max(256),
    signalSpent: z.number().int().min(0).max(10_000),
  }),

  ui: z.object({
    trayOpen: z.boolean(),
    boardOpen: z.boolean(),
    wayupOpen: z.boolean().default(false),
    watched: z.boolean(),
    reportCard: z.boolean(),
  }),

  // A beat that has not fired is simply absent, and a case names its own.
  beats: z.record(z.string().max(64), z.boolean()),
  flags: z.record(z.string().max(64), z.boolean()),

  createdAt: z.string().max(64),
  updatedAt: z.string().max(64),
})

/** The snapshot as it is stored — the event log lives beside it. */
export const StoredSnapshotSchema = InvestigationStateSchema

export const StoredInvestigationSchema = z.object({
  id: z.string().min(1).max(64),
  ownerId: z.string().max(64).nullable(),
  schemaVersion: z.number().int().min(1).max(SCHEMA_VERSION),
  caseId: z.string().min(1).max(64),
  snapshot: StoredSnapshotSchema,
  // Payload shapes are the reducer's business, but the vocabulary is not open: an unrecognised
  // type is a forged or corrupt log, not a newer client.
  events: z
    .array(z.object({ type: z.enum(GAME_EVENT_TYPES), at: minute }).passthrough())
    .max(20_000),
  updatedAt: z.string().max(64),
  createdAt: z.string().max(64),
})

export type ValidatedStoredInvestigation = z.infer<typeof StoredInvestigationSchema>
