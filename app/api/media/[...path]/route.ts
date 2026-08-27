import { readFile } from "node:fs/promises"
import path from "node:path"
import { NextResponse } from "next/server"

const TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  mp4: "video/mp4",
  webm: "video/webm",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
}

type Params = { params: Promise<{ path: string[] }> }

export async function GET(_request: Request, { params }: Params) {
  const segments = (await params).path
  if (!segments?.length || segments.some((part) => part.includes(".."))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  const filePath = path.join(process.cwd(), ".data", "uploads", ...segments)
  try {
    const data = await readFile(filePath)
    const ext = segments.at(-1)?.split(".").pop()?.toLowerCase() || ""
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": TYPES[ext] || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
}
