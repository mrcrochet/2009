import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL } from './config'

/**
 * Service-role client. Server-only, used exclusively by the Stripe webhook, which has no user
 * session to act on behalf of.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!SUPABASE_URL || !key) return null
  return createClient(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
