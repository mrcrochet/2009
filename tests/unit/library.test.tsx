import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BY_CASE, SHELF } from '@/content'
import { CasesHome } from '@/components/product/CasesHome'

function home() {
  return render(
    <div className="unlisted">
      <CasesHome />
    </div>,
  )
}

/**
 * The home page, as the design reference defines it. These assert the structure the reference
 * lays out — the sidebar groups, the continue row, the four rails, the season of five, the held
 * session and the brief — so that a refactor cannot quietly drop half of it.
 */
describe('the home page follows the reference', () => {
  it('has the three sidebar groups and the membership card', () => {
    home()
    for (const group of ['Home', 'Library', 'Account']) {
      expect(screen.getByRole('navigation', { name: group })).toBeInTheDocument()
    }
    expect(screen.getByRole('button', { name: /Search/ })).toBeInTheDocument()
    expect(screen.getByText('Unlisted membership')).toBeInTheDocument()
  })

  it('opens on the continue hero and two posters beside it', () => {
    home()
    const hero = document.querySelector('.hero') as HTMLElement
    expect(within(hero).getByRole('heading', { name: 'He never came home' })).toBeInTheDocument()
    expect(within(hero).getByText(/48 artifacts · 4 claims filed/)).toBeInTheDocument()
    expect(within(hero).getByRole('link', { name: /Resume workstation/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'No signal' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'The other account' })).toBeInTheDocument()
  })

  it('lays out the four rails the reference names', () => {
    home()
    for (const rail of ['New this week', 'Because you opened He never came home', 'Start free']) {
      expect(screen.getByRole('heading', { name: rail })).toBeInTheDocument()
    }
    expect(screen.getByText(/Five cases\. One thread\./)).toBeInTheDocument()
    expect(document.querySelectorAll('.spine')).toHaveLength(5)
    expect(document.querySelectorAll('.spine.locked')).toHaveLength(1)
  })

  it('holds the session at the bottom of the page', () => {
    home()
    const bar = document.querySelector('.bar') as HTMLElement
    expect(bar).toBeTruthy()
    expect(within(bar).getByText('2h 14m · NOVA session held')).toBeInTheDocument()
    expect(within(bar).getByRole('button', { name: 'Resume' })).toBeInTheDocument()
  })

  it('draws every key art the page asks for', () => {
    home()
    const used = [...document.querySelectorAll('use')].map((u) => u.getAttribute('href'))
    for (const href of new Set(used)) {
      expect(document.querySelector(`symbol${href}`), `${href} has no symbol`).toBeTruthy()
    }
  })
})

describe('the case brief', () => {
  it('opens from a poster, and closes on Escape and on its backdrop', async () => {
    const user = userEvent.setup()
    home()
    const modal = document.getElementById('brief') as HTMLElement
    expect(modal.className).toBe('modal')

    await user.click(screen.getByRole('button', { name: 'Case brief' }))
    expect(modal.className).toBe('modal open')
    expect(within(modal).getByText(/A woman arrives with her husband/)).toBeInTheDocument()
    expect(within(modal).getByText('1,120 investigators')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(modal.className).toBe('modal')

    await user.click(screen.getByRole('button', { name: 'Case brief' }))
    await user.click(modal)
    expect(modal.className).toBe('modal')
  })
})

/**
 * The page ships the reference's placeholder catalogue. This is the seam that will replace it:
 * one case is written, and `SHELF` is derived from the registry rather than authored twice.
 */
describe('the shelf behind the page', () => {
  it('is the case registry', () => {
    expect(SHELF.length).toBe(Object.keys(BY_CASE).length)
    for (const entry of SHELF) {
      const kase = BY_CASE[entry.id]!
      expect(entry.title).toBe(kase.title)
      expect(entry.hook).toBe(kase.catalogue.hook)
    }
  })
})
