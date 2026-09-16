import type { CaseContent } from './case-schema'
import { clockString } from './clock'
import {
  cascadePosition,
  clampPhone,
  clampWindow,
  evaluateClaim,
  phoneDeviceId,
  photoAvailable,
  searchIndex,
} from './rules'
import { isShellCommand, promptFor, runShellCommand } from './machine/shell'
import { processFor, relayRunning } from './machine/processes'
import { buildFileSystem, nodeAt, normalise } from './machine/vfs'
import { findPage } from './pages'
import { normalizeUrl } from './url'
import { projectedId } from './world/project'
import {
  DEFAULT_VIEWPORT,
  type AppId,
  type BeatId,
  type BrowserEntry,
  type Claim,
  type GameEvent,
  type InvestigationState,
  type TerminalLine,
  type ThreadId,
  type Viewport,
} from './types'

/**
 * The single pure transition of an investigation. No timers, no I/O, no framework. All
 * scheduling lives in the React shell, which dispatches ordinary events when a timer fires — so
 * replaying the event log through `reduce` reproduces a snapshot exactly.
 */

/**
 * Ceilings the reducer enforces, matching `engine/timeline-schema.ts` exactly.
 *
 * Without these the game happily builds a timeline the runtime schema rejects — and because the
 * local IndexedDB path does not validate, the player finds out at the paywall, after the case has
 * done its job, when they try to keep the thing they just made. A limit is only real if the code
 * that grows the array is the code that knows about it.
 */
export const LIMITS = {
  terminalLines: 512,
  killed: 64,
  claimLog: 128,
  notes: 20_000,
  discovered: 4096,
  relayCaptures: 512,
  kept: 256,
  /** Matches the schema's cap on a results page, so a wide query cannot grow a save. */
  browserResults: 64,
} as const

// How much of the session each action costs.
const TICK: Partial<Record<GameEvent['type'], number>> = {
  EVIDENCE_PINNED: 1,
  CLAIM_ASSERTED: 6,
  CHAT_REPLY_SENT: 2,
  BROWSER_SEARCHED: 2,
  BROWSER_NAVIGATED: 1,
  TERMINAL_COMMAND_RUN: 1,
  DEVICE_UNLOCK_ATTEMPTED: 3,
  SMS_ADVANCED: 2,
  APP_OPENED: 0,
}

/**
 * What this transition put in front of the player, named the way the world graph names it.
 *
 * Discovery is derived here rather than dispatched by each screen, for two reasons. A component
 * that forgets to dispatch leaves an artifact permanently unfindable — the search would hold a
 * document the player has demonstrably read and refuse to admit it. And a discovery that only
 * happens because a React tree rendered is not in the event log, so a replay would produce a
 * different world from the one that was played.
 */
function revealed(
  next: InvestigationState,
  event: GameEvent,
  content: CaseContent,
): readonly string[] {
  const kase = content.id
  switch (event.type) {
    case 'MAIL_OPENED':
      return [projectedId.mail(kase, event.mailId)]

    case 'FILE_OPENED':
      return [projectedId.file(kase, event.fileId)]

    case 'PHOTO_SELECTED':
      return [projectedId.photo(kase, event.photoId)]

    // Held up long enough to read is read. The overlay shows the whole document, not a thumbnail.
    case 'QUICK_LOOK_OPENED':
      return [
        event.ref.kind === 'file'
          ? projectedId.file(kase, event.ref.id)
          : projectedId.photo(kase, event.ref.id),
      ]

    /**
     * Opening the viewer is opening a contact sheet: every frame on it has been seen, and the
     * ones off a source nobody has unlocked are not on it to be seen.
     */
    case 'APP_OPENED':
      if (event.app !== 'photos') return []
      return content.photos
        .filter((photo) => photoAvailable(photo, next.devices))
        .map((photo) => projectedId.photo(kase, photo.id))

    case 'BROWSER_NAVIGATED':
    case 'BROWSER_WENT_BACK':
    case 'BROWSER_WENT_FORWARD': {
      // A URL that resolves to nothing is a 404, not a document. Recording it would fill the
      // discovered set with addresses the graph has never heard of.
      const url = next.browser.url
      if (next.browser.view !== 'page') return []
      if (content.browser.pages.some((p) => p.url === url)) return [projectedId.web(kase, url)]
      // Not a page this case authored — the corpus keeps an internet of its own, and the shell
      // tells us which document was at the address.
      return event.type === 'BROWSER_NAVIGATED' && event.worldArtifactId
        ? [event.worldArtifactId]
        : []
    }

    case 'PHONE_TOGGLED':
    case 'MOBILE_OPENED':
    case 'MOBILE_NOTIFICATION_OPENED':
    case 'SMS_ADVANCED': {
      // A case may supply no phone at all, and then there is nothing to have looked at.
      const phone = content.phone
      if (!phone || !next.phone.open) return []
      // A handset nobody has opened shows a lock screen, and a lock screen is not a document.
      const handset = phoneDeviceId(content)
      if (handset && !next.devices[handset]?.unlocked) return []
      const here = next.phone.route.at(-1)?.app
      if (here === 'photos')
        // The roll on this handset, not every picture the case holds.
        return content.photos
          .filter((photo) => photo.sourceId !== null && photoAvailable(photo, next.devices))
          .map((photo) => projectedId.photo(kase, photo.id))
      if (here === 'messages')
        // Only as far down the thread as the player has actually scrolled.
        return phone.sms
          .slice(0, next.phone.smsStep + 1)
          .map((sms) => projectedId.sms(kase, sms.time))
      return []
    }

    default:
      return []
  }
}

