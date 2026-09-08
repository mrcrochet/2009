import { DAY_01 } from '@/content'
import { isMeaningful, stamp } from '@/engine/events'
import { createTimeline } from '@/engine/initial-state'
import { reduce } from '@/engine/reducer'
import type { EventInput } from '@/engine/events'
import type { TimelineState } from '@/engine/types'

export const content = DAY_01

export function fresh(stage: TimelineState['stage'] = 'playing'): TimelineState {
  return createTimeline(content, { id: 'test-timeline', stage, now: '2026-01-01T00:00:00.000Z' })
}

/** Dispatch the way the store does: stamp with the current minute, then reduce. */
export function dispatch(state: TimelineState, input: EventInput): TimelineState {
  const event = stamp(state, input)
  const next = reduce(state, event, content)
  if (next === state) return state
  return isMeaningful(event) ? { ...next, eventLog: [...next.eventLog, event] } : next
}

export function run(state: TimelineState, inputs: readonly EventInput[]): TimelineState {
  return inputs.reduce(dispatch, state)
}
