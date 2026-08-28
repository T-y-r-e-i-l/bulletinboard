import "server-only"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export function usesSupabaseAdmin() {
  return Boolean(supabaseUrl && serviceRoleKey)
}

/** Local JSON store is for `next dev` only. Vercel’s filesystem is read-only. */
export function assertStoreConfigured() {
  if (usesSupabaseAdmin()) return
  if (process.env.VERCEL) {
    throw new Error(
      "Supabase is not configured on this deployment. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, then redeploy.",
    )
  }
}
