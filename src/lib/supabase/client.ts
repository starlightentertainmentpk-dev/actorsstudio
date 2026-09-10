import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

function sanitizeEnv(val?: string): string {
  return (val || "").replace(/[^\x20-\x7E]/g, "").trim()
}

export function createClient() {
  const url = sanitizeEnv(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const key = sanitizeEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  return createBrowserClient<Database>(url, key)
}
