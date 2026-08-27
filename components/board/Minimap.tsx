"use client"

import { useRef, type PointerEvent } from "react"
import { BOARD_HEIGHT, BOARD_WIDTH } from "@/lib/constants"
import type { BoardItem, CursorPayload, Point } from "@/lib/types"
import { cn } from "@/lib/utils"
import { chromeCard } from "./chrome"

const MAP_WIDTH = 192
const MAP_HEIGHT = Math.round((MAP_WIDTH * BOARD_HEIGHT) / BOARD_WIDTH)

function boardFromEvent(
  event: { clientX: number; clientY: number },
  el: HTMLElement,
) {
  const rect = el.getBoundingClientRect()
  const x = ((event.clientX - rect.left) / rect.width) * BOARD_WIDTH
  const y = ((event.clientY - rect.top) / rect.height) * BOARD_HEIGHT
  return {
    x: Math.min(BOARD_WIDTH, Math.max(0, x)),
    y: Math.min(BOARD_HEIGHT, Math.max(0, y)),
  }
}

export function Minimap({
  pan,
  zoom,
  viewport,
  cursor,
  cursorColor,
  remoteCursors,
  items,
  onJump,
}: {
  pan: { x: number; y: number }
  zoom: number
  viewport: { w: number; h: number }
  cursor: Point | null
  cursorColor: string
  remoteCursors: CursorPayload[]
  items: BoardItem[]
  onJump: (x: number, y: number) => void
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const scaleX = MAP_WIDTH / BOARD_WIDTH
  const scaleY = MAP_HEIGHT / BOARD_HEIGHT
  const viewLeft = (-pan.x / zoom) * scaleX
  const viewTop = (-pan.y / zoom) * scaleY
  const viewWidth = (viewport.w / zoom) * scaleX
  const viewHeight = (viewport.h / zoom) * scaleY

  function jump(event: PointerEvent<HTMLDivElement>) {
    event.stopPropagation()
    const el = rootRef.current
    if (!el) return
    el.setPointerCapture(event.pointerId)
    const point = boardFromEvent(event, el)
    onJump(point.x, point.y)
  }

  function drag(event: PointerEvent<HTMLDivElement>) {
    if (!event.buttons || !rootRef.current) return
    event.stopPropagation()
    const point = boardFromEvent(event, rootRef.current)
    onJump(point.x, point.y)
  }

  return (
    <div
      ref={rootRef}
      role="img"
      aria-label="Canvas minimap"
      className={cn(
        `pointer-events-auto relative ${chromeCard} overflow-hidden`,
        "cursor-pointer",
      )}
      style={{
        width: MAP_WIDTH,
        height: MAP_HEIGHT,
        background: "#FFFFFF",
      }}
      onPointerDown={jump}
      onPointerMove={drag}
    >
      {items.map((item) => (
        <span
          key={item.id}
          className="absolute rounded-[1px]"
          style={{
            left: item.x * scaleX,
            top: item.y * scaleY,
            width: Math.max(2, item.width * scaleX),
            height: Math.max(2, item.height * scaleY),
            background:
              typeof item.payload.color === "string" ? item.payload.color : "#8E8E93",
            opacity: 0.85,
          }}
        />
      ))}

      <div
        className="absolute border border-[#FF6B00] bg-[#FF6B00]/15"
        style={{
          left: viewLeft,
          top: viewTop,
          width: Math.max(8, viewWidth),
          height: Math.max(6, viewHeight),
        }}
      />

      {remoteCursors.map((remote) => (
        <span
          key={remote.sessionId}
          className="absolute size-1.5 rounded-full"
          style={{
            left: remote.x * scaleX - 3,
            top: remote.y * scaleY - 3,
            background: remote.color,
            boxShadow: "0 0 0 1px #FFFFFF, 0 0 0 2px rgba(0,0,0,0.1)",
          }}
        />
      ))}

      {cursor ? (
        <span
          className="absolute z-10 size-2.5 rounded-full"
          style={{
            left: cursor.x * scaleX - 5,
            top: cursor.y * scaleY - 5,
            background: cursorColor,
            boxShadow: "0 0 0 2px #FFFFFF",
          }}
        />
      ) : null}
    </div>
  )
}
