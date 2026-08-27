import { NextResponse } from "next/server"
import { listEvents } from "@/lib/db"

export async function GET(request: Request) {
  const boardId = new URL(request.url).searchParams.get("boardId")
  if (!boardId) return NextResponse.json({ error: "boardId required" }, { status: 400 })
  const events = await listEvents(boardId)
  return NextResponse.json({ events })
}
