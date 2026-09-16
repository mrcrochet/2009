import { expect, test } from '@playwright/test'

/**
 * Home — the front door.
 *
 * Three things a component test cannot see: that the shelf is what `/` serves, that the root
 * ships no game bundle, and that the product's shell stops at the workstation door — a SaaS
 * chrome wrapped around an investigation is the one shape this product is not allowed to take.
 */
test.describe('home', () => {
  test('renders the reference: sidebar, continue row, rails, session bar', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Good evening')

    await expect(page.locator('.side .nav')).toHaveCount(3)
    await expect(page.locator('.continue .poster')).toHaveCount(2)
    await expect(page.locator('.rail')).toHaveCount(4)
    await expect(page.locator('.spine')).toHaveCount(5)
    await expect(page.locator('.bar')).toBeVisible()
    await expect(page.locator('.bar .st')).toHaveText('2h 14m · NOVA session held')
    // The front door ships no game surface at all.
    await expect(page.getByTestId('desktop')).toHaveCount(0)

    // The progress fill draws: the reference reused the white token for its width.
    const fill = page.locator('.continue .poster .prog i').first()
    await expect(fill).toHaveCSS('width', /\d/)
  })

  test('the case brief opens and closes', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Case brief' }).click()

    const brief = page.locator('#brief')
    await expect(brief).toBeVisible()
    await expect(brief).toContainText('Closed by')
    await expect(brief).toContainText('1,120 investigators')

    await page.keyboard.press('Escape')
    await expect(brief).toBeHidden()
  })

  test('reaches everything that exists', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('link', { name: /Resume workstation/ })).toHaveAttribute(
      'href',
      '/play',
    )
    for (const name of ['Profile', 'Subscription', 'Manage']) {
      await expect(page.getByRole('link', { name })).toHaveAttribute('href', '/account')
    }
    await expect(page.getByRole('link', { name: 'Unlisted' })).toHaveAttribute('href', '/')
  })

  test('the shell stops at the workstation door', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.unlisted')).toHaveCount(1)

    await page.goto('/play')
    await expect(page.getByTestId('desktop')).toBeVisible({ timeout: 20_000 })
    await expect(page.locator('.unlisted')).toHaveCount(0)
    await expect(page.locator('.bar')).toHaveCount(0)
    await expect(page.getByRole('navigation', { name: 'Dock' })).toBeVisible()
  })
})
