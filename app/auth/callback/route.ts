import { NextResponse, type NextRequest } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

/** A single leading slash, and not a second one — `//evil.com` is a host, not a path. */
function safeNext(raw: string | null): string {
  if (!raw || !/^\/(?!\/)/.test(raw)) return '/account'
  return raw
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = safeNext(url.searchParams.get('next'))

  if (code) {
    const supabase = await createServerSupabase()
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) return NextResponse.redirect(new URL(next, url.origin))
    }
  }

  return NextResponse.redirect(new URL('/auth/sign-in?error=link', url.origin))
}
