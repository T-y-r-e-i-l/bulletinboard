"use client"

import { useEffect, useRef, type CSSProperties, type PointerEvent } from "react"
import { FONT_OPTIONS } from "@/lib/constants"
import { pointsToPath, strokeStyle } from "@/lib/drawing"
import type { BoardItem, Stroke } from "@/lib/types"
import { cn } from "@/lib/utils"

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
        <Editable
          value={String(payload.content || "")}
          readOnly={readOnly}
          onCommit={onCommitText}
          className={cn("h-full w-full outline-none", selected && "ring-2 ring-amber-400/80")}
          style={{
            color: String(payload.color || "#1c1917"),
            fontFamily: font?.css,
            fontSize: Number(payload.fontSize || 28),
            fontWeight: String(payload.fontWeight || "400"),
            lineHeight: 1.15,
          }}
        />
      ) : null}

      {item.type === "sticky" ? (
        <div
          className={cn(
            "h-full w-full p-3 shadow-[4px_8px_16px_rgba(0,0,0,0.18)]",
            selected && "ring-2 ring-amber-400/80",
          )}
          style={{
            background: String(payload.color || "#fde68a"),
            transform: "rotate(-1.2deg)",
          }}
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
            "flex h-full w-full flex-col overflow-hidden rounded-xl bg-white shadow-lg",
            selected && "ring-2 ring-amber-400/80",
          )}
          onPointerDown={(event) => event.preventDefault()}
        >
          {payload.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={String(payload.image)} alt="" className="h-28 w-full object-cover" />
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
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={String(payload.url || "")}
          alt={String(payload.name || "Photo")}
          className={cn("h-full w-full rounded-md object-cover shadow-lg", selected && "ring-2 ring-amber-400/80")}
          draggable={false}
        />
      ) : null}

      {item.type === "video" ? (
        payload.embed ? (
          <iframe
            src={String(payload.embed)}
            title="Video"
            className={cn("h-full w-full rounded-md shadow-lg", selected && "ring-2 ring-amber-400/80")}
            allow="autoplay; encrypted-media"
          />
        ) : (
          <video
            src={String(payload.url || "")}
            controls
            className={cn("h-full w-full rounded-md bg-black shadow-lg", selected && "ring-2 ring-amber-400/80")}
          />
        )
      ) : null}

      {item.type === "audio" ? (
        <div
          className={cn(
            "flex h-full items-center rounded-xl bg-[#2a2420] px-3 shadow-lg",
            selected && "ring-2 ring-amber-400/80",
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
        <span className="absolute right-0 bottom-0 size-3 cursor-nwse-resize bg-amber-300" data-resize="1" />
      ) : null}
    </div>
  )
}
