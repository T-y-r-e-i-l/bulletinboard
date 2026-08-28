import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { randomUUID } from "node:crypto"
import { MEDIA_BUCKET } from "@/lib/constants"
import { usesSupabaseAdmin, assertStoreConfigured } from "@/lib/flags"
import { createAdminClient } from "@/lib/supabase/server"

export async function saveMedia(file: File, kind: "image" | "video" | "audio") {
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin"
  const filename = `${kind}/${randomUUID()}.${ext}`
  const bytes = Buffer.from(await file.arrayBuffer())

  if (usesSupabaseAdmin()) {
    const admin = createAdminClient()!
    const { error } = await admin.storage.from(MEDIA_BUCKET).upload(filename, bytes, {
      contentType: file.type,
      upsert: false,
    })
    if (error) throw error
    const { data } = admin.storage.from(MEDIA_BUCKET).getPublicUrl(filename)
    return data.publicUrl
  }

  assertStoreConfigured()
  const dest = path.join(process.cwd(), ".data", "uploads", filename)
  await mkdir(path.dirname(dest), { recursive: true })
  await writeFile(dest, bytes)
  return `/api/media/${filename}`
}
