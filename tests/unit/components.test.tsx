import { describe, expect, it } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { GameProvider } from '@/components/game/GameContext'
import { InvestigationBoard } from '@/components/game/InvestigationBoard'
import { MailApp } from '@/components/game/apps/MailApp'
import { MessengerApp } from '@/components/game/apps/MessengerApp'
import { BankApp } from '@/components/game/apps/BankApp'
import { MenuBar } from '@/components/game/MenuBar'
import { SurveillanceOverlay } from '@/components/game/SurveillanceOverlay'
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
    expect(screen.getByRole('meter', { name: 'Memory coherence' })).toHaveAttribute(
      'aria-valuenow',
      '100',
    )

    await user.type(screen.getByLabelText('What do you remember?'), 'bitcoin')
    await user.click(screen.getByRole('button', { name: 'Recall' }))

    expect(screen.getByText(/seven days old, worth nothing/)).toBeInTheDocument()
    expect(screen.getByText('CONFIDENCE: HIGH')).toBeInTheDocument()
    expect(api.getState().timeline.memoryIntegrity).toBe(91)
  })

  it('says it has no recollection instead of inventing one', async () => {
    const user = userEvent.setup()
    mount(<RecallApp />)
    await user.type(
      screen.getByLabelText('What do you remember?'),
      'who wins the 2014 world cup{Enter}',
    )
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
      'Directory',
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

describe('accessibility', () => {
  it('the inbox is a single-select list, not a list of list-items', () => {
    mount(<MailApp />)
    const inbox = screen.getByRole('listbox', { name: 'Inbox' })
    const options = within(inbox).getAllByRole('option')
    expect(options).toHaveLength(3)
    expect(options[0]).toHaveAttribute('aria-selected', 'true')
    expect(options[1]).toHaveAttribute('aria-selected', 'false')
  })

  it('pinning keeps focus on the control that did it', async () => {
    const user = userEvent.setup()
    mount(<MailApp />)
    const pin = screen.getByRole('button', { name: 'PIN AS EVIDENCE' })
    pin.focus()
    await user.click(pin)
    expect(screen.getByRole('button', { name: 'PINNED' })).toHaveFocus()
    expect(screen.getByRole('button', { name: 'PINNED' })).toHaveAttribute('aria-disabled', 'true')
  })

  it('pinning twice is still idempotent through the UI', async () => {
    const user = userEvent.setup()
    const { api } = mount(<MailApp />)
    const pin = screen.getByRole('button', { name: 'PIN AS EVIDENCE' })
    await user.click(pin)
    await user.click(screen.getByRole('button', { name: 'PINNED' }))
    expect(api.getState().timeline.evidence).toHaveLength(1)
  })

  it('the messenger tabs are a real tab widget', async () => {
    const user = userEvent.setup()
    mount(<MessengerApp />, [{ type: 'CHAT_STARTED', thread: 'unknown' }])

    const tabs = screen.getAllByRole('tab')
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
    expect(tabs[0]).toHaveAttribute('tabindex', '0')
    expect(tabs[1]).toHaveAttribute('tabindex', '-1')

    const panel = screen.getByRole('tabpanel')
    expect(panel).toHaveAttribute('aria-labelledby', tabs[0]!.id)
    expect(tabs[0]).toHaveAttribute('aria-controls', panel.id)

    tabs[0]!.focus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getAllByRole('tab')[1]).toHaveAttribute('aria-selected', 'true')
  })

  it('the board traps focus and hands it back when it closes', async () => {
    const user = userEvent.setup()
    const opener = document.createElement('button')
    document.body.appendChild(opener)
    opener.focus()

    const { unmount } = mount(<InvestigationBoard />, [
      { type: 'EVIDENCE_PINNED', evidenceId: 'e3', via: 'browser' },
      { type: 'BOARD_TOGGLED', open: true },
    ])

    const panel = screen.getByRole('dialog', { name: 'Investigation board' })
    expect(panel).toHaveAttribute('aria-modal', 'true')
    // Focus moved inside the trap rather than being merely asserted to be there.
    await waitFor(() => expect(panel.contains(document.activeElement)).toBe(true))

    unmount()
    await waitFor(() => expect(document.activeElement).toBe(opener))
    opener.remove()
    void user
  })

  it('the surveillance beat is announced, not only lit', () => {
    mount(<SurveillanceOverlay />, [{ type: 'DAY_ENDED' }])
    const status = screen.getByRole('status')
    expect(status).toHaveTextContent('Someone was watching the last four hours of this.')
    expect(screen.getByTestId('surveillance')).toHaveAttribute('aria-hidden', 'true')
  })

  it('the menu bar promises no keyboard widget it does not implement', () => {
    mount(<MenuBar onEndDay={() => {}} />)
    expect(screen.queryByRole('menubar')).toBeNull()
    expect(screen.queryAllByRole('menuitem')).toHaveLength(0)
    expect(screen.getByRole('group', { name: /menu bar/ })).toBeInTheDocument()
    // The gate control is honest about being clickable.
    const gate = screen.getByRole('button', { name: /5 things left/ })
    expect(gate).not.toHaveAttribute('aria-disabled')
  })

  it('sound can be turned off from the menu bar and says which state it is in', async () => {
    const user = userEvent.setup()
    mount(<MenuBar onEndDay={() => {}} />)
    const control = screen.getByRole('button', { name: /Sound is on/ })
    await user.click(control)
    expect(screen.getByRole('button', { name: /Sound is off/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await user.click(screen.getByRole('button', { name: /Sound is off/ }))
    expect(screen.getByRole('button', { name: /Sound is on/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('the ledger and the quote board are tables', () => {
    mount(<BankApp />)
    expect(screen.getByRole('table', { name: 'RECENT ACTIVITY' })).toBeInTheDocument()
    expect(screen.getAllByRole('columnheader').map((c) => c.textContent)).toEqual([
      'Date',
      'Description',
      'Amount',
    ])
  })
})
