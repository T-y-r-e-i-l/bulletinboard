import { NextResponse } from "next/server"
import { bus } from "@/lib/bus"
import { deleteItem, getBoard, getItem, updateItem } from "@/lib/db"
import { clampItem, sanitizeText } from "@/lib/geometry"
import { getClientIp, identityFromIp } from "@/lib/identity"
import { rateLimit } from "@/lib/rate-limit"

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Params) {
  const ip = getClientIp(request.headers)
  const { id } = await params
  const existing = await getItem(id)
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const board = await getBoard(existing.board_id)
  if (board?.archived_at) {
    return NextResponse.json({ error: "This day is archived." }, { status: 403 })
  }

  const body = (await request.json()) as Record<string, unknown>
  const recordEvent = body.recordEvent !== false
  if (recordEvent && !rateLimit(ip)) {
    return NextResponse.json({ error: "Slow down a little." }, { status: 429 })
  }
  const patch: Record<string, unknown> = {}
  if (typeof body.x === "number") patch.x = body.x
  if (typeof body.y === "number") patch.y = body.y
  if (typeof body.width === "number") patch.width = body.width
  if (typeof body.height === "number") patch.height = body.height
  if (typeof body.z_index === "number") patch.z_index = body.z_index
  if (body.payload && typeof body.payload === "object") {
    const nextPayload = { ...existing.payload, ...(body.payload as Record<string, unknown>) }
    if (typeof nextPayload.content === "string") {
      nextPayload.content = sanitizeText(nextPayload.content)
    }
    patch.payload = nextPayload
  }
  if ("x" in patch || "y" in patch || "width" in patch || "height" in patch) {
    const box = clampItem({
      x: (patch.x as number | undefined) ?? existing.x,
      y: (patch.y as number | undefined) ?? existing.y,
      width: (patch.width as number | undefined) ?? existing.width,
      height: (patch.height as number | undefined) ?? existing.height,
    })
    Object.assign(patch, box)
  }

  const saved = await updateItem(id, patch, identityFromIp(ip).name, recordEvent)
  if (saved) bus.emit("item", { kind: "update", item: saved, boardId: saved.board_id })
  return NextResponse.json({ item: saved })
}

export async function DELETE(request: Request, { params }: Params) {
  const ip = getClientIp(request.headers)
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: "Slow down a little." }, { status: 429 })
  }
  const { id } = await params
  const existing = await getItem(id)
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const board = await getBoard(existing.board_id)
  if (board?.archived_at) {
    return NextResponse.json({ error: "This day is archived." }, { status: 403 })
  }
  const removed = await deleteItem(id, identityFromIp(ip).name)
  if (removed) bus.emit("item", { kind: "delete", item: removed, boardId: removed.board_id })
  return NextResponse.json({ ok: true })
}
