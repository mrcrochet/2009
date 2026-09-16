import { expect, test, type Page } from '@playwright/test'

/**
 * The relay, walked the way a player reaches it: from a command line, through a process
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
  test('the relay refuses, then attaches, and the console has no route', async ({ page }) => {
    await boot(page)
    await page
      .getByRole('navigation', { name: 'Dock' })
      .getByRole('button', { name: 'Console' })
      .click()

    const log = page.getByRole('log')
    await expect(log).toBeVisible()

    // Run bare, the process admits nothing except that it is a process.
    await run(page, 'relay')
    await expect(log).toContainText('relay: no outbound route on this session.')
    await expect(log).toContainText('does not reach the open web by default')
    await expect(page.getByTestId('relay')).toHaveCount(0)

    // The argument is the whole puzzle. Nothing announces that it worked; the machine simply
    // stops refusing, and the screen is taken.
    await run(page, 'relay open the line')
    await expect(log).toContainText('route opened. metered.')

    // A window, not a mode: the dock now carries it, and the desk behind it is still there.
    const console_ = page.locator('[data-app="relay"]')
    await expect(console_).toBeVisible()
    await expect(page.locator('.nova-dockitem[data-dock="relay"]')).toBeVisible()
    await expect(page.getByLabel('ask:')).toBeFocused()
    await expect(console_).toContainText('lookups 40 of 40')

    await page.getByLabel('ask:').fill('marlow foundation 2013 filing')
    await console_.getByRole('button', { name: 'SEND' }).click()

    // No index on this side of the line, and the console says so in its own words rather than
    // showing the route's message or a failed request.
    await expect(console_.getByText('no route')).toBeVisible()
    await expect(console_).toContainText('There is no index on this side of the route')
    await expect(console_).not.toContainText('the relay has no index on this side')
    // Nothing on the screen could have spent the case's signal.
    await expect(console_).toContainText('lookups 40 of 40')

    // Nothing has come back through the route, and the captures list says so in the case's words.
    await console_.getByRole('button', { name: /brought back/ }).click()
    await expect(console_).toContainText('Nothing has come back through this route yet')

    // It closes like a window, and the desk it was sitting on is still underneath.
    await console_.getByLabel('Close Relay').click()
    await expect(console_).toHaveCount(0)
    await expect(page.locator('[data-app="term"]')).toBeVisible()
  })

  /**
   * The route is an application with something running behind it.
   *
   * A capability nothing is carrying is a capability nobody can take away, so this is the whole
   * point of the machine having a process table: a player can look at what is running, decide
   * they do not want one of it, and be right — the window goes, the dock entry goes, and asking
   * again does not quietly start it back up.
   */
  test('a player can close their own route, and the machine lets them', async ({ page }) => {
    await boot(page)
    await page
      .getByRole('navigation', { name: 'Dock' })
      .getByRole('button', { name: 'Console' })
      .click()

    await run(page, 'relay open the line')
    await expect(page.locator('[data-app="relay"]')).toBeVisible()
    await expect(page.locator('.nova-dockitem[data-dock="relay"]')).toBeVisible()

    // The relay took the front when it opened, so the console has to be raised to type into it —
    // which is what a player does too.
    const console_ = () =>
      page.getByRole('navigation', { name: 'Dock' }).getByRole('button', { name: 'Console' })

    // It is on the table, under its own name, next to everything else the machine is running.
    await console_().click()
    await run(page, 'ps')
    await expect(page.getByRole('log')).toContainText('relayd --route open --metered')

    // The machine refuses its own, and does not refuse this.
    await console_().click()
    await run(page, 'kill 118')
    await expect(page.getByRole('log')).toContainText('operation not permitted')
    await run(page, 'kill 604')
    await expect(page.getByRole('log')).toContainText('route closed')

    await expect(page.locator('[data-app="relay"]')).toHaveCount(0)
    await expect(page.locator('.nova-dockitem[data-dock="relay"]')).toHaveCount(0)

    await run(page, 'relay open the line')
    await expect(page.getByRole('log')).toContainText('it does not come back from here')
    await expect(page.locator('[data-app="relay"]')).toHaveCount(0)
  })
})
