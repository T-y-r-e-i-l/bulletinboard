import { bus } from "@/lib/bus"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const boardId = new URL(request.url).searchParams.get("boardId")
  if (!boardId) {
    return new Response("boardId required", { status: 400 })
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
      }
      send("hello", { ok: true })
      const onItem = (payload: { boardId?: string }) => {
        if (payload.boardId && payload.boardId !== boardId) return
        send("item", payload)
      }
      const onSignal = (payload: { boardId?: string; kind?: string }) => {
        if (payload.boardId && payload.boardId !== boardId) return
        send(payload.kind || "signal", payload)
      }
      bus.on("item", onItem)
      bus.on("signal", onSignal)
      const heartbeat = setInterval(() => send("ping", { t: Date.now() }), 15000)
      const close = () => {
        clearInterval(heartbeat)
        bus.off("item", onItem)
        bus.off("signal", onSignal)
      }
      request.signal.addEventListener("abort", () => {
        close()
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}