export function reduce(
  state: InvestigationState,
  event: GameEvent,
  content: CaseContent,
): InvestigationState {
  const next = apply(state, event, content)
  if (next === state) return state

  const tick = TICK[event.type] ?? 0
  const minute = next.minute === state.minute ? state.minute + tick : next.minute

  const fresh = revealed(next, event, content).filter((id) => !next.discovered.includes(id))

  return {
    ...next,
    discovered:
      fresh.length === 0
        ? next.discovered
        : [...next.discovered, ...fresh].slice(-LIMITS.discovered),
    // A session cannot run past its own end. Without this the clock walks past the hour the
    // report is dated, and `REPORT_FILED` then moves it backwards.
    minute: Math.min(minute, content.sessionMinutes),
  }
}

/**
 * Replay. One case, one content module, so the log reduces against a single world — a resolver
 * was only ever there because thirty days each had their own.
 */
export function applyEvents(
  state: InvestigationState,
  events: readonly GameEvent[],
  content: CaseContent,
): InvestigationState {
  return events.reduce((acc, e) => reduce(acc, e, content), state)
}

// ---------------------------------------------------------------------------

function withBeat(state: InvestigationState, beat: BeatId | null | undefined): InvestigationState {
  if (!beat || state.beats[beat]) return state
  return { ...state, beats: { ...state.beats, [beat]: true } }
}

function appDef(content: CaseContent, app: AppId) {
  const def = content.apps.find((a) => a.id === app)
  if (!def) throw new Error(`reducer: unknown app "${app}"`)
  return def
}

/**
 * The application id the relay's window is registered under.
 *
 * The console used to be a focused mode with a boolean on `ui`. It is a window now, so the
 * terminal command that reveals it opens a window like anything else — and a case that ships a
 * relay has to declare the application, which `tests/unit/content.test.ts` enforces.
 */
export const RELAY_APP = 'relay'

function openWindow(
  state: InvestigationState,
  content: CaseContent,
  app: AppId,
  viewport?: Viewport,
): InvestigationState {
  const def = appDef(content, app)
  if (state.windows.some((w) => w.app === app)) return focusWindows(state, app)
  const measured: Viewport = viewport ?? DEFAULT_VIEWPORT
  const { x, y } = cascadePosition(state.windows.length, def.width, def.height, measured)
  const z = state.nextZ + 1
  return {
    ...state,
    nextZ: z,
    windows: [...state.windows, { app, x, y, z, minimized: false, zoomed: false }],
  }
}

function focusWindows(state: InvestigationState, app: AppId): InvestigationState {
  const z = state.nextZ + 1
  return {
    ...state,
    nextZ: z,
    windows: state.windows.map((w) => (w.app === app ? { ...w, z, minimized: false } : w)),
  }
}

function currentEntry(state: InvestigationState): BrowserEntry {
  return {
    view: state.browser.view,
    url: state.browser.url,
    query: state.browser.query,
    resultIds: state.browser.resultIds,
    resultUrls: state.browser.resultUrls,
  }
}

function pushHistory(state: InvestigationState): readonly BrowserEntry[] {
  const current = currentEntry(state)
  const last = state.browser.history[state.browser.history.length - 1]
  if (last && last.view === current.view && last.url === current.url) return state.browser.history
  return [...state.browser.history, current].slice(-40)
}

function pinEvidence(
  state: InvestigationState,
  evidenceId: string,
  via: InvestigationState['evidence'][number]['discoveredBy'],
  at: number,
  content: CaseContent,
): InvestigationState {
  /*
   * Evidence a forensic service would recover does not exist until it has been granted.
   *
   * Enforced here and not only in the surfaces, because "the button was not rendered" is not a
   * rule — it is a rendering. The grant itself is the server's; this is the engine agreeing with
   * it, so a save cannot be edited into holding something nobody recovered.
   */
  const gate = content.services.find((svc) => svc.grantsEvidenceIds.includes(evidenceId))
  if (gate && !state.services.includes(gate.id)) return state

  // Flat within a case. Ids were qualified by day because thirty days shared one namespace.
  if (state.evidence.some((e) => e.id === evidenceId)) return state
  return {
    ...state,
    evidence: [...state.evidence, { id: evidenceId, discoveredBy: via, discoveredAt: at }],
    ui: { ...state.ui, trayOpen: true },
  }
}

// ---------------------------------------------------------------------------

