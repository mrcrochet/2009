'use client'

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import type { DayContent } from '@/engine/content-schema'
import { createTimeline } from '@/engine/initial-state'
import type { GameEvent, TimelineState } from '@/engine/types'
import { selectCanEndDay, selectDaySummary } from '@/engine/selectors'
import { track } from '@/lib/analytics'
import { createAutosave, loadTimeline } from '@/lib/persistence/local-store'
import { createGameStore, type GameStoreApi } from '@/state/store'
import { BootSequence } from './BootSequence'
import { GameErrorBoundary } from './GameErrorBoundary'
import { GameProvider } from './GameContext'
import { HalcyonDesktop } from './HalcyonDesktop'
import '@/styles/halcyon.css'

interface Props {
  readonly content: DayContent
  readonly timelineId: string
  /** `new` starts at the boot console (the player already pressed WAKE UP). */
  readonly mode: 'new' | 'resume'
}

/**
 * Owns everything the pure engine deliberately does not: timers, persistence, viewport and
 * analytics. Every scheduled beat dispatches an ordinary event, so the log stays replayable.
 */
export function GameRoot({ content, timelineId, mode }: Props) {
  const [api] = useState<GameStoreApi>(() =>
    createGameStore({
      content,
      timeline: createTimeline(content, { id: timelineId, now: new Date().toISOString() }),
      onEvent: (event, next) => trackEvent(event, next, content),
    }),
  )
  const [ready, setReady] = useState(mode === 'new')
  const autosave = useMemo(() => createAutosave(600), [])
  const bootStartedAt = useRef<number>(0)

  // --- hydrate -------------------------------------------------------------
  useEffect(() => {
    let cancelled = false
    if (mode === 'new') {
      api.getState().dispatch({ type: 'WOKE_UP' })
      bootStartedAt.current = Date.now()
      return
    }
    void loadTimeline(timelineId).then((saved) => {
      if (cancelled) return
      if (saved) api.getState().hydrate(saved)
      else api.getState().dispatch({ type: 'WOKE_UP' })
      setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [api, mode, timelineId])

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
      if (s.timeline === prev.timeline) return
      autosave.schedule(s.timeline)
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
      if (s.timeline.stage === 'boot' && prev.timeline.stage !== 'boot') startBoot()
    })
    if (api.getState().timeline.stage === 'boot') startBoot()

    function startBoot() {
      if (interval) return
      bootStartedAt.current = Date.now()
      interval = setInterval(() => {
        const state = api.getState()
        if (state.timeline.bootLine >= content.boot.length) {
          if (interval) clearInterval(interval)
          interval = null
          hold = setTimeout(() => {
            api.getState().dispatch({ type: 'BOOT_COMPLETED' })
            track('boot_completed', { durationMs: Date.now() - bootStartedAt.current })
          }, content.bootHoldMs)
          return
        }
        state.dispatch({ type: 'BOOT_ADVANCED' })
      }, content.bootIntervalMs)
    }

    return () => {
      unsub()
      if (interval) clearInterval(interval)
      if (hold) clearTimeout(hold)
    }
  }, [api, content])

  // --- opening beats -------------------------------------------------------
  useEffect(() => {
    let msg: ReturnType<typeof setTimeout> | null = null
    let icon: ReturnType<typeof setTimeout> | null = null

    const schedule = () => {
      if (msg) return
      msg = setTimeout(() => {
        const { dispatch } = api.getState()
        dispatch({ type: 'APP_OPENED', app: 'msg', viewport: measure() })
        dispatch({ type: 'THREAD_SELECTED', thread: 'unknown' })
        dispatch({ type: 'CHAT_STARTED', thread: 'unknown' })
        track('first_message_seen', {})
      }, content.messengerOpensAtMs)
      icon = setTimeout(() => {
        api.getState().dispatch({ type: 'DESKTOP_ICON_APPEARED', iconId: 'readme' })
      }, content.desktopIconAtMs)
    }

    const unsub = api.subscribe((s, prev) => {
      if (s.timeline.stage === 'playing' && prev.timeline.stage === 'boot') schedule()
    })
    return () => {
      unsub()
      if (msg) clearTimeout(msg)
      if (icon) clearTimeout(icon)
    }
  }, [api, content])

  // --- messenger reply delay ----------------------------------------------
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null
    const unsub = api.subscribe((s, prev) => {
      if (s.timeline.chat.waiting && !prev.timeline.chat.waiting) {
        const thread = s.timeline.chat.thread
        timer = setTimeout(() => {
          api.getState().dispatch({ type: 'CHAT_ADVANCED', thread })
        }, content.chatReplyDelayMs)
      }
    })
    return () => {
      unsub()
      if (timer) clearTimeout(timer)
    }
  }, [api, content])

  // --- resale settlement ---------------------------------------------------
  useEffect(() => {
    const timers = new Set<ReturnType<typeof setTimeout>>()
    const unsub = api.subscribe((s, prev) => {
      for (const item of s.timeline.inventory) {
        if (item.state !== 'listed') continue
        const before = prev.timeline.inventory.find((i) => i.id === item.id)
        if (before?.state === 'listed') continue
        const opp = content.economy.opportunities.find((o) => o.id === item.id)
        if (!opp) continue
        track('money_action_started', { itemId: item.id })
        const timer = setTimeout(() => {
          api.getState().dispatch({ type: 'ITEM_SOLD', itemId: item.id, amountCents: opp.sellCents })
          track('money_action_completed', { itemId: item.id, amountCents: opp.sellCents })
        }, opp.settleMs)
        timers.add(timer)
      }
    })
    return () => {
      unsub()
      for (const t of timers) clearTimeout(t)
    }
  }, [api, content])

  // --- day 01 gate ---------------------------------------------------------
  useEffect(() => {
    let fired = false
    const unsub = api.subscribe((s) => {
      if (fired) return
      if (!selectCanEndDay(s.timeline, content)) return
      fired = true
      track('day01_requirements_completed', { minuteOfDay: s.timeline.minuteOfDay })
    })
    return unsub
  }, [api, content])

  // --- day end -------------------------------------------------------------
  const endDay = useCallback(() => {
    const { dispatch, timeline } = api.getState()
    if (timeline.stage === 'day-end') return
    dispatch({ type: 'DAY_ENDED' })
    const summary = selectDaySummary(api.getState().timeline, content)
    track('day01_completed', {
      cashCents: api.getState().timeline.cashCents,
      integrity: api.getState().timeline.memoryIntegrity,
      claimsOnRecord: summary.claimCount,
      shifted: summary.shifted,
    })
    setTimeout(() => api.getState().dispatch({ type: 'DAY_CARD_SHOWN' }), content.dayEnd.surveillanceDelayMs)
  }, [api, content])

  const stage = useStage(api)

  if (!ready) return <div className="hal-boot" aria-busy="true" />

  return (
    <GameProvider value={api}>
      <GameErrorBoundary onReset={() => api.getState().dispatch({ type: 'BOOT_COMPLETED' })}>
        <div className="hal-root">
          {stage === 'boot' ? <BootSequence /> : <HalcyonDesktop onEndDay={endDay} />}
        </div>
      </GameErrorBoundary>
    </GameProvider>
  )
}

function useStage(api: GameStoreApi): TimelineState['stage'] {
  const read = useCallback(() => api.getState().timeline.stage, [api])
  return useSyncExternalStore(api.subscribe, read, read)
}

function measure() {
  if (typeof window === 'undefined') return undefined
  return { width: window.innerWidth, height: window.innerHeight }
}

function trackEvent(event: GameEvent, next: TimelineState, content: DayContent) {
  switch (event.type) {
    case 'APP_OPENED':
      track('app_opened', { app: event.app })
      break
    case 'FILE_OPENED':
      if (event.fileId === 'readme') track('readme_opened', {})
      break
    case 'EVIDENCE_PINNED':
      track('evidence_pinned', {
        evidenceId: event.evidenceId,
        via: event.via,
        total: next.evidence.length,
      })
      break
    case 'RECALL_USED': {
      const latest = next.recalls[0]
      track('recall_used', {
        confidence: latest?.confidence ?? 'NONE',
        matched: Boolean(latest?.memoryId),
        integrityAfter: next.memoryIntegrity,
      })
      break
    }
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
  void content
}
