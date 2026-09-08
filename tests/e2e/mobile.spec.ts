import { expect, test, type Page } from '@playwright/test'

/**
 * Two surfaces with real implementation and no end-to-end proof: the narrow layout described in
 * CLAUDE.md §21, and the keyboard affordances the shell recently gained.
 */

const dock = (page: Page) => page.getByRole('navigation', { name: 'Dock' })
const win = (page: Page, app: string) => page.locator(`.hal-window[data-app="${app}"]`)
const tray = (page: Page) => page.getByRole('complementary', { name: 'Pinned evidence' })
const board = (page: Page) => page.getByRole('dialog', { name: 'Investigation board' })

/** Straight to a guest timeline, then wait out the scripted opening. */
async function boot(page: Page) {
  await page.goto('/play')
  await expect(page.getByTestId('desktop')).toBeVisible({ timeout: 15_000 })
  await expect(win(page, 'msg')).toBeVisible({ timeout: 10_000 })
}

async function openApp(page: Page, label: string) {
  await dock(page).getByRole('button', { name: label }).click()
}

const focused = (page: Page) =>
  page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null
    return {
      className: el?.className ?? '',
      text: (el?.textContent ?? '').trim().slice(0, 48),
      inBoard: Boolean(el?.closest('.hal-board__panel')),
    }
  })

// ---------------------------------------------------------------- mobile ---

