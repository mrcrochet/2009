import { expect, test, type Page } from '@playwright/test'

/**
 * The world graph as a player meets it: one search across the whole machine, and a directory
 * that only holds what has actually been read.
 *
 * These are here rather than only in unit tests because both surfaces depend on the world being
 * wired through the running app — index built, discovery derived, provider supplied. A component
 * test passes happily with all three broken.
 */

async function boot(page: Page) {
  await page.goto('/play')
  await expect(page.getByTestId('desktop')).toBeVisible({ timeout: 20_000 })
}

async function openApp(page: Page, label: string) {
  await page.getByRole('navigation', { name: 'Dock' }).getByRole('button', { name: label }).click()
}

test.describe('the world', () => {
  test('one search reaches every surface at once', async ({ page }) => {
    await boot(page)

    await page.keyboard.press('Control+k')
    const search = page.getByRole('dialog', { name: 'Search HALCYON' })
    await expect(search).toBeVisible()

    // Ctrl+K is one gesture; typing has to be the next one, with nothing in between.
    await page.keyboard.type('marc')

    const filters = search.getByRole('group', { name: 'Filter by source' })
    // The counts are the point: before opening anything the player is told the world is larger
    // than the question they asked.
    await expect(filters.getByRole('button', { name: /^All/ })).not.toHaveText(/All\s*0$/)
    for (const surface of ['Mail', 'Phone', 'Web']) {
      await expect(filters.getByRole('button', { name: new RegExp(`^${surface}`) })).toBeEnabled()
    }

    const hits = search.getByRole('option')
    await expect(hits.first()).toBeVisible()
    // A day is an event in the world, not a world of its own: the corpus and the 15th of
    // January answer the same question together.
    await expect(search.getByRole('listbox', { name: 'Results' })).toContainText('Nokora N90')

    // Dates are stored ISO so they sort, and never shown that way.
    await expect(search.getByRole('listbox', { name: 'Results' })).not.toContainText(/\d{4}-\d{2}/)

    // Arrows move the selection; the field keeps the caret.
    await page.keyboard.press('ArrowDown')
    await expect(hits.nth(1)).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByLabel('Find:')).toBeFocused()

    await page.keyboard.press('Escape')
    await expect(search).toBeHidden()
  })

  test('the directory holds what has been read, and nothing else', async ({ page }) => {
    await boot(page)
    await openApp(page, 'Directory')

    const list = page.getByRole('listbox', { name: 'Directory' })
    await expect(list).toBeVisible()

    const names = await list.getByRole('option').allTextContents()
    // A cast list of the whole season on the first morning would be the story handed over.
    expect(names.length).toBeGreaterThan(0)
    expect(names.length).toBeLessThan(10)

    const marc = list.getByRole('option', { name: 'Marc Deleon' })
    await expect(marc).toBeVisible()
    await marc.click()

    const page_ = page.locator('.hal-dir__page')
    // The gap is a number and never a list.
    await expect(page_).toContainText(/\d+ found · \d+ not yet found/)
    await expect(page_).toContainText('First appears 15 Jan 2009')

    // Nothing has been read that names Marc and anyone else together, so the machine says so
    // rather than reciting the chain the player is meant to build.
    await expect(page_.getByText('No connection recorded.')).toBeVisible()
  })

  test('reading something is finding it', async ({ page }) => {
    await boot(page)

    await openApp(page, 'Directory')
    const before = await page
      .getByRole('listbox', { name: 'Directory' })
      .getByRole('option')
      .count()

    // Read the whole inbox, then come back.
    await openApp(page, 'Mail')
    const inbox = page.getByRole('listbox', { name: 'Inbox' })
    // The app is code-split, so the window frame arrives before the list does.
    await expect(inbox).toBeVisible()
    const mails = inbox.getByRole('option')
    await expect(mails.first()).toBeVisible()
    const count = await mails.count()
    expect(count).toBeGreaterThan(1)
    for (let i = 0; i < count; i += 1) await mails.nth(i).click()

    await openApp(page, 'Directory')
    const after = await page.getByRole('listbox', { name: 'Directory' }).getByRole('option').count()
    // Reading the inbox introduces names the machine did not hold at wake.
    expect(after).toBeGreaterThan(before)

    // And the search now admits it holds them.
    await page.keyboard.press('Control+k')
    await page.keyboard.type('aion')
    const search = page.getByRole('dialog', { name: 'Search HALCYON' })
    await search.getByLabel('Only what I have found').check()
    await expect(search.getByRole('option').first()).toBeVisible()
  })
})
