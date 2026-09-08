import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { GameProvider } from '@/components/game/GameContext'
import { InvestigationBoard } from '@/components/game/InvestigationBoard'
import { RecallApp } from '@/components/game/apps/RecallApp'
import { EvidenceTray } from '@/components/game/EvidenceTray'
import { Dock } from '@/components/game/Dock'
import { createGameStore, type GameStoreApi } from '@/state/store'
import type { EventInput } from '@/engine/events'
import { content, fresh } from './helpers'

function mount(node: ReactNode, seed: readonly EventInput[] = []) {
  const api: GameStoreApi = createGameStore({ content, timeline: fresh() })
  for (const input of seed) api.getState().dispatch(input)
  const utils = render(<GameProvider value={api}>{node}</GameProvider>)
  return { api, ...utils }
}

describe('Recall app', () => {
  it('spends coherence and shows the confidence in words, not just colour', async () => {
    const user = userEvent.setup()
    const { api } = mount(<RecallApp />)

    expect(screen.getByText(/Nothing retrieved yet/)).toBeInTheDocument()
    expect(screen.getByRole('meter', { name: 'Memory coherence' })).toHaveAttribute('aria-valuenow', '100')

    await user.type(screen.getByLabelText('What do you remember?'), 'bitcoin')
    await user.click(screen.getByRole('button', { name: 'Recall' }))

    expect(screen.getByText(/nine days old, worth nothing/)).toBeInTheDocument()
    expect(screen.getByText('CONFIDENCE: HIGH')).toBeInTheDocument()
    expect(api.getState().timeline.memoryIntegrity).toBe(91)
  })

  it('says it has no recollection instead of inventing one', async () => {
    const user = userEvent.setup()
    mount(<RecallApp />)
    await user.type(screen.getByLabelText('What do you remember?'), 'who wins the 2014 world cup{Enter}')
    expect(screen.getByText(/No recollection/)).toBeInTheDocument()
    expect(screen.getByText('CONFIDENCE: NONE')).toBeInTheDocument()
  })
})

describe('Investigation board', () => {
  const seed: EventInput[] = [
    { type: 'EVIDENCE_PINNED', evidenceId: 'e3', via: 'browser' },
    { type: 'EVIDENCE_PINNED', evidenceId: 'e4', via: 'bank' },
    { type: 'BOARD_TOGGLED', open: true },
  ]

  it('accepts a claim built from exactly the right pieces', async () => {
    const user = userEvent.setup()
    const { api } = mount(<InvestigationBoard />, seed)

    await user.click(screen.getByRole('button', { name: /died 19 December 2008/ }))
    await user.click(screen.getByRole('button', { name: /opened 06 January 2009/ }))
    await user.click(screen.getByRole('button', { name: /Owen Rask is dead/ }))
    await user.click(screen.getByRole('button', { name: 'SUBMIT CLAIM' }))

    const verdict = screen.getByRole('status')
    expect(verdict).toHaveAttribute('data-verdict', 'accepted')
    expect(within(verdict).getByText('ACCEPTED')).toBeInTheDocument()
    expect(api.getState().timeline.claimLog).toHaveLength(0)
  })

  it('refuses an unsound claim and files it under the player’s name anyway', async () => {
    const user = userEvent.setup()
    const { api } = mount(<InvestigationBoard />, seed)

    await user.click(screen.getByRole('button', { name: /Marc works for the Aion Group/ }))
    await user.click(screen.getByRole('button', { name: 'SUBMIT CLAIM' }))

    expect(screen.getByRole('status')).toHaveAttribute('data-verdict', 'refused')
    expect(screen.getByText('REFUSED — FILED UNDER YOUR NAME')).toBeInTheDocument()
    expect(screen.getByText('CLAIMS ON RECORD')).toBeInTheDocument()
    expect(api.getState().timeline.claimLog).toHaveLength(1)
  })

  it('cannot submit without choosing a claim', () => {
    mount(<InvestigationBoard />, seed)
    expect(screen.getByRole('button', { name: 'SUBMIT CLAIM' })).toBeDisabled()
  })
})

describe('evidence tray', () => {
  it('is collapsible and starts closed', async () => {
    const user = userEvent.setup()
    mount(<EvidenceTray />)
    const tab = screen.getByRole('button', { name: /EVIDENCE/ })
    expect(tab).toHaveAttribute('aria-expanded', 'false')
    await user.click(tab)
    expect(screen.getByRole('complementary', { name: 'Pinned evidence' })).toBeInTheDocument()
    expect(screen.getByText(/The machine will not decide what matters/)).toBeInTheDocument()
  })
})

describe('the browser is the computer', () => {
  it('the dock is app launchers only — no product navigation', () => {
    mount(<Dock />)
    const dock = screen.getByRole('navigation', { name: 'Dock' })
    const labels = within(dock)
      .getAllByRole('button')
      .map((b) => b.getAttribute('aria-label'))

    expect(labels).toEqual([
      'Corvid Mail',
      'Ember Messenger',
      'Halcyon Browser',
      'Files',
      'Meridian Savings',
      'Quoteline',
      'Notes',
      'Terminal',
      'Recall',
      'NOKORA N90',
    ])
    for (const forbidden of ['Business', 'Timeline', 'Dashboard', 'Settings', 'Computer']) {
      expect(labels).not.toContain(forbidden)
    }
    // Icons are hand-drawn SVG, never emoji.
    expect(within(dock).getAllByRole('button')[0]?.querySelector('svg')).toBeTruthy()
    expect(/\p{Emoji_Presentation}|\uFE0F/u.test(dock.textContent ?? '')).toBe(false)
  })
})