function apply(
  state: InvestigationState,
  event: GameEvent,
  content: CaseContent,
): InvestigationState {
  switch (event.type) {
    // --- stage -------------------------------------------------------------
    case 'CASE_OPENED':
      if (state.stage !== 'intake') return state
      return { ...state, stage: 'boot', bootLine: 0 }

    case 'BOOT_ADVANCED': {
      if (state.stage !== 'boot') return state
      return { ...state, bootLine: Math.min(state.bootLine + 1, content.boot.length) }
    }

    case 'BOOT_COMPLETED':
      if (state.stage === 'playing') return state
      return { ...state, stage: 'playing', bootLine: content.boot.length }

    case 'DESKTOP_ICON_APPEARED':
      if (state.desktopIcons.includes(event.iconId)) return state
      return { ...state, desktopIcons: [...state.desktopIcons, event.iconId] }

    // --- windows -----------------------------------------------------------
    case 'APP_OPENED':
      // Nothing opens the relay until the machine has admitted the process exists. The dock
      // hides it; this is what makes hiding it a rule rather than a decoration.
      // The route is an application backed by a daemon. Without the daemon there is no route,
      // whatever the session once knew — and a save cannot be edited past a process table.
      if (event.app === RELAY_APP && !relayRunning(state, content)) return state
      return openWindow(state, content, event.app, event.viewport)

    case 'APP_CLOSED': {
      if (!state.windows.some((w) => w.app === event.app)) return state
      return { ...state, windows: state.windows.filter((w) => w.app !== event.app) }
    }

    case 'APP_FOCUSED': {
      const w = state.windows.find((v) => v.app === event.app)
      if (!w) return state
      const isTop = state.windows.every((v) => v.z <= w.z)
      if (isTop && !w.minimized) return state
      return focusWindows(state, event.app)
    }

    case 'APP_MINIMIZED': {
      if (!state.windows.some((w) => w.app === event.app)) return state
      return {
        ...state,
        windows: state.windows.map((w) => (w.app === event.app ? { ...w, minimized: true } : w)),
      }
    }

    case 'APP_ZOOM_TOGGLED': {
      if (!state.windows.some((w) => w.app === event.app)) return state
      return {
        ...state,
        windows: state.windows.map((w) => (w.app === event.app ? { ...w, zoomed: !w.zoomed } : w)),
      }
    }

    case 'WINDOW_MOVED': {
      const w = state.windows.find((v) => v.app === event.app)
      if (!w) return state
      if (!Number.isFinite(event.x) || !Number.isFinite(event.y)) return state
      const def = appDef(content, event.app)
      const { x, y } = clampWindow(event.x, event.y, def.width, def.height, DEFAULT_VIEWPORT)
      if (w.x === x && w.y === y) return state
      return {
        ...state,
        windows: state.windows.map((v) => (v.app === event.app ? { ...v, x, y } : v)),
      }
    }

    // --- phone -------------------------------------------------------------
    case 'PHONE_TOGGLED':
      return { ...state, phone: { ...state.phone, open: !state.phone.open } }

    /**
     * Into an application, or into something inside one.
     *
     * The route is a stack rather than a current tab, because coming back out is most of what
     * makes a handset feel like a device. Opening the application you are already in is not a
     * second copy of it; opening a thing inside it pushes.
     */
    case 'MOBILE_OPENED': {
      if (!content.phone?.apps.some((a) => a.id === event.app)) return state
      const item = event.item ?? null
      const top = state.phone.route.at(-1)
      if (top?.app === event.app && top.item === item) return state
      const route =
        top?.app === event.app && item !== null
          ? [...state.phone.route, { app: event.app, item }]
          : [...state.phone.route.filter((r) => r.app !== event.app), { app: event.app, item }]
      return { ...state, phone: { ...state.phone, route: route.slice(-8) } }
    }

    case 'MOBILE_BACK': {
      if (state.phone.route.length === 0) return state
      return { ...state, phone: { ...state.phone, route: state.phone.route.slice(0, -1) } }
    }

    case 'MOBILE_HOME':
      if (state.phone.route.length === 0) return state
      return { ...state, phone: { ...state.phone, route: [] } }

    /**
     * An alert, read.
     *
     * Reading it is what removes it. A notification that survives being opened is the clearest
     * sign that a phone is a picture of a phone.
     */
    case 'MOBILE_NOTIFICATION_OPENED': {
      const alert = content.phone?.notifications.find((n) => n.id === event.notificationId)
      if (!alert) return state
      if (state.phone.readNotifications.includes(event.notificationId)) return state
      return {
        ...state,
        phone: {
          ...state.phone,
          readNotifications: [...state.phone.readNotifications, event.notificationId],
          route: [{ app: event.app, item: event.item ?? null }],
        },
      }
    }

    /**
     * The passcode, entered on the handset itself.
     *
     * It unlocks the same device the workstation's Devices application unlocks, because it is the
     * same device — a phone that opens on the desk and stays shut in the forensic tool is two
     * phones. The attempt counter is the handset's own: the case's copy talks about the device
     * not saying how many tries are left, and that only works if the device is counting.
     */
    case 'PHONE_PASSCODE_ATTEMPTED': {
      const device = content.devices.find((d) => d.id === event.deviceId)
      const live = state.devices[event.deviceId]
      if (!device || !live || live.unlocked || !live.connected) return state
      const right =
        device.unlockKey.length > 0 &&
        event.key.trim().toLowerCase() === device.unlockKey.trim().toLowerCase()
      if (!right) {
        return {
          ...state,
          phone: { ...state.phone, passcodeAttempts: state.phone.passcodeAttempts + 1 },
        }
      }
      const opened: InvestigationState = {
        ...state,
        phone: { ...state.phone, passcodeAttempts: 0 },
        devices: { ...state.devices, [event.deviceId]: { ...live, unlocked: true } },
        flags: device.setsFlag ? { ...state.flags, [device.setsFlag]: true } : state.flags,
      }
      return withBeat(opened, device.beat as BeatId | null)
    }

    case 'PHONE_MOVED': {
      if (!Number.isFinite(event.x) || !Number.isFinite(event.y)) return state
      const { x, y } = clampPhone(event.x, event.y, 296, 552, DEFAULT_VIEWPORT)
      if (state.phone.x === x && state.phone.y === y) return state
      return { ...state, phone: { ...state.phone, x, y } }
    }

    case 'SMS_ADVANCED': {
      // A case may supply no phone.
      const last = (content.phone?.sms.length ?? 0) - 1
      if (state.phone.smsStep >= last) return state
      return {
        ...state,
        phone: { ...state.phone, smsStep: Math.min(state.phone.smsStep + 1, last) },
      }
    }

    // --- mail --------------------------------------------------------------
    case 'MAIL_OPENED': {
      if (state.mail.openId === event.mailId && state.mail.readIds.includes(event.mailId))
        return state
      return {
        ...state,
        mail: {
          ...state.mail,
          openId: event.mailId,
          readIds: state.mail.readIds.includes(event.mailId)
            ? state.mail.readIds
            : [...state.mail.readIds, event.mailId],
        },
      }
    }

    case 'MAIL_UNKNOWN_ARRIVED':
      if (state.mail.unknownArrived) return state
      return {
        ...state,
        mail: { ...state.mail, unknownArrived: true },
        exposure: state.exposure + 5,
      }

    // --- messenger ---------------------------------------------------------
    case 'THREAD_SELECTED':
      if (state.chat.thread === event.thread) return state
      return { ...state, chat: { ...state.chat, thread: event.thread } }

    case 'CHAT_STARTED': {
      const thread = content.threads.find((t) => t.id === event.thread)
      if (!thread) return state
      if ((state.chat.log[event.thread]?.length ?? 0) > 0) return state
      const node = thread.script[0]
      if (!node) return state
      return {
        ...state,
        chat: {
          ...state.chat,
          log: {
            ...state.chat.log,
            [event.thread]: [
              { who: node.who, text: node.text, mine: false, time: clockAt(content, state.minute) },
            ],
          },
        },
      }
    }

    case 'CHAT_REPLY_SENT': {
      const thread = content.threads.find((t) => t.id === event.thread)
      if (!thread) return state
      const withLine: InvestigationState = {
        ...state,
        // A choice can reach out of the conversation and change the world.
        flags: event.setsFlag ? { ...state.flags, [event.setsFlag]: true } : state.flags,
        chat: {
          ...state.chat,
          waiting: { ...state.chat.waiting, [event.thread]: true },
          pendingReply: { ...state.chat.pendingReply, [event.thread]: event.reply || null },
          pendingAdvance: {
            ...state.chat.pendingAdvance,
            [event.thread]: event.advances !== false,
          },
          log: {
            ...state.chat.log,
            [event.thread]: [
              ...(state.chat.log[event.thread] ?? []),
              { who: 'you', text: event.text, mine: true, time: clockAt(content, state.minute) },
            ],
          },
        },
      }
      return withBeat(withLine, thread.beat as BeatId | null)
    }

    case 'CHAT_ADVANCED': {
      const thread = content.threads.find((t) => t.id === event.thread)
      if (!thread) return state
      const current = state.chat.step[event.thread] ?? 0
      const time = clockAt(content, state.minute)
      const speaker = thread.script[current]?.who ?? thread.label

      const log = [...(state.chat.log[event.thread] ?? [])]

      // First: the answer to what was actually asked, in this thread.
      const pendingReply = state.chat.pendingReply[event.thread]
      if (pendingReply) {
        log.push({ who: speaker, text: pendingReply, mine: false, time })
      }

      // Then the script moves on — which is how a person changes the subject. A choice marked
      // `advances: false` holds the conversation where it is, so the other option stays open.
      const advance = state.chat.pendingAdvance[event.thread] ?? true
      const step = advance ? current + 1 : current
      const node = advance ? thread.script[step] : undefined
      if (node) log.push({ who: node.who, text: node.text, mine: false, time })

      return {
        ...state,
        chat: {
          ...state.chat,
          waiting: { ...state.chat.waiting, [event.thread]: false },
          pendingReply: { ...state.chat.pendingReply, [event.thread]: null },
          pendingAdvance: { ...state.chat.pendingAdvance, [event.thread]: true },
          step: { ...state.chat.step, [event.thread]: Math.min(step, thread.script.length - 1) },
          log: { ...state.chat.log, [event.thread]: log },
        },
      }
    }

    // --- browser -----------------------------------------------------------
    case 'BROWSER_QUERY_CHANGED':
      return { ...state, browser: { ...state.browser, query: event.query } }

    case 'BROWSER_URL_CHANGED':
      return { ...state, browser: { ...state.browser, draftUrl: event.url } }

    case 'BROWSER_SEARCHED': {
      const query = event.query.trim()
      if (!query) return state
      const resultIds = searchIndex(content, query)
      return {
        ...state,
        browser: {
          view: 'results',
          url: `${content.browser.home}/search?q=${encodeURIComponent(query)}`,
          query,
          resultIds,
          // Addresses the corpus answered with, resolved by the shell — the engine holds no
          // world index and a pure reducer may not ask a question it cannot replay.
          resultUrls: (event.webUrls ?? []).slice(0, LIMITS.browserResults),
          draftUrl: null,
          history: pushHistory(state),
          forward: [],
        },
      }
    }

    case 'BROWSER_NAVIGATED': {
      const url = normalizeUrl(event.url)
      if (!url) return state
      const history = pushHistory(state)
      const page = findPage(content, url)
      return {
        ...state,
        browser: {
          view: !page && url === content.browser.home ? 'home' : 'page',
          url,
          query: state.browser.query,
          resultIds: state.browser.resultIds,
          resultUrls: state.browser.resultUrls,
          draftUrl: null,
          history,
          // Going somewhere new is what discards the forward stack, exactly as a
          // period browser did.
          forward: [],
        },
      }
    }

    case 'BROWSER_WENT_BACK': {
      const { history, forward } = state.browser
      const prev = history[history.length - 1]
      if (!prev) return state
      return {
        ...state,
        browser: {
          ...prev,
          draftUrl: null,
          history: history.slice(0, -1),
          forward: [currentEntry(state), ...forward].slice(0, 40),
        },
      }
    }

    case 'BROWSER_WENT_FORWARD': {
      const { history, forward } = state.browser
      const next = forward[0]
      if (!next) return state
      return {
        ...state,
        browser: {
          ...next,
          draftUrl: null,
          history: [...history, currentEntry(state)].slice(-40),
          forward: forward.slice(1),
        },
      }
    }

    // --- files -------------------------------------------------------------
    case 'FILE_OPENED': {
      const doc = content.files.find((f) => f.id === event.fileId)
      if (!doc) return state
      const opened: InvestigationState = {
        ...state,
        files: { ...state.files, openId: event.fileId },
      }
      return withBeat(opened, doc.beat as BeatId | null)
    }

    /**
     * Something stops running.
     *
     * The table is derived, so all that is recorded is the number and the minute — which is also
     * what lets a process come back later under a different one without anybody being told.
     */
    case 'PROCESS_KILLED': {
      const process = processFor(state, content, event.pid)
      if (!process || process.system) return state
      // Killing the route's daemon takes the window with it. Nothing else on the desk changes.
      const daemon = content.terminal.relay?.daemonPid
      const killed: InvestigationState = {
        ...state,
        windows:
          daemon && process.pid === daemon
            ? state.windows.filter((w) => w.app !== RELAY_APP)
            : state.windows,
        machine: {
          ...state.machine,
          killed: [...state.machine.killed, { pid: process.pid, at: event.at }].slice(
            -LIMITS.killed,
          ),
        },
        exposure: state.exposure + (process.onKill?.exposure ?? 0),
        flags: process.onKill?.setsFlag
          ? { ...state.flags, [process.onKill.setsFlag]: true }
          : state.flags,
      }
      return withBeat(killed, (process.onKill?.beat ?? null) as BeatId | null)
    }

    /**
     * The file manager moves to a directory.
     *
     * Checked against the tree rather than taken on trust: a path on a volume nobody has opened
     * is not a directory this machine has, and a save that claims the manager is standing inside
     * one is a save that has been edited.
     */
    case 'FILES_NAVIGATED': {
      const path = normalise(event.path)
      const node = nodeAt(buildFileSystem(state, content), path)
      if (!node || node.type === 'file' || node.locked) return state
      if (state.files.cwd === path) return state
      return { ...state, files: { ...state.files, cwd: path, openId: '' } }
    }

    /**
     * The viewer moves to a frame. A picture off a source this machine has not opened is not
     * selectable, for the same reason it is not on the grid.
     */
    case 'PHOTO_SELECTED': {
      const photo = content.photos.find((p) => p.id === event.photoId)
      if (!photo || !photoAvailable(photo, state.devices)) return state
      if (state.media.openPhotoId === event.photoId) return state
      return { ...state, media: { openPhotoId: event.photoId } }
    }

    /**
     * Quick Look. It refuses a reference to something this case does not hold, or to a picture
     * off a locked source — the overlay is a second way to read a document, never a way around
     * the rule about which documents exist.
     */
    case 'QUICK_LOOK_OPENED': {
      const { kind, id } = event.ref
      if (kind === 'file') {
        if (!content.files.some((f) => f.id === id)) return state
      } else {
        const photo = content.photos.find((p) => p.id === id)
        if (!photo || !photoAvailable(photo, state.devices)) return state
      }
      const held = state.ui.quickLook
      if (held && held.kind === kind && held.id === id) return state
      return { ...state, ui: { ...state.ui, quickLook: { kind, id } } }
    }

    case 'QUICK_LOOK_CLOSED':
      if (!state.ui.quickLook) return state
      return { ...state, ui: { ...state.ui, quickLook: null } }

    // --- terminal ----------------------------------------------------------
    case 'TERMINAL_INPUT_CHANGED':
      return { ...state, terminal: { ...state.terminal, input: event.value } }

    case 'TERMINAL_COMMAND_RUN':
      return runTerminal(state, event.command, event.at, content)

    // --- notes -------------------------------------------------------------
    case 'NOTES_CHANGED': {
      const notes = event.value.slice(0, LIMITS.notes)
      if (state.notes === notes) return state
      return { ...state, notes }
    }

    // --- investigation -----------------------------------------------------
    case 'EVIDENCE_PINNED':
      return pinEvidence(state, event.evidenceId, event.via, event.at, content)

    case 'EVIDENCE_SELECTION_TOGGLED': {
      const id = event.evidenceId
      const selected = state.selectedEvidenceIds.includes(id)
      return {
        ...state,
        selectedEvidenceIds: selected
          ? state.selectedEvidenceIds.filter((x) => x !== id)
          : [...state.selectedEvidenceIds, id],
      }
    }

    case 'CLAIM_SELECTED':
      return { ...state, selectedClaimId: event.claimId, lastVerdict: null }

    case 'CLAIM_ASSERTED': {
      const claim = content.claims.find((c) => c.id === event.claimId) as Claim | undefined
      if (!claim) return state
      // Only what the player actually holds counts. The tray offers nothing else, so in play
      // this changes nothing — but it is the difference between a save that can be edited into
      // an accepted claim and one that cannot.
      const held = new Set(state.evidence.map((e) => e.id))
      const selected = event.evidenceIds.filter((id) => held.has(id))
      const outcome = evaluateClaim(claim, selected)
      const attempt = {
        claimId: claim.id,
        claimText: claim.text,
        evidenceIds: selected,
        verdict: outcome.verdict,
        message: outcome.message,
        at: event.at,
        onRecord: outcome.onRecord,
      }
      const withClaim: InvestigationState = {
        ...state,
        lastVerdict: attempt,
        claimLog: outcome.onRecord
          ? [...state.claimLog, attempt].slice(-LIMITS.claimLog)
          : state.claimLog,
        exposure: outcome.onRecord ? state.exposure + 10 : state.exposure,
      }
      return withBeat(withClaim, 'claim')
    }

    case 'TRAY_TOGGLED': {
      const open = event.open ?? !state.ui.trayOpen
      if (open === state.ui.trayOpen) return state
      return { ...state, ui: { ...state.ui, trayOpen: open } }
    }

    case 'BOARD_TOGGLED': {
      const open = event.open ?? !state.ui.boardOpen
      if (open === state.ui.boardOpen) return state
      return { ...state, ui: { ...state.ui, boardOpen: open } }
    }

    // --- devices -----------------------------------------------------------
    /**
     * A device the client hands over mid-case. Connecting is not opening it: a locked phone on
     * the desk is a fact about the case, and a reason to go and find what opens it.
     */
    case 'DEVICE_CONNECTED': {
      const device = content.devices.find((d) => d.id === event.deviceId)
      if (!device) return state
      const held = state.devices[event.deviceId]
      if (held?.connected) return state
      return {
        ...state,
        devices: {
          ...state.devices,
          [event.deviceId]: {
            id: event.deviceId,
            connected: true,
            unlocked: held?.unlocked ?? device.unlocked,
          },
        },
      }
    }

    case 'DEVICE_UNLOCK_ATTEMPTED': {
      const device = content.devices.find((d) => d.id === event.deviceId)
      if (!device) return state
      const held = state.devices[event.deviceId]
      // Nothing is unlocked that is not on the desk.
      if (!held?.connected) return state
      if (held.unlocked) return state
      // A wrong key costs the attempt and nothing else. The device stays shut.
      const expected = device.unlockKey.trim().toLowerCase()
      if (expected && event.key.trim().toLowerCase() !== expected) return state
      const opened: InvestigationState = {
        ...state,
        devices: { ...state.devices, [event.deviceId]: { ...held, unlocked: true } },
        // Getting into somebody's device is the loudest ordinary thing an investigator does.
        exposure: state.exposure + 5,
        flags: device.setsFlag ? { ...state.flags, [device.setsFlag]: true } : state.flags,
      }
      return withBeat(opened, device.beat as BeatId | null)
    }

    // --- forensic services -------------------------------------------------
    /**
     * Recorded, never performed.
     *
     * The entitlement was granted on the server and the content behind it is served, not
     * unlocked here. What this writes down is that the player could see it, so a replay shows
     * the investigation they actually ran.
     */
    case 'SERVICE_GRANTED': {
      if (!content.services.some((svc) => svc.id === event.serviceId)) return state
      if (state.services.includes(event.serviceId)) return state
      return { ...state, services: [...state.services, event.serviceId] }
    }

    // --- the report --------------------------------------------------------
    case 'REPORT_FILED': {
      if (state.stage === 'report') return state
      return {
        ...state,
        stage: 'report',
        minute: content.sessionMinutes,
        windows: [],
        phone: { ...state.phone, open: false },
        ui: {
          trayOpen: false,
          boardOpen: false,
          watched: true,
          reportCard: false,
          quickLook: null,
        },
        mail: { ...state.mail, unknownArrived: true, openId: content.unknownMail.id },
      }
    }

    case 'REPORT_CARD_SHOWN':
      if (state.ui.reportCard) return state
      return { ...state, ui: { ...state.ui, reportCard: true } }

    // --- the relay ---------------------------------------------------------
    case 'RELAY_UNLOCKED': {
      if (state.relay.unlocked) return state
      return { ...state, relay: { ...state.relay, unlocked: true } }
    }

    /**
     * The network happened outside the engine. What lands here is the id of an immutable
     * snapshot and what the look cost, so a replay shows the bytes the player read rather than
     * whatever the site says today.
     */
    case 'RELAY_SNAPSHOT_OBSERVED': {
      if (!state.relay.unlocked) return state
      const seen = state.relay.captures.some((c) => c.snapshotId === event.snapshotId)
      // The budget is the mechanic. Without this the cost is a number the console prints and
      // the player can ignore, and a metered look at the future is not metered at all.
      const budget = content.relay?.signalBudget ?? 0
      if (!seen && state.relay.signalSpent + event.signalCost > budget) return state
      return {
        ...state,
        relay: {
          ...state.relay,
          captures: seen
            ? state.relay.captures
            : [
                ...state.relay.captures,
                {
                  snapshotId: event.snapshotId,
                  url: event.url,
                  title: event.title,
                  cost: event.signalCost,
                  at: event.at,
                },
              ].slice(-LIMITS.relayCaptures),
          // A page already read costs nothing to read again. The cost is in reaching for it.
          signalSpent: seen ? state.relay.signalSpent : state.relay.signalSpent + event.signalCost,
        },
      }
    }

    case 'RELAY_SEARCHED': {
      if (!state.relay.unlocked) return state
      const budget = content.relay?.signalBudget ?? 0
      if (state.relay.signalSpent + event.signalCost > budget) return state
      if (event.signalCost === 0) return state
      return {
        ...state,
        relay: { ...state.relay, signalSpent: state.relay.signalSpent + event.signalCost },
      }
    }

    case 'RELAY_EXCERPT_KEPT': {
      if (!state.relay.captures.some((c) => c.snapshotId === event.snapshotId)) return state
      if (state.relay.kept.some((e) => e.excerptHash === event.excerptHash)) return state
      /*
       * Keeping a line is not free, and it is not free in the currency signal is.
       *
       * Signal buys the looking. This is the carrying: reaching outside the case file and
       * bringing something back is a thing somebody can notice. The number is the case's.
       */
      return {
        ...state,
        exposure: state.exposure + (content.relay?.keepExposure ?? 0),
        relay: {
          ...state.relay,
          kept: [
            ...state.relay.kept,
            {
              id: event.id,
              snapshotId: event.snapshotId,
              excerpt: event.excerpt,
              excerptHash: event.excerptHash,
              sourceUrl: event.sourceUrl,
              sourceTitle: event.sourceTitle,
              capturedAt: event.at,
            },
          ].slice(-LIMITS.kept),
        },
        ui: { ...state.ui, trayOpen: true },
      }
    }

    case 'WORLD_ARTIFACTS_SEEN': {
      const fresh = event.artifactIds.filter((id) => !state.discovered.includes(id))
      if (fresh.length === 0) return state
      return { ...state, discovered: [...state.discovered, ...fresh].slice(-LIMITS.discovered) }
    }

    case 'MYSTERY_OPENED': {
      if (state.relay.mysteries.includes(event.mysteryId)) return state
      return {
        ...state,
        relay: { ...state.relay, mysteries: [...state.relay.mysteries, event.mysteryId] },
        flags: event.setsFlags.reduce(
          (flags, flag) => ({ ...flags, [flag]: true }),
          state.flags as Record<string, boolean>,
        ),
      }
    }

    case 'INVESTIGATION_CLAIMED':
      if (state.ownerId === event.ownerId) return state
      return { ...state, ownerId: event.ownerId }

    default: {
      // Compile-time exhaustiveness without the runtime hazard: an event type this build does
      // not know — from a forged upload or a save written by a newer client — leaves the
      // timeline exactly as it was.
      assertNever(event)
      return state
    }
  }
}

