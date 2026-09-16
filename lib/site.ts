/**
 * Where this deployment lives.
 *
 * There was one expression of this, copied into five files: `process.env.NEXT_PUBLIC_SITE_URL ??
 * 'http://localhost:3000'`. `??` falls back on `undefined`, and an environment variable set to an
 * empty string is not `undefined` — so on a deployment where that variable exists and is blank,
 * the fallback never fired, `new URL('')` threw at module evaluation, and Next's page-data pass
 * turned that into `Failed to collect page data for /_not-found`. Not a bad page: a build that
 * does not finish.
 *
 * So this resolves rather than defaults, and it never throws. A blank value is an absent value, a
 * value that will not parse is an absent value, and a deployment that was told nothing works it
 * out from the platform it is running on.
 */

/** The canonical origin, with a scheme and no trailing slash. Never throws. */
export function siteUrl(): string {
  return (
    parse(process.env.NEXT_PUBLIC_SITE_URL) ??
    parse(platformHost()) ??
    'http://localhost:3000'
  )
}

/** The same origin as a `URL`, for `metadataBase`. Never throws. */
export function siteOrigin(): URL {
  return new URL(siteUrl())
}

/**
 * What the platform knows about itself.
 *
 * Production keeps the project's real domain so a shared card never points at a build-specific
 * hostname; a preview points at itself, because that is the copy somebody is looking at. Neither
 * is `NEXT_PUBLIC_`, which is correct — every caller of this is server-side.
 */
function platformHost(): string | undefined {
  const production = process.env.VERCEL_ENV === 'production'
  const host = production
    ? process.env.VERCEL_PROJECT_PRODUCTION_URL
    : (process.env.VERCEL_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL)
  return host
}

function parse(value: string | undefined): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null

  // A value that already names a scheme is taken at its word, and refused unless it is the web.
  // Everything else is a bare hostname — which is the shape `VERCEL_URL` arrives in — and gets
  // the scheme rather than being glued onto one: `https://` + `ftp://x.test` parses, as a host
  // called "ftp", which is the sort of success nobody wants.
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(trimmed)?.[1]?.toLowerCase()
  if (scheme && scheme !== 'http' && scheme !== 'https') return null

  try {
    const url = new URL(scheme ? trimmed : `https://${trimmed}`)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return url.origin
  } catch {
    return null
  }
}
