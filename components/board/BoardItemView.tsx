"use client"

import { useEffect, useRef, type CSSProperties, type PointerEvent } from "react"
import { FONT_OPTIONS } from "@/lib/constants"
import { pointsToPath, strokeStyle } from "@/lib/drawing"
import type { BoardItem, Stroke } from "@/lib/types"
import { cn } from "@/lib/utils"
import { chromeShadow } from "./chrome"

const cardShadow = chromeShadow
const selectedRing = "ring-2 ring-[#FF6B00] ring-offset-4 ring-offset-[#F5F5F5]"

function Editable({
  value,
  className,
  style,
  readOnly,
  onCommit,
}: {
  value: string
  className?: string
  style?: CSSProperties
  readOnly: boolean
  onCommit: (value: string) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const focused = useRef(false)

  useEffect(() => {
    if (!focused.current && ref.current && ref.current.innerText !== value) {
      ref.current.innerText = value
    }
  }, [value])

  return (
    <div
      ref={ref}
      className={className}
      style={style}
      contentEditable={!readOnly}
      suppressContentEditableWarning
      onFocus={() => {
        focused.current = true
      }}
      onBlur={(event) => {
        focused.current = false
        onCommit(event.currentTarget.innerText)
      }}
    />
  )
}

export function BoardItemView({
  item,
  selected,
  readOnly,
  onSelect,
  onCommitText,
}: {
  item: BoardItem
  selected: boolean
  readOnly: boolean
  onSelect: (event: PointerEvent) => void
  onCommitText: (content: string) => void
}) {
  const payload = item.payload
  const font = FONT_OPTIONS.find((option) => option.id === payload.fontFamily)

  return (
    <div
      data-item-id={item.id}
      className={cn(
        "absolute touch-none",
        selected && "z-20",
        item.type === "drawing" ? "pointer-events-none" : "pointer-events-auto",
        selected && item.type === "drawing" && selectedRing,
      )}
      style={{
        left: item.x,
        top: item.y,
        width: item.width,
        height: item.height,
        zIndex: item.z_index,
      }}
      onPointerDown={onSelect}
    >
      {item.type === "text" ? (
        <div className={cn("h-full w-full rounded-[20px] bg-white p-3", cardShadow, selected && selectedRing)}>
          <Editable
            value={String(payload.content || "")}
            readOnly={readOnly}
            onCommit={onCommitText}
            className="h-full w-full outline-none"
            style={{
              color: String(payload.color || "#1c1917"),
              fontFamily: font?.css,
              fontSize: Number(payload.fontSize || 28),
              fontWeight: String(payload.fontWeight || "400"),
              lineHeight: 1.15,
            }}
          />
        </div>
      ) : null}

      {item.type === "sticky" ? (
        <div
          className={cn("h-full w-full rounded-[20px] p-3", cardShadow, selected && selectedRing)}
          style={{ background: String(payload.color || "#fde68a") }}
        >
          <Editable
            value={String(payload.content || "")}
            readOnly={readOnly}
            onCommit={onCommitText}
            className="h-full w-full text-[15px] leading-snug text-stone-800 outline-none"
            style={{ fontFamily: "var(--font-wall-hand), cursive" }}
          />
        </div>
      ) : null}

      {item.type === "url" ? (
        <a
          href={String(payload.href || "#")}
          target="_blank"
          rel="noreferrer"
          className={cn(
            "flex h-full w-full flex-col overflow-hidden rounded-[20px] bg-white",
            cardShadow,
            selected && selectedRing,
          )}
          onPointerDown={(event) => event.preventDefault()}
        >
          {payload.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={String(payload.image)} alt="" className="h-28 w-full rounded-t-[20px] object-cover" />
          ) : (
            <div className="flex h-28 items-center justify-center bg-stone-100 text-stone-400">Link</div>
          )}
          <div className="p-3">
            <p className="line-clamp-2 text-sm font-semibold text-stone-900">{String(payload.title || "Link")}</p>
            <p className="mt-1 truncate text-xs text-stone-500">{String(payload.href || "")}</p>
          </div>
        </a>
      ) : null}

      {item.type === "image" ? (
        <div
          className={cn(
            "h-full w-full overflow-hidden rounded-[20px] bg-white p-0.5",
            cardShadow,
            selected && selectedRing,
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={String(payload.url || "")}
            alt={String(payload.name || "Photo")}
            className="h-full w-full rounded-[18px] object-cover"
            draggable={false}
          />
        </div>
      ) : null}

      {item.type === "video" ? (
        <div
          className={cn(
            "h-full w-full overflow-hidden rounded-[20px] bg-white p-0.5",
            cardShadow,
            selected && selectedRing,
          )}
        >
          {payload.embed ? (
            <iframe
              src={String(payload.embed)}
              title="Video"
              className="h-full w-full rounded-[18px]"
              allow="autoplay; encrypted-media"
            />
          ) : (
            <video
              src={String(payload.url || "")}
              controls
              className="h-full w-full rounded-[18px] object-cover"
            />
          )}
        </div>
      ) : null}

      {item.type === "audio" ? (
        <div
          className={cn(
            "flex h-full items-center rounded-[20px] bg-white px-3",
            cardShadow,
            selected && selectedRing,
          )}
        >
          <audio src={String(payload.url || "")} controls className="w-full" />
        </div>
      ) : null}

      {item.type === "drawing" ? (
        <svg
          className="pointer-events-auto h-full w-full overflow-visible"
          viewBox={`0 0 ${item.width} ${item.height}`}
        >
          {(payload.strokes as Stroke[] | undefined)?.map((stroke, index) => (
            <path
              key={index}
              d={pointsToPath(
                stroke.points.map((point) => ({ x: point.x - item.x, y: point.y - item.y })),
              )}
              {...strokeStyle(stroke)}
            />
          ))}
        </svg>
      ) : null}

      {selected && item.type !== "drawing" ? (
        <span className="absolute right-0 bottom-0 size-3 cursor-nwse-resize rounded-sm bg-[#FF6B00]" data-resize="1" />
      ) : null}
    </div>
  )
}
