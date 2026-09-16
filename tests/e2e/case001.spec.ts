import { expect, test, type Page } from '@playwright/test'

/**
 * The Case 001 golden path, end to end, exactly as an investigator walks it:
 * landing → open → boot → workstation → sources → the locked handset → the web → the claim →
 * the gate → the report → save/auth/entitlement boundary.
 */

async function openApp(page: Page, label: string) {
  await page.getByRole('navigation', { name: 'Dock' }).getByRole('button', { name: label }).click()
}

test.describe('Case 001', () => {
  test('plays from the front door to the paywall boundary', async ({ page }) => {
    // --- home ------------------------------------------------------------
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Good evening')
    await expect(page.locator('.hero')).toContainText('He never came home')
    // The front door ships no game surface at all.
    await expect(page.getByTestId('desktop')).toHaveCount(0)

    // --- open + boot -----------------------------------------------------
    await page.getByRole('link', { name: /Resume workstation/ }).click()
    await expect(page.getByTestId('boot')).toBeVisible()
    await expect(page.getByTestId('boot')).toContainText('NOVA 3.2 (build 3.2.114)')
    await expect(page.getByTestId('boot')).toContainText('sources: 2 attached · 1 locked')

    // --- the workstation --------------------------------------------------
    await expect(page.getByTestId('desktop')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('group', { name: /menu bar/ })).toContainText('NOVA')
    await expect(page.getByRole('navigation', { name: 'Dock' })).toBeVisible()

    // No SaaS shell anywhere in the playing surface. Anchored positively first, so this cannot
    // pass by virtue of nothing having rendered.
    const dockItems = page.getByRole('navigation', { name: 'Dock' }).getByRole('button')
    // Nine applications this case ships, and the handset it supplies.
    await expect(dockItems).toHaveCount(10)
    await expect(page.locator('.nova-desktop')).toBeVisible()
    // The tray is the only aside, and it stays collapsed until something is pinned.
    await expect(page.locator('aside')).toHaveCount(0)
    await expect(page.getByRole('navigation')).toHaveCount(1)
    await expect(page.locator('body')).not.toContainText(/Dashboard|Overview|Upgrade now/)

    // --- Dispatch opens itself -------------------------------------------
    const messenger = page.locator('[data-app="msg"]')
    await expect(messenger).toBeVisible({ timeout: 10_000 })
    await expect(messenger.getByText(/what was still switched on at 22:51/)).toBeVisible()

    // --- the intake note appears on the desktop --------------------------
    const readmeIcon = page.locator('.nova-icon').filter({ hasText: 'CASE_24-118.txt' })
    await expect(readmeIcon).toBeVisible({ timeout: 10_000 })
    await readmeIcon.click()

    const files = page.locator('[data-app="files"]')
    await expect(files).toBeVisible()
    await expect(files).toContainText('Portland Police are not treating')

    // --- the statement, which is the case ---------------------------------
    await files.getByRole('option', { name: /draft-statement-v3/ }).click()
    await expect(files).toContainText('Oregon Department of Justice')
    await files.getByRole('button', { name: 'PIN AS EVIDENCE' }).click()

    // Pinning opens the tray.
    const tray = page.getByRole('complementary', { name: 'Pinned evidence' })
    await expect(tray).toBeVisible()
    await expect(tray).toContainText('draft-statement-v3.doc')
    await page.getByRole('button', { name: 'Close evidence tray' }).click()

    // --- the client's mail -------------------------------------------------
    await openApp(page, 'Relay Mail')
    const mail = page.locator('[data-app="mail"]')
    await expect(mail).toBeVisible()
    await expect(mail).toContainText('CASE 24-118 assigned')
    await mail.getByRole('option', { name: /everything I have/ }).click()
    await expect(mail).toContainText('The phone was in the kitchen')
    await mail.getByRole('button', { name: 'PIN AS EVIDENCE' }).click()
    await mail.getByLabel('Close Relay Mail').click()

    // --- the sources on the desk, and the one that is locked ---------------
    await openApp(page, 'Devices')
    const devices = page.locator('[data-app="devices"]')
    await expect(devices).toBeVisible()
    const phoneRow = devices.locator('[data-device="dev-phone"]')
    await expect(phoneRow).toHaveAttribute('data-unlocked', 'false')

    // The recovery offer says the money is real, and takes none of it here.
    await expect(devices.locator('[data-service="svc-calls"]')).toContainText(
      'This is a real purchase',
    )

    // The passcode is in the subject's own notes, on the image the client handed over.
    await openApp(page, 'Files')
    await files.getByRole('option', { name: /passcodes\.txt/ }).click()
    await expect(files).toContainText('phone           — 190455')

    await openApp(page, 'Devices')
    await phoneRow.getByLabel('Passcode').fill('190455')
    await phoneRow.getByRole('button', { name: 'OPEN' }).click()
    await expect(phoneRow).toHaveAttribute('data-unlocked', 'true')
    await devices.getByLabel('Close Devices').click()

    // --- the handset is an object on the desk, not a tab -------------------
    await openApp(page, 'NOVA M12')
    const phone = page.getByTestId('phone-overlay')
    await expect(phone).toBeVisible()
    // It opens on its home screen, and it is worked the way a handset is worked: an app, an
    // item inside it, back, home, the next app. There is no tab strip anywhere on it.
    await expect(phone.getByRole('tab')).toHaveCount(0)
    await phone.locator('[data-mobile-app="photos"]').click()
    await phone.getByRole('button', { name: 'IMG_2214.HEIC' }).click()
    await expect(phone).toContainText('IMG_2214.HEIC')
    await phone.locator('[data-evidence="e6"]').click()

    await phone.getByLabel('Back').click()
    await phone.getByLabel('Home screen').click()

    // The missed call is on the home screen as a notification, and reading it takes the player
    // into the call itself rather than into a list.
    await phone.getByRole('button', { name: /Missed call/ }).click()
    await expect(phone).toContainText('09 Jun 21:58')
    await expect(phone).toContainText('no answer')
    await phone.getByLabel('Home screen').click()
    await expect(phone.getByRole('button', { name: /Missed call/ })).toHaveCount(0)

    await phone.locator('[data-mobile-app="messages"]').click()
    // The thread is read backwards, one message at a time, and the line that matters is four
    // messages down.
    await phone.getByRole('button', { name: 'Scroll further back' }).click()
    for (let i = 0; i < 2; i += 1) {
      await phone.getByRole('button', { name: 'Keep reading' }).click()
    }
    await phone.locator('[data-evidence="e5"]').click()

    // What the phone knows about itself: the network it joined in a car park, and when.
    await phone.getByLabel('Home screen').click()
    await phone.locator('[data-mobile-app="settings"]').click()
    await expect(phone).toContainText('FREMONT-LOT-PUBLIC')

    await phone.getByLabel('Put the phone down').click()
    await expect(phone).toHaveCount(0)

    // --- the fictional browser is a browsable web -------------------------
    await openApp(page, 'Orbit')
    const web = page.locator('[data-app="web"]')
    await expect(web).toBeVisible()

    // Reach the statement purely by following links — no search, no typed URL.
    await web.locator('[data-bookmark="kgw-portland.com"]').click()
    await expect(web).toContainText('Local news')
    await web.locator('[data-href="kgw-portland.com/missing-daniel-mercer"]').click()
    await expect(web).toContainText('he last saw Mercer at the office on Sunday 7 June')
    await web.locator('[data-evidence="e4"]').click()

    // Back and forward are a real history stack.
    await web.getByLabel('Back').click()
    await expect(web).toContainText('Local news')
    await web.getByLabel('Forward').click()
    await expect(web).toContainText('he last saw Mercer at the office')

    // A dead address gets an in-world error page, not a crash.
    await web.getByLabel('Address').fill('example.com')
    await web.getByLabel('Address').press('Enter')
    await expect(web.getByTestId('web-404')).toBeVisible()
    await web.getByRole('button', { name: /Browse the Orbit directory/ }).click()
    await expect(web).toContainText('Orbit Directory')
    await web.getByLabel('Close Orbit').click()

    // --- the console, and the filing it opens ------------------------------
    await openApp(page, 'Console')
    const term = page.locator('[data-app="term"]')
    await term.getByLabel(/command/i).fill('decrypt marlow-2013.enc --key reyes')
    await term.getByLabel(/command/i).press('Enter')
    await expect(term).toContainText('6 pages recovered')
    await term.getByLabel('Close Console').click()

    // --- the client, which is the beat the gate wants ----------------------
    await openApp(page, 'Dispatch')
    await messenger.getByRole('tab', { name: 'Claire Mercer' }).click()
    await expect(messenger).toContainText('Are you the one they assigned?')
    await messenger.getByRole('button', { name: 'Tell me about Sunday.' }).click()
    await expect(messenger).toContainText('home by seven', { timeout: 10_000 })

    // --- file a claim ------------------------------------------------------
    const trayPanel = page.getByRole('complementary', { name: 'Pinned evidence' })
    if (!(await trayPanel.isVisible())) await page.getByTestId('evidence-tab').click()
    await expect(trayPanel).toBeVisible()
    await trayPanel.getByRole('button', { name: 'OPEN BOARD' }).click()
    const board = page.getByRole('dialog', { name: 'Investigation board' })
    await expect(board).toBeVisible()

    await board.locator('[data-evidence="e2"]').click()
    await board.locator('[data-evidence="e7"]').click()
    await board.locator('[data-claim="c2"]').click()
    await board.getByRole('button', { name: 'SUBMIT CLAIM' }).click()
    await expect(board.getByRole('status')).toHaveAttribute('data-verdict', 'accepted')
    await board.getByRole('button', { name: 'Close the board' }).click()

    // --- the gate opens ---------------------------------------------------
    const fileReport = page.getByRole('button', { name: 'File the report' })
    await expect(fileReport).toBeVisible()
    await fileReport.click()

    // --- cliffhanger, then the report -------------------------------------
    await expect(page.getByTestId('surveillance')).toBeVisible()
    await expect(page.locator('.nova-window')).toHaveCount(0)

    const card = page.getByTestId('report-card')
    await expect(card).toBeVisible({ timeout: 15_000 })
    await expect(card).toContainText('END OF SESSION')
    await expect(card).toContainText('Case 001 · He Never Came Home')
    await expect(card).toContainText('Claire Mercer')
    await expect(card).toContainText('Somebody opened this case volume from another address')
    await expect(card).toContainText('Case 001 is free')

    // --- save / auth / entitlement boundary -------------------------------
    await page.getByTestId('save-investigation').click()
    await expect(page).toHaveURL(/\/account\?claim=.+/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Keep the investigation you just ran',
    )
    await expect(page.getByRole('link', { name: 'CREATE AN ACCOUNT' })).toBeVisible()
  })

  test('an investigation survives a reload', async ({ page }) => {
    await page.goto('/play')
    await expect(page.getByTestId('desktop')).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('[data-app="msg"]')).toBeVisible({ timeout: 10_000 })

    await openApp(page, 'Devices')
    const phoneRow = page.locator('[data-app="devices"] [data-device="dev-phone"]')
    await phoneRow.getByLabel('Passcode').fill('190455')
    await phoneRow.getByRole('button', { name: 'OPEN' }).click()
    await expect(phoneRow).toHaveAttribute('data-unlocked', 'true')

    // Give the debounced autosave time to land, then resume from the saved id — the same id the
    // front door's held session resumes from.
    await page.waitForTimeout(1200)
    const saved = await page.evaluate(() => localStorage.getItem('unlisted:last-investigation'))
    expect(saved).toBeTruthy()
    await page.goto(`/play/${saved}`)

    await expect(page.getByTestId('desktop')).toBeVisible({ timeout: 15_000 })
    await openApp(page, 'Devices')
    await expect(page.locator('[data-app="devices"] [data-device="dev-phone"]')).toHaveAttribute(
      'data-unlocked',
      'true',
    )
  })

  test('another case is gated server-side, without an account', async ({ page }) => {
    await page.goto('/play/00000000-0000-4000-8000-000000000000?case=case002')
    await expect(page).toHaveURL(/\/account\?upgrade=1/)
    await expect(
      page.getByText(/needs full access|Keep the investigation you just ran/),
    ).toBeVisible()
  })

  test('the gate stays shut until every beat has fired', async ({ page }) => {
    await page.goto('/play')
    await expect(page.getByTestId('desktop')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('button', { name: 'File the report' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /Case 001 — \d things left/ })).toBeVisible()
  })
})
