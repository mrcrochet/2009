import { expect, test, type Page } from '@playwright/test'

/**
 * The Way Up Machine, walked the way a player reaches it: from a command line, through a process
 * that refuses until it is given the one argument three pages never say together.
 *
 * The unit tests mock the transport, so they prove the console is honest about answers it is
 * handed. Only this proves the chain exists at all — terminal to reducer to console — and it is
 * the chain that was unreachable: everything behind it shipped tested and nothing rendered it.
 *
 * There is no `FIRECRAWL_API_KEY` in CI, so the far end has no index and answers 503. That is not
 * a degraded run of this test; it is the honest end state of the feature on this deployment, and
 * the screen a player gets is the one being asserted.
 */

async function boot(page: Page) {
  await page.goto('/play')
  await expect(page.getByTestId('desktop')).toBeVisible({ timeout: 20_000 })
  await expect(page.getByText('loading…')).toHaveCount(0, { timeout: 20_000 })
}

async function run(page: Page, command: string) {
  const input = page.getByLabel('Terminal command')
  await input.click()
  await input.fill(command)
  await input.press('Enter')
}

test.describe('the relay', () => {
  test('qlmux refuses, then attaches, and the console has no carrier', async ({ page }) => {
    await boot(page)
    await page
      .getByRole('navigation', { name: 'Dock' })
      .getByRole('button', { name: 'Terminal' })
      .click()

    const log = page.getByRole('log')
    await expect(log).toBeVisible()

    // Run bare, the process admits nothing except that it is a process.
    await run(page, 'qlmux')
    await expect(log).toContainText('qlmux: listener not attached.')
    await expect(log).toContainText('nine registered. none reachable from this side.')
    await expect(page.getByTestId('wayup')).toHaveCount(0)

    // The argument is the whole puzzle. Nothing announces that it worked; the machine simply
    // stops refusing, and the screen is taken.
    await run(page, 'qlmux --attach blackbird-hosting.net')
    await expect(log).toContainText('carrier present.')

    const console_ = page.getByRole('dialog', { name: 'qlmux — attached' })
    await expect(console_).toBeVisible()
    // Focus moves into the console, on the one field it has.
    await expect(page.getByLabel('send:')).toBeFocused()
    await expect(console_).toContainText('signal 24 of 24')

    await page.getByLabel('send:').fill('aion group settlements')
    await console_.getByRole('button', { name: 'TRANSMIT' }).click()

    // No index on this side of the line, and the console says so in its own words rather than
    // showing the route's message or a failed request.
    await expect(console_.getByText('no carrier')).toBeVisible()
    await expect(console_).toContainText('There is no index on this side of the line')
    await expect(console_).not.toContainText('the relay has no index on this side')
    // Nothing on the screen could have spent the day's signal.
    await expect(console_).toContainText('signal 24 of 24')

    // Escape leaves the mode and hands the command line back — which is the only place in this
    // application a player can type.
    await page.keyboard.press('Escape')
    await expect(console_).toBeHidden()
    await expect(page.getByLabel('Terminal command')).toBeFocused()
  })
})
