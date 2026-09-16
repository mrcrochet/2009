import { expect, test, type Page } from '@playwright/test'

/**
 * The surfaces a document actually arrives on.
 *
 * These are end-to-end rather than only component tests because all three depend on wiring that
 * a mounted component is happy without: the lazy chunk for an application the case declares, the
 * event reaching the store, the overlay finding the desktop to go inert. A `<DocumentView>` test
 * passes with the Photos app unregistered and Quick Look never rendered.
 */

async function boot(page: Page) {
  await page.goto('/play')
  await expect(page.getByTestId('desktop')).toBeVisible({ timeout: 20_000 })
  // Dispatch opens itself a beat into the session and comes to the front when it does. Anything
  // opened before that arrives ends up underneath it, which is a lost click rather than a bug.
  await expect(page.locator('[data-app="msg"]')).toBeVisible({ timeout: 20_000 })
  await expect(page.getByText('loading…')).toHaveCount(0, { timeout: 20_000 })
}

async function openApp(page: Page, label: string) {
  await page.getByRole('navigation', { name: 'Dock' }).getByRole('button', { name: label }).click()
  await expect(page.getByText('loading…')).toHaveCount(0, { timeout: 20_000 })
}

/** The passcode is written down in a file, the way everybody writes them down. */
async function openTheHandset(page: Page) {
  await openApp(page, 'Devices')
  const row = page.locator('[data-app="devices"] [data-device="dev-phone"]')
  await row.getByLabel('Passcode').fill('190455')
  await row.getByRole('button', { name: 'OPEN' }).click()
  await expect(row).toHaveAttribute('data-unlocked', 'true')
}

test.describe('documents look like what they are', () => {
  test('a spreadsheet is a spreadsheet, and a recording can be played', async ({ page }) => {
    await boot(page)
    await openApp(page, 'Files')
    const files = page.locator('[data-app="files"]')

    await files.getByRole('option', { name: /grant-disbursements-2013\.csv/ }).click()
    const table = files.getByRole('table')
    await expect(table).toBeVisible()
    // Grouped here, and never grouped by this machine's locale.
    await expect(table).toContainText('412,000')
    // The comment somebody left in a cell, in the margin where a spreadsheet puts it.
    await expect(files.getByText('D1')).toBeVisible()

    await files.getByRole('option', { name: /voicemail-0610\.m4a/ }).click()
    // The transcript is legible before anything is pressed.
    await expect(files.getByText('I am not going to keep doing this by message.')).toBeVisible()
    await files.getByRole('button', { name: /play the recording/i }).click()
    await expect(files.getByRole('button', { name: /pause the recording/i })).toBeVisible()
  })

  test('Space holds a document up over the machine, and Escape puts it down', async ({ page }) => {
    await boot(page)
    await openApp(page, 'Files')
    const files = page.locator('[data-app="files"]')

    await files.getByRole('option', { name: /receipt-fremont-0609\.pdf/ }).focus()
    await page.keyboard.press(' ')

    const quickLook = page.getByTestId('quick-look')
    await expect(quickLook).toBeVisible()
    await expect(quickLook.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
    await expect(quickLook).toContainText('FREMONT STREET PARKING')

    await page.keyboard.press('Escape')
    await expect(quickLook).toHaveCount(0)
  })
})

test.describe('the photo viewer', () => {
  test('holds nothing until the source is open, then holds what was extracted', async ({
    page,
  }) => {
    await boot(page)
    await openApp(page, 'Photos')
    const photos = page.locator('[data-app="photos"]')
    await expect(photos).toContainText('Nothing has been extracted')

    await openTheHandset(page)
    await openApp(page, 'Photos')

    await expect(photos.getByRole('option')).toHaveCount(3)
    await expect(photos).toContainText("Daniel's NOVA M12")
    // The line that makes the frame worth having: there is no location on it, and never was.
    await expect(photos).toContainText('No GPS block')

    // A listbox that claims the role has to answer the arrow keys.
    await photos.getByRole('option').first().focus()
    await page.keyboard.press('ArrowRight')
    await expect(photos.getByRole('option').nth(1)).toHaveAttribute('aria-selected', 'true')
  })
})

test.describe('the handset', () => {
  /**
   * A phone, not a panel: it comes up on its own lock screen, it takes a passcode on its own
   * keypad, and the thread it is hiding stays hidden until somebody opens it.
   */
  test('takes its passcode on its own keypad, and opens on a home screen', async ({ page }) => {
    await boot(page)
    await page
      .getByRole('navigation', { name: 'Dock' })
      .getByRole('button', { name: /NOVA M12/ })
      .click()

    const phone = page.getByTestId('phone-overlay')
    await expect(phone).toBeVisible()
    await expect(phone).toContainText('Enter Passcode')
    // The notifications are on the glass; what they are about is not.
    await expect(phone).toContainText('Missed call')
    await expect(phone).not.toContainText('(503) 555-0197')
    await expect(phone.getByRole('tablist')).toHaveCount(0)

    // Wrong first, because a keypad that accepts anything is not a lock.
    for (const d of ['1', '1', '1', '1', '1', '1']) {
      await phone.getByRole('button', { name: d, exact: true }).click()
    }
    await expect(phone).toContainText('Wrong passcode')

    for (const d of ['1', '9', '0', '4', '5', '5']) {
      await phone.getByRole('button', { name: d, exact: true }).click()
    }

    // The home screen, and the same device the Devices app was holding shut.
    await expect(phone.locator('[data-mobile-app="messages"]')).toBeVisible()
    await expect(phone).not.toContainText('Enter Passcode')
    await openApp(page, 'Devices')
    await expect(page.locator('[data-app="devices"] [data-device="dev-phone"]')).toHaveAttribute(
      'data-unlocked',
      'true',
    )
  })
})
