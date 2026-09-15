import { CASE_001 } from '@/content'
import { isMeaningful, stamp } from '@/engine/events'
import { createInvestigation } from '@/engine/initial-state'
import { reduce } from '@/engine/reducer'
import type { EventInput } from '@/engine/events'
import type { InvestigationState } from '@/engine/types'

export const content = CASE_001

export function fresh(
  stage: InvestigationState['stage'] = 'playing',
  services: readonly string[] = [],
): InvestigationState {
  return createInvestigation(content, {
    id: 'test-investigation',
    stage,
    now: '2026-06-17T00:00:00.000Z',
    services,
  })
}

/** Dispatch the way the store does: stamp with the current minute, then reduce. */
export function dispatch(state: InvestigationState, input: EventInput): InvestigationState {
  const event = stamp(state, input)
  const next = reduce(state, event, content)
  if (next === state) return state
  return isMeaningful(event) ? { ...next, eventLog: [...next.eventLog, event] } : next
}

export function run(
  state: InvestigationState,
  inputs: readonly EventInput[],
): InvestigationState {
  return inputs.reduce(dispatch, state)
}

/** Everything the case's report gate asks for, in the order a player would do it. */
export function throughTheGate(state: InvestigationState): InvestigationState {
  return run(state, [
    { type: 'APP_OPENED', app: 'files' },
    { type: 'FILE_OPENED', fileId: 'f2' },
    { type: 'APP_OPENED', app: 'msg' },
    { type: 'THREAD_SELECTED', thread: 'claire' },
    { type: 'CHAT_STARTED', thread: 'claire' },
    { type: 'CHAT_REPLY_SENT', thread: 'claire', text: 'Tell me about Sunday.' },
    { type: 'CLAIM_SELECTED', claimId: 'c1' },
    { type: 'CLAIM_ASSERTED', claimId: 'c1', evidenceIds: [] },
  ])
}