test.describe('HALCYON on a narrow screen', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })

  test('foregrounds one app at a time and keeps the dock as the task switcher', async ({
    page,
  }) => {
    await boot(page)

    await openApp(page, 'Corvid Mail')
    await expect(win(page, 'mail')).toBeVisible()
    // The messenger opened itself first; the desktop is never two windows deep here.
    await expect(win(page, 'msg')).toBeHidden()

    await openApp(page, 'Meridian Savings')
    await expect(win(page, 'bank')).toBeVisible()
    await expect(win(page, 'mail')).toBeHidden()

    // The dock switches back, which is the whole point of keeping it.
    await openApp(page, 'Corvid Mail')
    await expect(win(page, 'mail')).toBeVisible()
    await expect(win(page, 'bank')).toBeHidden()
  })

  test('never miniaturises the desktop sideways', async ({ page }) => {
    await boot(page)
    await openApp(page, 'Halcyon Browser') // the widest window at 720px
    await expect(win(page, 'web')).toBeVisible()
    await openApp(page, 'Meridian Savings')
    await openApp(page, 'Halcyon Browser')

    const overflow = await page.evaluate(() => ({
      doc: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      body: document.body.scrollWidth - document.body.clientWidth,
    }))
    expect(overflow.doc).toBeLessThanOrEqual(0)
    expect(overflow.body).toBeLessThanOrEqual(0)

    const frame = await win(page, 'web').boundingBox()
    expect(frame).not.toBeNull()
    expect(frame!.x).toBe(0)
    expect(frame!.width).toBe(390)
    // Windows leave the dock its strip; nothing is scaled down to fit.
    expect(frame!.y + frame!.height).toBeLessThan(844)
  })

  test('the phone becomes a full-height overlay, not a floating object', async ({ page }) => {
    await boot(page)
    await openApp(page, 'NOKORA N90')

    const phone = page.getByTestId('phone-overlay')
    await expect(phone).toBeVisible()
    const box = await phone.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.x).toBe(0)
    expect(box!.width).toBe(390)
    // 296×552 on the desktop; here it takes the screen below the menu bar.
    expect(box!.height).toBeGreaterThan(700)

    // `press` rather than `tap`: the home button is under the dock (see the known-bug test
    // below). This asserts the phone can be put down, not that it can be reached by thumb.
    await phone.getByLabel('Put the phone down').press('Enter')
    await expect(phone).toHaveCount(0)
  })

  test('the tray is a bottom sheet', async ({ page }) => {
    await boot(page)
    await openApp(page, 'Meridian Savings')
    await win(page, 'bank').locator('[data-evidence="e4"]').click()

    await expect(tray(page)).toBeVisible()
    const sheet = await tray(page).boundingBox()
    expect(sheet).not.toBeNull()
    expect(sheet!.x).toBe(0)
    expect(sheet!.width).toBe(390)
    // Anchored to the bottom rather than the right — but above the dock strip, because the
    // OPEN BOARD button lives on the sheet's bottom edge and the dock would swallow the tap.
    expect(sheet!.y + sheet!.height).toBeCloseTo(844 - 76, 0)
    expect(sheet!.height).toBeLessThan(844 * 0.7)
  })

  test('the board is a full-screen workspace', async ({ page }) => {
    await boot(page)
    await openApp(page, 'Meridian Savings')
    await win(page, 'bank').locator('[data-evidence="e4"]').click()
    await tray(page).getByRole('button', { name: 'OPEN BOARD' }).press('Enter')

    await expect(board(page)).toBeVisible()
    const panel = await board(page).boundingBox()
    expect(panel).not.toBeNull()
    expect(panel!.x).toBe(0)
    expect(panel!.width).toBe(390)
    expect(panel!.height).toBeGreaterThan(780)

    // The two columns stack instead of sitting side by side at ~194px each.
    const left = await page.locator('.hal-board__left').boundingBox()
    expect(left!.width).toBeGreaterThan(300)
  })

  test('a player can actually build a claim on a phone', async ({ page }) => {
    await boot(page)

    // One piece from Files…
    await openApp(page, 'Files')
    await win(page, 'files')
      .getByRole('option', { name: /READ_ME/ })
      .click()
    await win(page, 'files').getByRole('button', { name: 'PIN AS EVIDENCE' }).click()

    // …and one from the bank, in a different app, without losing the first.
    await openApp(page, 'Meridian Savings')
    await win(page, 'bank').locator('[data-evidence="e4"]').click()

    await expect(page.getByTestId('evidence-tab')).toContainText('EVIDENCE · 2')
    await expect(tray(page)).toBeVisible()
    await tray(page).getByRole('button', { name: 'OPEN BOARD' }).press('Enter')

    await expect(board(page).locator('[data-evidence="1:e1"]')).toBeVisible()
    await expect(board(page).locator('[data-evidence="1:e4"]')).toBeVisible()
  })

  /**
   * KNOWN BUG. `.hal-window` reserves the dock's strip on mobile
   * (`inset: var(--menubar-height) 0 76px 0`), but `.hal-phone` and `.hal-tray` both run to
   * `bottom: 0` beneath a dock at z-index 8800. The phone's home button and the tray's OPEN
   * BOARD button — the only ways out of each — are unreachable by touch. Reserving the same
   * strip on both fixes it; this test will start failing as "unexpectedly passed" when it does.
   */
  test('the dock does not cover the controls at the bottom edge', async ({ page }) => {
    await boot(page)

    // The home button and OPEN BOARD are the only ways out of these two surfaces. Both sit at
    // the bottom edge, under a dock at z-index 8800, so `click()`'s hit-target check is the
    // assertion here — not a formality.
    await openApp(page, 'NOKORA N90')
    await page
      .getByTestId('phone-overlay')
      .getByLabel('Put the phone down')
      .click({ timeout: 3_000 })
    await expect(page.getByTestId('phone-overlay')).toHaveCount(0)

    await openApp(page, 'Files')
    await page
      .locator('[data-app="files"]')
      .getByRole('button', { name: 'PIN AS EVIDENCE' })
      .click()
    await page
      .getByRole('complementary', { name: 'Pinned evidence' })
      .getByRole('button', { name: 'OPEN BOARD' })
      .click({ timeout: 3_000 })
    await expect(page.getByRole('dialog', { name: 'Investigation board' })).toBeVisible()
  })

  test('the menu bar keeps the day and the clock, and drops the scenery', async ({ page }) => {
    await boot(page)
    const bar = page.getByRole('group', { name: /menu bar/ })
    await expect(bar).toContainText('HALCYON')
    await expect(bar).toContainText(/Thu 15 Jan \d{2}:\d{2}/)
    await expect(bar.getByRole('button', { name: /Day 01 — \d things left/ })).toBeVisible()
    // File / Edit / View are period scenery and are not worth the width here.
    await expect(page.locator('.hal-menubar__menu').first()).toBeHidden()
  })

  test('the search stacks its filters instead of shrinking them out of reach', async ({ page }) => {
    await boot(page)
    await page.keyboard.press('Control+k')
    const search = page.getByRole('dialog', { name: 'Search HALCYON' })
    await expect(search).toBeVisible()
    await page.keyboard.type('marc')

    const panel = page.locator('.hal-search__panel')
    const box = (await panel.boundingBox())!
    // The window fits the screen rather than hanging off the side of it.
    expect(box.width).toBeLessThanOrEqual(390)
    expect(box.x).toBeGreaterThanOrEqual(0)

    // Filters and results both survive; on a phone the filters become a row you can swipe.
    await expect(search.getByRole('group', { name: 'Filter by source' })).toBeVisible()
    await expect(search.getByRole('option').first()).toBeVisible()
  })

  test('the directory gives the page the width, not the list', async ({ page }) => {
    await boot(page)
    await openApp(page, 'Directory')
    const list = page.getByRole('listbox', { name: 'Directory' })
    await expect(list).toBeVisible()
    await list.getByRole('option').first().click()

    const dossier = page.locator('.hal-dir__page')
    const box = (await dossier.boundingBox())!
    // A two-column dossier at 390px would give each column 190px and neither would be readable.
    expect(box.width).toBeGreaterThan(300)
    await expect(dossier).toContainText(/\d+ found/)
  })
})