// ---------------------------------------------------------------------------

function assertNever(_event: never): void {
  /* the type checker does the work; this exists so the runtime does not */
}

/** Wall time, from minutes into the session plus the hour the case started at. */
function clockAt(content: CaseContent, minute: number): string {
  return clockString(content.startMinute + minute)
}

function runTerminal(
  state: InvestigationState,
  rawCommand: string,
  at: number,
  content: CaseContent,
): InvestigationState {
  const cfg = content.terminal
  const command = rawCommand.trim()
  const lower = command.toLowerCase()
  const out: TerminalLine[] = [
    { text: `${promptFor(content, state.machine.cwd)} ${command}`, tone: 'prompt' },
  ]

  let nextState: InvestigationState = { ...state, terminal: { ...state.terminal, input: '' } }

  if (!command) {
    return { ...nextState, terminal: { lines: [...state.terminal.lines, ...out], input: '' } }
  }

  if (lower.split(/\s+/)[0] === 'clear') {
    return { ...nextState, terminal: { lines: [content.terminal.banner], input: '' } }
  }

  // Match on the first token, so `ls -l` is a listing rather than "command not found" — a
  // whole-line match reads as a bug, not as a period detail.
  const verb = lower.split(/\s+/)[0] ?? ''
  const staticOut = cfg.statics[verb]

  /*
   * The shell reads the machine first.
   *
   * Before this, `ls` was a paragraph in the case file and `cat` was a lookup table of three
   * filenames, so the terminal and the file manager were two accounts of a disk that never had
   * to agree. They go through one tree now, which is also why these win over a case's static of
   * the same name: a case may still author `help` or `ps`, but it may not author a listing that
   * contradicts the volume it mounted.
   */
  if (isShellCommand(verb)) {
    // Case matters in a path. Split the raw command, not the lowered one.
    const argv = command.split(/\s+/)
    const result = runShellCommand(
      buildFileSystem(state, content),
      state,
      [verb, ...argv.slice(1)],
      content,
    )
    out.push(...result.lines)
    if (result.cwd !== null) {
      nextState = { ...nextState, machine: { ...nextState.machine, cwd: result.cwd } }
    }
    // Opening it here is opening it. The document lands in the reader, and the world graph
    // records that this investigator has read it — whichever window they read it through.
    if (result.opened) {
      nextState = reduce(nextState, { type: 'FILE_OPENED', fileId: result.opened, at }, content)
    }
    if (result.openedPhoto) {
      nextState = reduce(
        nextState,
        { type: 'PHOTO_SELECTED', photoId: result.openedPhoto, at },
        content,
      )
    }
    if (result.killed !== null) {
      nextState = reduce(nextState, { type: 'PROCESS_KILLED', pid: result.killed, at }, content)
      // The consequence speaks after the command, the way a machine reports a thing it noticed
      // rather than a thing it did.
      const process = content.terminal.processes.find(
        (row) => row.pid === result.killed || row.respawnPid === result.killed,
      )
      if (process?.onKill) out.push(...process.onKill.lines)
    }
    return {
      ...nextState,
      terminal: {
        lines: [...state.terminal.lines, ...out].slice(-LIMITS.terminalLines),
        input: '',
      },
    }
  }

  if (verb === 'whoami') {
    out.push(...cfg.whoami)
    const contradiction = cfg.whoamiAfterEvidence
    if (state.evidence.some((e) => e.id === contradiction.evidenceId)) {
      out.push(...contradiction.lines)
    }
  } else if (staticOut) {
    out.push(...staticOut)
  } else if (verb === 'date') {
    out.push({
      text: cfg.dateTemplate.replace('{{clock}}', clockAt(content, state.minute)),
      tone: 'out',
    })
  } else if (cfg.relay && verb === cfg.relay.command) {
    const relay = cfg.relay
    // A route whose daemon the player ended does not reopen by asking again. The command says
    // so rather than quietly starting it: what they did was deliberate, and it stands.
    if (state.relay.unlocked && !relayRunning(state, content)) {
      out.push(...relay.killed)
    } else if (state.relay.unlocked) {
      out.push(...relay.opened)
      nextState = openWindow(nextState, content, RELAY_APP)
    } else if (lower.includes(relay.unlockPhrase.toLowerCase())) {
      // The player worked out the argument from three pages that never mention each other.
      // Nothing announces it; the machine simply stops refusing.
      out.push(...relay.granted)
      nextState = openWindow(
        { ...nextState, relay: { ...nextState.relay, unlocked: true } },
        content,
        RELAY_APP,
      )
    } else {
      out.push(...relay.locked)
    }
  } else if (verb === 'decrypt') {
    const d = cfg.decrypt
    const attemptsSoFar = state.files.decryptAttempts[d.fileId] ?? 0
    if (state.files.decrypted[d.fileId]) {
      out.push({ text: d.success, tone: 'ok' })
      // Running it again on a file already open still hands over the evidence. Otherwise a
      // player who decrypted last night is told it worked and given nothing to pin.
      nextState = pinEvidence(nextState, d.evidenceId, 'terminal', at, content)
    } else if (attemptsSoFar >= d.maxAttempts) {
      // The lockout said "the file has reported". It has to mean it — otherwise the fourth
      // attempt with the right key simply works, and heat accrues without limit.
      out.push({ text: d.lockout, tone: 'err' })
    } else if (lower.includes(d.key)) {
      out.push({ text: d.success, tone: 'ok' })
      nextState = {
        ...nextState,
        files: {
          ...nextState.files,
          decrypted: { ...nextState.files.decrypted, [d.fileId]: true },
          openId: d.fileId,
        },
        exposure: nextState.exposure + 5,
      }
      nextState = pinEvidence(nextState, d.evidenceId, 'terminal', at, content)
    } else if (lower.includes('--key')) {
      const attempts = attemptsSoFar + 1
      const counted = { ...nextState.files.decryptAttempts, [d.fileId]: attempts }
      const remaining = Math.max(0, d.maxAttempts - attempts)
      if (remaining <= 0) {
        out.push({ text: d.lockout, tone: 'err' })
        nextState = {
          ...nextState,
          files: { ...nextState.files, decryptAttempts: counted },
          exposure: nextState.exposure + 20,
          flags: { ...nextState.flags, decryptReported: true },
        }
      } else {
        out.push({ text: d.wrongKey.replace('{{remaining}}', String(remaining)), tone: 'err' })
        nextState = {
          ...nextState,
          files: { ...nextState.files, decryptAttempts: counted },
          exposure: nextState.exposure + 5,
        }
      }
    } else {
      out.push({ text: d.usage, tone: 'dim' })
    }
  } else {
    out.push({
      text: cfg.notFound.replace('{{command}}', command.split(' ')[0] ?? command),
      tone: 'err',
    })
  }

  return {
    ...nextState,
    terminal: {
      lines: [...state.terminal.lines, ...out].slice(-LIMITS.terminalLines),
      input: '',
    },
  }
}

export type { ThreadId }
