import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

function sanitizeEnv(val?: string): string {
  return (val || "").replace(/[^\x20-\x7E]/g, "").trim()
}

export const adminClient = createClient<Database>(
  sanitizeEnv(process.env.NEXT_PUBLIC_SUPABASE_URL),
  sanitizeEnv(process.env.SUPABASE_SERVICE_ROLE_KEY)
)
