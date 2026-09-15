import { describe, expect, it } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { GameProvider } from '@/components/game/GameContext'
import { InvestigationBoard } from '@/components/game/InvestigationBoard'
import { MailApp } from '@/components/game/apps/MailApp'
import { MessengerApp } from '@/components/game/apps/MessengerApp'
import { MenuBar } from '@/components/game/MenuBar'
import { SurveillanceOverlay } from '@/components/game/SurveillanceOverlay'
import { DevicesApp } from '@/components/game/apps/DevicesApp'
import { EvidenceTray } from '@/components/game/EvidenceTray'
import { Dock } from '@/components/game/Dock'
import { createGameStore, type GameStoreApi } from '@/state/store'
import type { EventInput } from '@/engine/events'
import { content, fresh } from './helpers'

function mount(node: ReactNode, seed: readonly EventInput[] = []) {
  const api: GameStoreApi = createGameStore({ content, investigation: fresh() })
  for (const input of seed) api.getState().dispatch(input)
  const utils = render(<GameProvider value={api}>{node}</GameProvider>)
  return { api, ...utils }
}

describe('Devices app', () => {
  it('shows a locked source as locked, and opens it with what the case hid', async () => {
    const user = userEvent.setup()
    const { api } = mount(<DevicesApp />)

    const phone = document.querySelector('[data-device="dev-phone"]')!
    expect(phone).toHaveAttribute('data-unlocked', 'false')
    expect(within(phone as HTMLElement).getByText('LOCKED')).toBeInTheDocument()

    await user.type(within(phone as HTMLElement).getByLabelText('Passcode'), '190455')
    await user.click(within(phone as HTMLElement).getByRole('button', { name: 'OPEN' }))

    expect(api.getState().investigation.devices['dev-phone']?.unlocked).toBe(true)
  })

  it('refuses a wrong passcode in the case’s own words, and stays shut', async () => {
    const user = userEvent.setup()
    const { api } = mount(<DevicesApp />)
    const phone = document.querySelector('[data-device="dev-phone"]') as HTMLElement

    await user.type(within(phone).getByLabelText('Passcode'), '000000')
    await user.click(within(phone).getByRole('button', { name: 'OPEN' }))

    expect(api.getState().investigation.devices['dev-phone']?.unlocked).toBe(false)
    expect(screen.getByRole('status')).toHaveTextContent('Not that one.')
  })

  /**
   * The one screen in this product that could mislead somebody without meaning to. It says what
   * is missing, says what recovery would return, and says in the player's own world that the
   * money is real — before any price is shown, and without taking a card here.
   */
  it('says a forensic purchase is real, and does not take money inside the fiction', () => {
    mount(<DevicesApp />)
    const service = document.querySelector('[data-service="svc-calls"]') as HTMLElement
    expect(within(service).getByText(/This is a real purchase/)).toBeInTheDocument()
    expect(within(service).getByText(/can be closed without it/)).toBeInTheDocument()
    expect(within(service).queryByText(/\$/)).toBeNull()
    expect(within(service).getByRole('link', { name: /recovery options/i })).toHaveAttribute(
      'href',
      '/account?service=svc-calls',
    )
  })
})