// -------------------------------------------------------------- keyboard ---

test.describe('keyboard routes through HALCYON', () => {
  test('Ctrl+D reaches the dock and Ctrl+E opens the tray', async ({ page }) => {
    await boot(page)

    await page.keyboard.press('Control+d')
    await expect.poll(async () => (await focused(page)).className).toContain('hal-dockitem')

    await page.keyboard.press('Control+e')
    await expect(tray(page)).toBeVisible()
    await expect.poll(async () => (await focused(page)).text).toBe('OPEN BOARD')
  })

  test('Ctrl+` cycles the front window', async ({ page }) => {
    await boot(page)
    await openApp(page, 'Corvid Mail')
    await openApp(page, 'Meridian Savings')
    await expect(win(page, 'bank')).toHaveAttribute('data-front', 'true')

    await page.keyboard.press('Control+`')
    await expect(win(page, 'mail')).toHaveAttribute('data-front', 'true')
    await expect(win(page, 'bank')).toHaveAttribute('data-front', 'false')
  })

  test('tabbing into a buried window raises it', async ({ page }) => {
    await boot(page)
    await openApp(page, 'Corvid Mail')
    await openApp(page, 'Meridian Savings')
    await expect(win(page, 'mail')).toHaveAttribute('data-front', 'false')

    // A control inside the buried window, reached the way a keyboard player reaches it.
    await win(page, 'mail').getByRole('option').first().focus()
    await expect(win(page, 'mail')).toHaveAttribute('data-front', 'true')
  })

  test('the board traps focus and hands it back on close', async ({ page }) => {
    await boot(page)
    await openApp(page, 'Meridian Savings')
    await win(page, 'bank').locator('[data-evidence="e4"]').click()

    const opener = tray(page).getByRole('button', { name: 'OPEN BOARD' })
    await opener.click()
    await expect(board(page)).toBeVisible()

    // Tab far past the end of the panel; focus must never leave it.
    for (let i = 0; i < 40; i += 1) {
      await page.keyboard.press('Tab')
      expect((await focused(page)).inBoard, `focus escaped the board on Tab ${i + 1}`).toBe(true)
    }

    await page.keyboard.press('Escape')
    await expect(board(page)).toHaveCount(0)
    await expect(opener).toBeFocused()
  })

  test('pinning keeps focus on the control that did it', async ({ page }) => {
    await boot(page)
    await openApp(page, 'Meridian Savings')
    const pin = win(page, 'bank').locator('[data-evidence="e4"]')
    await pin.click()
    await expect(pin).toHaveText('PINNED')
    await expect(pin).toBeFocused()
  })

  test('the messenger tabs answer to arrow keys', async ({ page }) => {
    await boot(page)
    const tabs = win(page, 'msg').getByRole('tab')
    await expect(tabs.first()).toHaveAttribute('aria-selected', 'true')

    await tabs.first().focus()
    await page.keyboard.press('ArrowRight')
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true')
    await expect(tabs.first()).toHaveAttribute('aria-selected', 'false')
  })
})
