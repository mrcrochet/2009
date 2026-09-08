/**
 * Response security headers.
 *
 * **The CSP ships Report-Only, on purpose.** The policy below is nonce-based, and the nonce is
 * set on the request exactly as the App Router documents — but Next 16 with Turbopack does not
 * stamp it onto its own inline bootstrap scripts, so enforcing this policy leaves the page
 * unhydrated. Verified: `tests/e2e/security.spec.ts` asserts the app works *and* that the policy
 * is present, and it is written so that the day the nonce lands, flipping `CSP_ENFORCED` to true
 * is the whole change.
 *
 * The alternative — enforcing with `'unsafe-inline'` — would look like a CSP in a header
 * inspector while permitting exactly the injected inline script a CSP exists to stop. Report-Only
 * is the honest position: it collects violations today and enforces the moment it can.
 *
 * `style-src` keeps `unsafe-inline` deliberately and it is not a weakening: the game sets colours
 * and window geometry through React's `style` prop, and Next's font loader emits an inline
 * stylesheet. Neither is attacker-controlled — authored colours are constrained to hex by
 * `engine/content-schema.ts` — and CSSOM assignment is outside CSP's reach anyway.
 */

/** Flip to true once Next applies the request nonce to its inline bootstrap scripts. */
export const CSP_ENFORCED = false

export const CSP_HEADER = CSP_ENFORCED
  ? 'content-security-policy'
  : 'content-security-policy-report-only'

function connectSources(): string[] {
  const sources = ["'self'"]
  const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (supabase) {
    sources.push(supabase)
    // Supabase Realtime and Auth use the same host over websockets.
    sources.push(supabase.replace(/^https:/, 'wss:'))
  }
  if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    sources.push(process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com')
  }
  return sources
}

export function contentSecurityPolicy(nonce: string, isDev: boolean): string {
  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,

    // The dev overlay and Fast Refresh are compiled with eval.
    ...(isDev ? ["'unsafe-eval'"] : []),
  ]

  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(' ')}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob:",
    "media-src 'none'",
    `connect-src ${connectSources().join(' ')}`,
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "manifest-src 'self'",
    ...(isDev ? [] : ['upgrade-insecure-requests']),
  ].join('; ')
}

/** Headers that never vary by request, so they can be served from the config. */
export const STATIC_SECURITY_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  {
    key: 'Permissions-Policy',
    // The game asks for none of these, and saying so out loud is cheap.
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
]
