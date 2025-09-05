import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'

/**
 * Create a Supabase client for use in client-side components.
 * This client automatically handles cookie-based session management.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
