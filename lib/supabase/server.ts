import "server-only"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { runtimeEnv } from "@/lib/runtime-env"

export function createAdminClient(): SupabaseClient | null {
  const url = runtimeEnv("NEXT_PUBLIC_SUPABASE_URL")
  const key = runtimeEnv("SUPABASE_SERVICE_ROLE_KEY")
  if (!url || !key) return null
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export function createAnonServerClient(): SupabaseClient | null {
  const url = runtimeEnv("NEXT_PUBLIC_SUPABASE_URL")
  const key = runtimeEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  if (!url || !key) return null
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
