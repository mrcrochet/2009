import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from './config'

/** Cookie-based SSR client. Never receives the service-role key. */
export async function createServerSupabase() {
  if (!isSupabaseConfigured()) return null
  const store = await cookies()
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return store.getAll()
      },
      setAll(items) {
        try {
          for (const { name, value, options } of items) store.set(name, value, options)
        } catch {
          // Called from a Server Component: the middleware refreshes the session instead.
        }
      },
    },
  })
}

export interface SessionUser {
  readonly id: string
  readonly email: string | null
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const supabase = await createServerSupabase()
  if (!supabase) return null
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return null
  return { id: data.user.id, email: data.user.email ?? null }
}
