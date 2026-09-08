import { NextResponse, type NextRequest } from 'next/server'
import { CSP_HEADER, contentSecurityPolicy } from '@/lib/security/headers'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const csp = contentSecurityPolicy(nonce, process.env.NODE_ENV === 'development')

  // Both of these are what the App Router reads to stamp the nonce onto its own scripts. They
  // are set even while the policy is Report-Only, so enforcing it later is a one-line change.
  request.headers.set('x-nonce', nonce)
  request.headers.set('content-security-policy', csp)

  const response = await updateSession(request)
  response.headers.set(CSP_HEADER, csp)
  return response
}

export const config = {
  matcher: [
    // The Stripe webhook has no session to refresh and is retry-sensitive, so it is excluded
    // rather than made to wait on an auth round-trip per delivery.
    '/((?!_next/static|_next/image|favicon.ico|api/billing/webhook|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)',
  ],
}
