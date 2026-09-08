import { expect, test } from '@playwright/test'

/**
 * The headers are only worth having if the app still works under them. This asserts both, and
 * fails loudly if a policy is ever enforced that the page cannot actually live with.
 */
test.describe('security headers', () => {
  test('the enforced headers are present and the game runs under them', async ({ page }) => {
    const blocked: string[] = []
    page.on('console', (m) => {
      if (m.type() === 'error' && /Content Security Policy|Refused to/i.test(m.text())) {
        blocked.push(m.text())
      }
    })

    const response = await page.goto('/')
    const headers = response!.headers()

    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['x-frame-options']).toBe('DENY')
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
    expect(headers['cross-origin-opener-policy']).toBe('same-origin')
    expect(headers['permissions-policy']).toContain('geolocation=()')
    // Nothing should be advertising the framework version.
    expect(headers['x-powered-by']).toBeUndefined()

    // The policy is present, carries a fresh nonce, and never falls back to unsafe-inline
    // scripts — the failure mode that would make it decorative.
    const policy =
      headers['content-security-policy'] ?? headers['content-security-policy-report-only']
    expect(policy).toBeDefined()
    expect(policy).toMatch(/script-src [^;]*'nonce-/)
    expect(policy).not.toMatch(/script-src [^;]*'unsafe-inline'/)
    expect(policy).toContain("frame-ancestors 'none'")
    expect(policy).toContain("object-src 'none'")
    expect(policy).toContain("base-uri 'self'")

    // Whatever mode it is in, the game has to survive it.
    await page.getByRole('link', { name: 'WAKE UP' }).click()
    await expect(page.getByTestId('desktop')).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('[data-app="msg"]')).toBeVisible({ timeout: 10_000 })

    // Report-Only never blocks; enforcing must not either.
    if (headers['content-security-policy']) {
      expect(blocked, blocked.join('\n')).toEqual([])
    }
  })

  test('a fresh nonce per request', async ({ page }) => {
    const read = async () => {
      const r = await page.goto('/')
      const h = r!.headers()
      return h['content-security-policy'] ?? h['content-security-policy-report-only'] ?? ''
    }
    const first = /'nonce-([^']+)'/.exec(await read())?.[1]
    const second = /'nonce-([^']+)'/.exec(await read())?.[1]
    expect(first).toBeTruthy()
    expect(second).not.toBe(first)
  })

  test('the marketing surfaces exist', async ({ page }) => {
    const og = await page.goto('/opengraph-image')
    expect(og?.status()).toBe(200)
    expect(og?.headers()['content-type']).toContain('image/png')

    const robots = await page.goto('/robots.txt')
    expect(await robots!.text()).toContain('Disallow: /play')

    await page.goto('/nothing-here')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('nothing at this address')
  })
})
