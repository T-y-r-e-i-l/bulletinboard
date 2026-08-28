import { NextResponse } from "next/server"
import { todayInBoardTz } from "@/lib/dates"
import { ensureBoard } from "@/lib/db"

export async function GET(request: Request) {
  const secret = process.env["CRON_SECRET"]
  const auth = request.headers.get("authorization")
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const board = await ensureBoard(todayInBoardTz())
  return NextResponse.json({ ok: true, date: board.board_date })
}
