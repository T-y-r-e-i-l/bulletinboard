import { NextResponse } from "next/server"
import {
  ALLOWED_AUDIO_TYPES,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  MAX_IMAGE_BYTES,
  MAX_MEDIA_BYTES,
} from "@/lib/constants"
import { getBoard } from "@/lib/db"
import { getClientIp, identityFromIp } from "@/lib/identity"
import { saveMedia } from "@/lib/media"
import { rateLimit } from "@/lib/rate-limit"
import type { ItemType } from "@/lib/types"

export async function POST(request: Request) {
  const ip = getClientIp(request.headers)
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: "Slow down a little." }, { status: 429 })
  }
  identityFromIp(ip)
  const form = await request.formData()
  const file = form.get("file")
  const boardId = String(form.get("boardId") || "")
  const kind = String(form.get("kind") || "") as ItemType
  if (!(file instanceof File) || !boardId) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 })
  }
  const board = await getBoard(boardId)
  if (!board || board.archived_at) {
    return NextResponse.json({ error: "Board unavailable" }, { status: 403 })
  }

  let allowed: string[] = []
  let max = MAX_MEDIA_BYTES
  if (kind === "image") {
    allowed = ALLOWED_IMAGE_TYPES
    max = MAX_IMAGE_BYTES
  } else if (kind === "video") {
    allowed = ALLOWED_VIDEO_TYPES
  } else if (kind === "audio") {
    allowed = ALLOWED_AUDIO_TYPES
  } else {
    return NextResponse.json({ error: "Unsupported kind" }, { status: 400 })
  }
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "That file type is not allowed." }, { status: 400 })
  }
  if (file.size > max) {
    return NextResponse.json({ error: "That file is too large." }, { status: 400 })
  }

  const url = await saveMedia(file, kind)
  return NextResponse.json({ url, name: file.name })
}
