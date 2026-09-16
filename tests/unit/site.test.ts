import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { siteOrigin, siteUrl } from '@/lib/site'

/**
 * Where this deployment thinks it lives.
 *
 * This exists because of one character. `process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost'`
 * falls back on `undefined`, and a platform variable that exists and is blank is not `undefined`
 * — so on every deployment of this project the fallback never fired, `new URL('')` threw while
 * the metadata object was being built, and the build failed at page-data collection with a
 * message about `/_not-found` that named neither the variable nor the file.
 *
 * Eighteen deployments, every one of them red, for that.
 */

const KEYS = [
  'NEXT_PUBLIC_SITE_URL',
  'VERCEL_ENV',
  'VERCEL_URL',
  'VERCEL_PROJECT_PRODUCTION_URL',
] as const

let saved: Record<string, string | undefined> = {}

beforeEach(() => {
  saved = Object.fromEntries(KEYS.map((key) => [key, process.env[key]]))
  for (const key of KEYS) delete process.env[key]
})

afterEach(() => {
  for (const key of KEYS) {
    if (saved[key] === undefined) delete process.env[key]
    else process.env[key] = saved[key]
  }
})

describe('the site URL', () => {
  it('takes what it is told', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://unlisted.example/'
    expect(siteUrl()).toBe('https://unlisted.example')
  })

  /** The bug, held open. A variable that is present and blank is a variable that says nothing. */
  it('treats blank as absent rather than as a URL', () => {
    for (const blank of ['', '   ', '\n']) {
      process.env.NEXT_PUBLIC_SITE_URL = blank
      expect(siteUrl()).toBe('http://localhost:3000')
      expect(() => siteOrigin()).not.toThrow()
    }
  })

  it('never throws on something that will not parse', () => {
    for (const junk of ['not a url', 'http://', '://nope', 'javascript:alert(1)', 'ftp://x.test']) {
      process.env.NEXT_PUBLIC_SITE_URL = junk
      expect(() => siteOrigin()).not.toThrow()
      expect(siteUrl()).toBe('http://localhost:3000')
    }
  })

  it('works out a deployment it was told nothing about', () => {
    process.env.VERCEL_ENV = 'preview'
    // The platform gives a bare hostname, so the scheme is ours to add.
    process.env.VERCEL_URL = '2009-abc123-mrcrochets-projects.vercel.app'
    process.env.VERCEL_PROJECT_PRODUCTION_URL = 'unlisted.example'
    expect(siteUrl()).toBe('https://2009-abc123-mrcrochets-projects.vercel.app')

    // Production keeps the real domain: a shared card must not point at one build's hostname.
    process.env.VERCEL_ENV = 'production'
    expect(siteUrl()).toBe('https://unlisted.example')
  })

  it('prefers what it was told over what it can work out', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://unlisted.example'
    process.env.VERCEL_ENV = 'preview'
    process.env.VERCEL_URL = '2009-abc123.vercel.app'
    expect(siteUrl()).toBe('https://unlisted.example')
  })

  it('hands metadataBase a URL it can always build', () => {
    expect(siteOrigin()).toBeInstanceOf(URL)
    expect(siteOrigin().origin).toBe('http://localhost:3000')
  })
})