describe('Investigation board', () => {
  const seed: EventInput[] = [
    { type: 'EVIDENCE_PINNED', evidenceId: 'e2', via: 'files' },
    { type: 'EVIDENCE_PINNED', evidenceId: 'e7', via: 'terminal' },
    { type: 'BOARD_TOGGLED', open: true },
  ]

  it('accepts a claim built from exactly the right pieces', async () => {
    const user = userEvent.setup()
    const { api } = mount(<InvestigationBoard />, seed)

    await user.click(screen.getByRole('button', { name: /I have been asked to sign off/ }))
    await user.click(screen.getByRole('button', { name: /Directors: A. Marlow/ }))
    await user.click(
      screen.getByRole('button', { name: /preparing to report the Marlow Foundation/ }),
    )
    await user.click(screen.getByRole('button', { name: 'SUBMIT CLAIM' }))

    const verdict = screen.getByRole('status')
    expect(verdict).toHaveAttribute('data-verdict', 'accepted')
    expect(within(verdict).getByText('ACCEPTED')).toBeInTheDocument()
    expect(api.getState().investigation.claimLog).toHaveLength(0)
  })

  it('refuses an unsound claim and files it under the player’s name anyway', async () => {
    const user = userEvent.setup()
    const { api } = mount(<InvestigationBoard />, seed)

    await user.click(screen.getByRole('button', { name: /left Portland of his own accord/ }))
    await user.click(screen.getByRole('button', { name: 'SUBMIT CLAIM' }))

    expect(screen.getByRole('status')).toHaveAttribute('data-verdict', 'refused')
    expect(screen.getByText('REFUSED — FILED UNDER YOUR NAME')).toBeInTheDocument()
    expect(screen.getByText('CLAIMS ON RECORD')).toBeInTheDocument()
    expect(api.getState().investigation.claimLog).toHaveLength(1)
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
      'Relay Mail',
      'Dispatch',
      'Orbit',
      'Files',
      'Devices',
      'Notes',
      'Console',
      'Directory',
      'NOVA M12',
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
    expect(options).toHaveLength(content.mail.length)
    expect(options[0]).toHaveAttribute('aria-selected', 'true')
    expect(options[1]).toHaveAttribute('aria-selected', 'false')
  })

  it('pinning keeps focus on the control that did it', async () => {
    const user = userEvent.setup()
    // The intake mail carries nothing to pin; the client's does.
    mount(<MailApp />, [{ type: 'MAIL_OPENED', mailId: 'm2' }])
    const pin = screen.getByRole('button', { name: 'PIN AS EVIDENCE' })
    pin.focus()
    await user.click(pin)
    expect(screen.getByRole('button', { name: 'PINNED' })).toHaveFocus()
    expect(screen.getByRole('button', { name: 'PINNED' })).toHaveAttribute('aria-disabled', 'true')
  })

  it('pinning twice is still idempotent through the UI', async () => {
    const user = userEvent.setup()
    const { api } = mount(<MailApp />, [{ type: 'MAIL_OPENED', mailId: 'm2' }])
    const pin = screen.getByRole('button', { name: 'PIN AS EVIDENCE' })
    await user.click(pin)
    await user.click(screen.getByRole('button', { name: 'PINNED' }))
    expect(api.getState().investigation.evidence).toHaveLength(1)
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
      { type: 'EVIDENCE_PINNED', evidenceId: 'e3', via: 'files' },
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
    mount(<SurveillanceOverlay />, [{ type: 'REPORT_FILED' }])
    const status = screen.getByRole('status')
    expect(status).toHaveTextContent(content.report.watchedLine)
    expect(screen.getByTestId('surveillance')).toHaveAttribute('aria-hidden', 'true')
  })

  it('the menu bar promises no keyboard widget it does not implement', () => {
    mount(<MenuBar onFileReport={() => {}} />)
    expect(screen.queryByRole('menubar')).toBeNull()
    expect(screen.queryAllByRole('menuitem')).toHaveLength(0)
    expect(screen.getByRole('group', { name: /menu bar/ })).toBeInTheDocument()
    // The gate control is honest about being clickable.
    const gate = screen.getByRole('button', { name: /3 things left/ })
    expect(gate).not.toHaveAttribute('aria-disabled')
  })

  it('sound can be turned off from the menu bar and says which state it is in', async () => {
    const user = userEvent.setup()
    mount(<MenuBar onFileReport={() => {}} />)
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

  it('a locked device is a form, with a labelled field and a real submit', () => {
    mount(<DevicesApp />)
    const phone = document.querySelector('[data-device="dev-phone"]') as HTMLElement
    expect(within(phone).getByLabelText('Passcode')).toBeInTheDocument()
    // Disabled until there is something to submit, and honest about being a button.
    expect(within(phone).getByRole('button', { name: 'OPEN' })).toBeDisabled()
  })
})
