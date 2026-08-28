import "server-only"
import { runtimeEnv } from "@/lib/runtime-env"

export function usesSupabaseAdmin() {
  return Boolean(runtimeEnv("NEXT_PUBLIC_SUPABASE_URL") && runtimeEnv("SUPABASE_SERVICE_ROLE_KEY"))
}

/** Local JSON store is for `next dev` only. Vercel’s filesystem is read-only. */
export function assertStoreConfigured() {
  if (usesSupabaseAdmin()) return
  if (runtimeEnv("VERCEL")) {
    throw new Error(
      "Supabase is not configured on this deployment. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, then redeploy.",
    )
  }
}
