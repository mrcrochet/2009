import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, isSupabaseConfigured } from './config'

/** Refreshes the auth cookie on every request so Server Components see a live session. */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  // Passing `request` forward carries the headers middleware set on it — the CSP nonce included.
  let response = NextResponse.next({ request })
  if (!isSupabaseConfigured()) return response

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(items) {
        for (const { name, value } of items) request.cookies.set(name, value)
        response = NextResponse.next({ request })
        for (const { name, value, options } of items) response.cookies.set(name, value, options)
      },
    },
  })

  await supabase.auth.getUser()
  return response
}
