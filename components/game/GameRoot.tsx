'use client'

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import type { CaseContent } from '@/engine/case-schema'
import { createInvestigation } from '@/engine/initial-state'
import type { GameEvent, ThreadId, InvestigationState } from '@/engine/types'
import type { WorldIndex } from '@/engine/world'
import { selectCanFileReport, selectReportSummary } from '@/engine/selectors'
import { track } from '@/lib/analytics'
import { createAutosave, loadInvestigation } from '@/lib/persistence/local-store'
import { createGameStore, type GameStoreApi } from '@/state/store'
import { BootSequence } from './BootSequence'
import { GameErrorBoundary } from './GameErrorBoundary'
import { GameProvider } from './GameContext'
import { Workstation } from './Workstation'
import { prefetchApp } from './WindowManager'
import { WorldGate } from './WorldContext'
import { useAudioUnlock, playEventCue } from './useGameSound'
import { useDesktopKeys } from './useDesktopKeys'
import { pace, useReducedMotion } from './useReducedMotion'
import '@/styles/nova.css'

interface Props {
  readonly content: CaseContent
  readonly investigationId: string
  /** `new` starts at the boot console — the player already opened the case. */
  readonly mode: 'new' | 'resume'
  /**
   * The world graph. Optional so a test can mount a case without one; when it is absent the
   * search and the directory simply are not on this machine, rather than being broken on it.
   */
  readonly world?: WorldIndex
}

/**
 * Owns everything the pure engine deliberately does not: timers, persistence, viewport and
 * analytics. Every scheduled beat dispatches an ordinary event, so the log stays replayable.
 */
