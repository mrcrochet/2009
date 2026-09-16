'use client'

import dynamic from 'next/dynamic'
import { useMemo } from 'react'
import type { CaseContent } from '@/engine/case-schema'
import { worldIndexForCase } from '@/content'

/**
 * The whole engine + workstation bundle is pulled in here and nowhere else, so `/` stays light.
 * SSR is off on purpose: the desktop measures the viewport before it lays windows out, and a
 * server render would cause a visible reflow on hydration.
 */
const GameRoot = dynamic(() => import('./GameRoot').then((m) => m.GameRoot), {
  ssr: false,
  loading: () => <div className="unlisted-preboot" aria-busy="true" />,
})

export function GameLoader({
  content,
  investigationId,
  mode,
}: {
  content: CaseContent
  investigationId?: string
  mode: 'new' | 'resume'
}) {
  const id = useMemo(() => investigationId ?? crypto.randomUUID(), [investigationId])
  return (
    <GameRoot
      content={content}
      investigationId={id}
      mode={mode}
      world={worldIndexForCase(content.id)}
    />
  )
}
