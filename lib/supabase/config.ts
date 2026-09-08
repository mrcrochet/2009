export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

/**
 * The browser-side key.
 *
 * Supabase has moved from the legacy anon JWT to publishable keys (`sb_publishable_…`). Both are
 * safe to ship to the browser and both are read here, newest first, so an existing deployment
 * carrying the old variable keeps working. Neither is a secret: row-level security is the actual
 * boundary, which is why `supabase/migrations/` is where the access rules live.
 */
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  ''

/** The game is fully playable without Supabase. Everything cloud-shaped degrades to local-only. */
export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY)
}
