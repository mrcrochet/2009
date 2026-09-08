'use client'

import dynamic from 'next/dynamic'
import { useMemo } from 'react'
import type { DayContent } from '@/engine/content-schema'

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
}: {
  content: DayContent
  timelineId?: string
  mode: 'new' | 'resume'
}) {
  const id = useMemo(() => timelineId ?? crypto.randomUUID(), [timelineId])
  return <GameRoot content={content} timelineId={id} mode={mode} />
}
