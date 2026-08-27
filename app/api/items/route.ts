import { NextResponse } from "next/server"
import { MAX_ITEMS_PER_BOARD } from "@/lib/constants"
import { getClientIp, identityFromIp } from "@/lib/identity"
import { rateLimit } from "@/lib/rate-limit"
import { clampItem, defaultSize, isItemType, sanitizeText } from "@/lib/geometry"
import { bus } from "@/lib/bus"
import { getBoard, insertItem, listItems, maxZ, newItemId } from "@/lib/db"
import { unfurlUrl } from "@/lib/unfurl"
import type { BoardItem, ItemType } from "@/lib/types"

function defaultPayload(type: ItemType, extra: Record<string, unknown>) {
  if (type === "text") {
    return {
      content: sanitizeText(extra.content) || "Write something",
      color: typeof extra.color === "string" ? extra.color : "#1c1917",
      fontFamily: typeof extra.fontFamily === "string" ? extra.fontFamily : "sans",
      fontSize: typeof extra.fontSize === "number" ? extra.fontSize : 28,
      fontWeight: typeof extra.fontWeight === "string" ? extra.fontWeight : "400",
    }
  }
  if (type === "sticky") {
    return {
      content: sanitizeText(extra.content) || "",
      color: typeof extra.color === "string" ? extra.color : "#fde68a",
    }
  }
  if (type === "url") return extra
  if (type === "drawing") {
    return { strokes: Array.isArray(extra.strokes) ? extra.strokes : [] }
  }
  return extra
}

export async function GET(request: Request) {
  const boardId = new URL(request.url).searchParams.get("boardId")
  if (!boardId) return NextResponse.json({ error: "boardId required" }, { status: 400 })
  const items = await listItems(boardId)
  return NextResponse.json({ items })
}

export async function POST(request: Request) {
  const ip = getClientIp(request.headers)
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: "Slow down a little." }, { status: 429 })
  }
  const identity = identityFromIp(ip)
  const body = (await request.json()) as Record<string, unknown>
  const boardId = typeof body.boardId === "string" ? body.boardId : ""
  const type = body.type
  if (!boardId || !isItemType(type)) {
    return NextResponse.json({ error: "Invalid item" }, { status: 400 })
  }
  const board = await getBoard(boardId)
  if (!board) return NextResponse.json({ error: "Board not found" }, { status: 404 })
  if (board.archived_at) {
    return NextResponse.json({ error: "This day is archived." }, { status: 403 })
  }
  const existing = await listItems(boardId)
  if (existing.length >= MAX_ITEMS_PER_BOARD) {
    return NextResponse.json({ error: "This wall is full." }, { status: 400 })
  }

  const size = defaultSize(type)
  const width = typeof body.width === "number" ? body.width : size.width
  const height = typeof body.height === "number" ? body.height : size.height
  const box = clampItem({
    x: typeof body.x === "number" ? body.x : 80,
    y: typeof body.y === "number" ? body.y : 80,
    width,
    height,
  })

  let payload = defaultPayload(type, (body.payload as Record<string, unknown>) ?? {})
  if (type === "url") {
    const href = typeof (payload as { href?: string }).href === "string"
      ? (payload as { href: string }).href
      : typeof body.href === "string"
        ? body.href
        : ""
    try {
      payload = await unfurlUrl(href)
    } catch {
      return NextResponse.json({ error: "That URL does not look right." }, { status: 400 })
    }
  }

  const item: Omit<BoardItem, "created_at" | "updated_at"> = {
    id: await newItemId(),
    board_id: boardId,
    type,
    ...box,
    z_index: (await maxZ(boardId)) + 1,
    payload,
  }
  const saved = await insertItem(item, identity.name)
  bus.emit("item", { kind: "insert", item: saved, boardId })
  return NextResponse.json({ item: saved })
}
