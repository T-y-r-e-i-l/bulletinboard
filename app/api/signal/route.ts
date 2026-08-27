import { NextResponse } from "next/server"
import { bus } from "@/lib/bus"

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>
  bus.emit("signal", body)
  return NextResponse.json({ ok: true })
}
