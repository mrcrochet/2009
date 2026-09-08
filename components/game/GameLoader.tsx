'use client'

import dynamic from 'next/dynamic'
import { useMemo } from 'react'
import type { DayContent } from '@/engine/content-schema'
import type { EventInput } from '@/engine/events'
import { contentForDay } from '@/content'

/**
 * The whole engine + HALCYON bundle is pulled in here and nowhere else, so `/` stays light.
 * SSR is off on purpose: the desktop measures the viewport before it lays windows out, and a
 * server render would cause a visible reflow on hydration.
 */
const GameRoot = dynamic(() => import('./GameRoot').then((m) => m.GameRoot), {
  ssr: false,
  loading: () => <div className="two009-preboot" aria-busy="true" />,
})

export function GameLoader({
  content,
  timelineId,
  mode,
  advanceEvent,
}: {
  content: DayContent
  timelineId?: string
  mode: 'new' | 'resume'
  /** Serialisable, so the server route can hand it across the boundary. */
  advanceEvent?: EventInput
}) {
  const id = useMemo(() => timelineId ?? crypto.randomUUID(), [timelineId])
  return (
    <GameRoot
      content={content}
      timelineId={id}
      mode={mode}
      advanceEvent={advanceEvent}
      contentForDay={contentForDay}
    />
  )
}
