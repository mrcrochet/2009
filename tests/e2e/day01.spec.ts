import { expect, test, type Page } from '@playwright/test'

/**
 * The Day 01 golden path, end to end, exactly as a player walks it:
 * landing → wake → boot → desktop → apps → evidence → recall → money → claim → gate → end →
 * cliffhanger → summary → save/auth/entitlement boundary.
 */

async function openApp(page: Page, label: string) {
  await page.getByRole('navigation', { name: 'Dock' }).getByRole('button', { name: label }).click()
}

test.describe('Day 01', () => {
  test('plays from the landing to the paywall boundary', async ({ page }) => {
    // --- landing ---------------------------------------------------------
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('YOU WAKE UP')
    await expect(page.getByText('$437.82 in an account that is not yours.')).toBeVisible()
    await expect(page.getByText('15 JAN 2009 · 07:32 · PORTLAND, OR')).toBeVisible()
    // The landing route ships no game surface at all.
    await expect(page.getByTestId('desktop')).toHaveCount(0)

    // --- wake + boot -----------------------------------------------------
    await page.getByRole('link', { name: 'WAKE UP' }).click()
    await expect(page.getByTestId('boot')).toBeVisible()
    await expect(page.getByTestId('boot')).toContainText('HALCYON 4.1  (build 4.1.882)')
    await expect(page.getByTestId('boot')).toContainText('Restoring session for user: orask')

    // --- desktop ---------------------------------------------------------
    await expect(page.getByTestId('desktop')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('menubar')).toContainText('HALCYON')
    await expect(page.getByRole('navigation', { name: 'Dock' })).toBeVisible()

    // No SaaS shell anywhere in the playing surface.
    for (const forbidden of ['Dashboard', 'Overview', 'Business', 'Timeline', 'Settings', 'Upgrade']) {
      await expect(page.getByRole('button', { name: forbidden, exact: true })).toHaveCount(0)
    }

    // --- Ember Messenger opens itself ------------------------------------
    const messenger = page.locator('[data-app="msg"]')
    await expect(messenger).toBeVisible({ timeout: 10_000 })
    await expect(messenger.getByText('You have 30 days.')).toBeVisible()

    // --- READ_ME appears on the desktop ----------------------------------
    const readmeIcon = page.locator('.hal-icon').filter({ hasText: 'READ_ME.txt' })
    await expect(readmeIcon).toBeVisible({ timeout: 10_000 })
    await readmeIcon.click()

    const files = page.locator('[data-app="files"]')
    await expect(files).toBeVisible()
    await expect(files).toContainText('Amount due: $10,000.00')
    await files.getByRole('button', { name: 'PIN AS EVIDENCE' }).click()

    // Pinning opens the tray.
    const tray = page.getByRole('complementary', { name: 'Pinned evidence' })
    await expect(tray).toBeVisible()
    await expect(tray).toContainText('Quota 01: $10,000.00')
    await page.getByRole('button', { name: 'Close evidence tray' }).click()

    // --- Corvid Mail ------------------------------------------------------
    await openApp(page, 'Corvid Mail')
    const mail = page.locator('[data-app="mail"]')
    await expect(mail).toBeVisible()
    await expect(mail).toContainText('Quota 01 — statement of obligation')
    await expect(mail).toContainText('Obligation on record: $10,000.00.')
    await mail.getByRole('button', { name: 'PIN AS EVIDENCE' }).click() // e2 — the 03:11 header
    await mail.getByLabel('Close Corvid Mail').click()

    // --- Meridian Savings -------------------------------------------------
    await openApp(page, 'Meridian Savings')
    const bank = page.locator('[data-app="bank"]')
    await expect(bank.getByTestId('bank-balance')).toHaveText('$437.82')
    await bank.locator('[data-evidence="e4"]').click()
    await bank.getByLabel('Close Meridian Savings').click()

    // --- the phone is an object on the desk, not a tab --------------------
    await openApp(page, 'NOKORA N90')
    const phone = page.getByTestId('phone-overlay')
    await expect(phone).toBeVisible()
    await phone.getByRole('tab', { name: 'Photos' }).click()
    await expect(phone).toContainText('parking structure, SW 3rd')
    await phone.locator('[data-evidence="e6"]').click()
    await phone.getByRole('tab', { name: 'SMS' }).click()
    await phone.locator('[data-evidence="e5"]').click()
    await phone.getByLabel('Put the phone down').click()
    await expect(phone).toHaveCount(0)

    // --- the fictional browser -------------------------------------------
    await openApp(page, 'Halcyon Browser')
    const web = page.locator('[data-app="web"]')
    await expect(web).toBeVisible()
    await web.getByLabel('Search the web').fill('owen rask')
    await web.getByRole('button', { name: 'Search' }).click()
    await expect(web).toContainText('Obituaries — December 2008')
    await web.getByRole('button', { name: /Obituaries — December 2008/ }).click()
    await expect(web).toContainText('died Friday, December 19, 2008')
    await web.locator('[data-evidence="e3"]').click()

    // Back works, and it is a real history stack.
    await web.getByLabel('Back').click()
    await expect(web).toContainText('Results for')

    // --- Recall costs something ------------------------------------------
    await openApp(page, 'Recall')
    const recall = page.locator('[data-app="recall"]')
    await expect(recall.getByRole('meter', { name: 'Memory coherence' })).toHaveAttribute('aria-valuenow', '100')
    await recall.getByLabel('What do you remember?').fill('bitcoin')
    await recall.getByRole('button', { name: 'Recall', exact: true }).click()
    await expect(recall).toContainText('CONFIDENCE: HIGH')
    await expect(recall.getByRole('meter', { name: 'Memory coherence' })).toHaveAttribute('aria-valuenow', '91')
    await recall.getByLabel('Close Recall').click()

    // --- Marc, and the money beat he points at ---------------------------
    await openApp(page, 'Ember Messenger')
    await messenger.getByRole('tab', { name: 'Marc' }).click()
    await expect(messenger).toContainText('i have a thing that pays today')
    await messenger.getByRole('button', { name: 'What kind of thing?' }).click()
    await expect(messenger).toContainText('guy on tradepost is dumping a phone', { timeout: 10_000 })

    await openApp(page, 'Halcyon Browser')
    await web.getByLabel('Address').fill('tradepost.com/pdx/electronics')
    await web.getByLabel('Address').press('Enter')
    await expect(web).toContainText('Nokora N90 — unlocked, boxed')

    await web.locator('[data-listing="tradepost-n90"]').click()
    await expect(web.locator('[data-listing="tradepost-n90"]')).toHaveText('POST FOR RESALE')
    await web.locator('[data-listing="tradepost-n90"]').click()
    await expect(web.locator('[data-listing="tradepost-n90"]')).toHaveText('SOLD FOR $340.00', {
      timeout: 15_000,
    })

    await openApp(page, 'Meridian Savings')
    await expect(bank.getByTestId('bank-balance')).toHaveText('$717.82')
    await expect(bank).toContainText('DEPOSIT — CASH (RESALE)')
    await expect(bank).toContainText('CASH WITHDRAWAL — TRADEPOST MEET')

    // --- assert a claim ---------------------------------------------------
    const trayPanel = page.getByRole('complementary', { name: 'Pinned evidence' })
    if (!(await trayPanel.isVisible())) await page.getByTestId('evidence-tab').click()
    await expect(trayPanel).toBeVisible()
    await expect(page.getByTestId('evidence-tab')).toContainText('EVIDENCE · 6')
    await trayPanel.getByRole('button', { name: 'OPEN BOARD' }).click()
    const board = page.getByRole('dialog', { name: 'Investigation board' })
    await expect(board).toBeVisible()

    await board.locator('[data-evidence="e5"]').click()
    await board.locator('[data-evidence="e6"]').click()
    await board.locator('[data-claim="c1"]').click()
    await board.getByRole('button', { name: 'SUBMIT CLAIM' }).click()
    await expect(board.getByRole('status')).toHaveAttribute('data-verdict', 'accepted')
    await expect(board.getByRole('status')).toContainText('no interpretation required')
    await board.getByRole('button', { name: 'Close the board' }).click()

    // --- the gate opens ---------------------------------------------------
    const endDay = page.getByRole('button', { name: 'End day 01' })
    await expect(endDay).toBeVisible()
    await endDay.click()

    // --- cliffhanger, then the summary -----------------------------------
    await expect(page.getByTestId('surveillance')).toBeVisible()
    await expect(page.locator('.hal-window')).toHaveCount(0)

    const card = page.getByTestId('day-card')
    await expect(card).toBeVisible({ timeout: 15_000 })
    await expect(card).toContainText('DAY 01')
    await expect(card).toContainText('Balance: $717.82')
    await expect(card).toContainText('Quota 01: $10,000.00')
    await expect(card).toContainText('29 days left')
    await expect(card).toContainText('Memory coherence: 91%')
    await expect(card).toContainText('Claims on record: 0')
    await expect(card).toContainText('Someone was watching the last four hours of this.')
    await expect(card).toContainText('$6.99/mo')

    // --- save / auth / entitlement boundary -------------------------------
    await page.getByTestId('continue-timeline').click()
    await expect(page).toHaveURL(/\/account\?claim=.+&day=2/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Keep the 2009 you just made')
    await expect(page.getByRole('link', { name: 'CREATE AN ACCOUNT' })).toBeVisible()
  })

  test('a timeline survives a reload', async ({ page }) => {
    await page.goto('/play')
    await expect(page.getByTestId('desktop')).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('[data-app="msg"]')).toBeVisible({ timeout: 10_000 })

    await openApp(page, 'Recall')
    await page.locator('[data-app="recall"]').getByLabel('What do you remember?').fill('amazon')
    await page.locator('[data-app="recall"]').getByRole('button', { name: 'Recall', exact: true }).click()
    await expect(page.locator('[data-app="recall"]')).toContainText('renting out computers')

    // Give the debounced autosave time to land, then resume from the saved id.
    await page.waitForTimeout(1200)
    await page.goto('/')
    const resume = page.getByRole('button', { name: 'resume your timeline' })
    await expect(resume).toBeVisible()
    await resume.click()

    await expect(page.getByTestId('desktop')).toBeVisible({ timeout: 15_000 })
    await openApp(page, 'Recall')
    await expect(page.locator('[data-app="recall"]')).toContainText('renting out computers')
    await expect(
      page.locator('[data-app="recall"]').getByRole('meter', { name: 'Memory coherence' }),
    ).toHaveAttribute('aria-valuenow', '91')
  })

  test('day 02 is gated server-side, without an account', async ({ page }) => {
    await page.goto('/play/00000000-0000-4000-8000-000000000000?day=2')
    await expect(page).toHaveURL(/\/account\?upgrade=1/)
    await expect(page.getByText(/Day 02 is not written yet|Keep the 2009 you just made/)).toBeVisible()
  })

  test('the gate stays shut until every beat has fired', async ({ page }) => {
    await page.goto('/play')
    await expect(page.getByTestId('desktop')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('button', { name: 'End day 01' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /Day 01 · \d left/ })).toBeVisible()
  })
})