export function GameRoot({ content, investigationId, mode, world }: Props) {
  const [api] = useState<GameStoreApi>(() =>
    createGameStore({
      content,
      investigation: createInvestigation(content, {
        id: investigationId,
        now: new Date().toISOString(),
      }),
      onEvent: (event, next, prev) => {
        trackEvent(event, next, content)
        playEventCue(event, next, prev)
      },
    }),
  )
  const [ready, setReady] = useState(mode === 'new')
  const autosave = useMemo(() => createAutosave(600), [])
  const bootStartedAt = useRef<number>(0)
  const reducedMotion = useReducedMotion()

  useAudioUnlock()
  useDesktopKeys(api)

  // --- hydrate -------------------------------------------------------------
  useEffect(() => {
    let cancelled = false
    if (mode === 'new') {
      api.getState().dispatch({ type: 'CASE_OPENED' })
      bootStartedAt.current = Date.now()
      return
    }
    void loadInvestigation(investigationId).then((saved) => {
      if (cancelled) return
      if (!saved) {
        api.getState().dispatch({ type: 'CASE_OPENED' })
        setReady(true)
        return
      }
      api.getState().hydrate(saved)
      setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [api, mode, investigationId])

  // --- viewport ------------------------------------------------------------
  useEffect(() => {
    const measure = () =>
      api.getState().setViewport({ width: window.innerWidth, height: window.innerHeight })
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [api])

  // --- autosave ------------------------------------------------------------
  useEffect(() => {
    const unsub = api.subscribe((s, prev) => {
      if (s.investigation === prev.investigation) return
      autosave.schedule(s.investigation)
    })
    return () => {
      unsub()
      void autosave.flush()
      autosave.dispose()
    }
  }, [api, autosave])

  // --- boot ticker ---------------------------------------------------------
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null
    let hold: ReturnType<typeof setTimeout> | null = null

    const unsub = api.subscribe((s, prev) => {
      if (s.investigation.stage === 'boot' && prev.investigation.stage !== 'boot') startBoot()
    })
    if (api.getState().investigation.stage === 'boot') startBoot()

    function startBoot() {
      if (interval) return
      bootStartedAt.current = Date.now()
      // Dispatch opens itself the moment the desktop settles; fetch it while the console runs.
      prefetchApp('msg')
      prefetchApp('files')
      interval = setInterval(
        () => {
          const state = api.getState()
          if (state.investigation.bootLine >= content.boot.length) {
            if (interval) clearInterval(interval)
            interval = null
            hold = setTimeout(
              () => {
                api.getState().dispatch({ type: 'BOOT_COMPLETED' })
                track('boot_completed', { durationMs: Date.now() - bootStartedAt.current })
              },
              pace(content.bootHoldMs, reducedMotion),
            )
            return
          }
          state.dispatch({ type: 'BOOT_ADVANCED' })
        },
        pace(content.bootIntervalMs, reducedMotion),
      )
    }

    return () => {
      unsub()
      if (interval) clearInterval(interval)
      if (hold) clearTimeout(hold)
    }
  }, [api, content, reducedMotion])

  // --- opening beats -------------------------------------------------------
  useEffect(() => {
    let msg: ReturnType<typeof setTimeout> | null = null
    let icon: ReturnType<typeof setTimeout> | null = null

    const schedule = () => {
      if (msg) return
      msg = setTimeout(
        () => {
          const { dispatch } = api.getState()
          dispatch({ type: 'APP_OPENED', app: 'msg', viewport: measure() })
          dispatch({ type: 'THREAD_SELECTED', thread: 'unknown' })
          dispatch({ type: 'CHAT_STARTED', thread: 'unknown' })
          track('first_message_seen', {})
        },
        pace(content.messengerOpensAtMs, reducedMotion),
      )
      icon = setTimeout(
        () => {
          api.getState()
            .dispatch({ type: 'DESKTOP_ICON_APPEARED', iconId: content.desktopIconFileId })
        },
        pace(content.desktopIconAtMs, reducedMotion),
      )
    }

    const unsub = api.subscribe((s, prev) => {
      if (s.investigation.stage === 'playing' && prev.investigation.stage === 'boot') schedule()
    })
    return () => {
      unsub()
      if (msg) clearTimeout(msg)
      if (icon) clearTimeout(icon)
    }
  }, [api, content, reducedMotion])

  // --- messenger reply delay ----------------------------------------------
  useEffect(() => {
    const timers = new Set<ReturnType<typeof setTimeout>>()
    const unsub = api.subscribe((s, prev) => {
      // Per thread, because two people can be mid-reply at once — and one starting must not
      // cancel the other's timer, or put its answer in the wrong person's mouth.
      for (const thread of Object.keys(s.investigation.chat.waiting) as ThreadId[]) {
        if (!s.investigation.chat.waiting[thread] || prev.investigation.chat.waiting[thread]) continue
        const timer = setTimeout(
          () => {
            api.getState().dispatch({ type: 'CHAT_ADVANCED', thread })
          },
          pace(content.chatReplyDelayMs, reducedMotion),
        )
        timers.add(timer)
      }
    })
    return () => {
      unsub()
      for (const timer of timers) clearTimeout(timer)
    }
  }, [api, content, reducedMotion])

  // --- the report gate -----------------------------------------------------
  useEffect(() => {
    let fired = false
    const unsub = api.subscribe((s) => {
      if (fired) return
      if (!selectCanFileReport(s.investigation, content)) return
      fired = true
      track('case_requirements_completed', { minute: s.investigation.minute })
    })
    return unsub
  }, [api, content])

  // --- filing the report ---------------------------------------------------
  const fileReport = useCallback(() => {
    const { dispatch, investigation } = api.getState()
    if (investigation.stage === 'report') return
    dispatch({ type: 'REPORT_FILED' })
    const summary = selectReportSummary(api.getState().investigation, content)
    track('case_completed', {
      evidenceCount: summary.evidenceCount,
      claimsOnRecord: summary.claimCount,
      exposure: summary.exposure,
      changed: summary.changed,
    })
    setTimeout(
      () => api.getState().dispatch({ type: 'REPORT_CARD_SHOWN' }),
      pace(content.report.surveillanceDelayMs, reducedMotion),
    )
  }, [api, content, reducedMotion])

  const stage = useStage(api)

  if (!ready) return <div className="nova-boot" aria-busy="true" />

  return (
    <GameProvider value={api}>
      <GameErrorBoundary onReset={() => api.getState().dispatch({ type: 'BOOT_COMPLETED' })}>
        <div className="nova-root">
          {stage === 'boot' ? (
            <BootSequence />
          ) : world ? (
            <WorldGate index={world}>
              <Workstation onFileReport={fileReport} />
            </WorldGate>
          ) : (
            <Workstation onFileReport={fileReport} />
          )}
        </div>
      </GameErrorBoundary>
    </GameProvider>
  )
}

function useStage(api: GameStoreApi): InvestigationState['stage'] {
  const read = useCallback(() => api.getState().investigation.stage, [api])
  return useSyncExternalStore(api.subscribe, read, read)
}

function measure() {
  if (typeof window === 'undefined') return undefined
  return { width: window.innerWidth, height: window.innerHeight }
}

function trackEvent(event: GameEvent, next: InvestigationState, content: CaseContent) {
  switch (event.type) {
    case 'APP_OPENED':
      track('app_opened', { app: event.app })
      break
    case 'FILE_OPENED':
      if (event.fileId === content.desktopIconFileId) track('readme_opened', {})
      break
    case 'EVIDENCE_PINNED':
      track('evidence_pinned', {
        evidenceId: event.evidenceId,
        via: event.via,
        total: next.evidence.length,
      })
      break
    case 'DEVICE_UNLOCK_ATTEMPTED':
      track('device_unlocked', { deviceId: event.deviceId })
      break
    case 'SERVICE_GRANTED':
      track('service_granted', { serviceId: event.serviceId })
      break
    case 'CLAIM_ASSERTED':
      track('claim_asserted', {
        claimId: event.claimId,
        verdict: next.lastVerdict?.verdict ?? 'insufficient',
        evidenceCount: event.evidenceIds.length,
      })
      break
    default:
      break
  }
}
