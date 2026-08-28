"use client"

import { useEffect, useRef, type CSSProperties, type PointerEvent } from "react"
import { FONT_OPTIONS } from "@/lib/constants"
import { pointsToPath, strokeStyle } from "@/lib/drawing"
import type { BoardItem, Stroke } from "@/lib/types"
import { cn } from "@/lib/utils"
import { chromeShadow, chromeNameTag, selectedRing } from "./chrome"

const cardShadow = chromeShadow

function Editable({
  value,
  className,
  style,
  readOnly,
  autoFocus,
  onCommit,
}: {
  value: string
  className?: string
  style?: CSSProperties
  readOnly: boolean
  autoFocus?: boolean
  onCommit: (value: string) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const focused = useRef(false)

  useEffect(() => {
    if (!focused.current && ref.current && ref.current.innerText !== value) {
      ref.current.innerText = value
    }
  }, [value])

  useEffect(() => {
    if (!autoFocus || readOnly || !ref.current) return
    const el = ref.current
    el.focus()
    const selection = window.getSelection()
    if (!selection) return
    const range = document.createRange()
    range.selectNodeContents(el)
    selection.removeAllRanges()
    selection.addRange(range)
  }, [autoFocus, readOnly])

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
        <div className={cn("h-full w-full rounded-[32px] bg-[#FFFBE7] p-4", cardShadow, selected && selectedRing)}>
          <Editable
            value={String(payload.content || "")}
            readOnly={readOnly}
            autoFocus={selected}
            onCommit={onCommitText}
            className="h-full w-full cursor-text outline-none"
            style={{
              color: String(payload.color || "#8A7B66"),
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
          className={cn("h-full w-full rounded-[28px] p-3", cardShadow, selected && selectedRing)}
          style={{ background: String(payload.color || "#fde68a") }}
        >
          <Editable
            value={String(payload.content || "")}
            readOnly={readOnly}
            autoFocus={selected}
            onCommit={onCommitText}
            className="h-full w-full cursor-text text-[15px] leading-snug text-[#5C4A38] outline-none"
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
            "relative flex h-full w-full flex-col overflow-hidden rounded-[28px] bg-[#FFFBE7]",
            cardShadow,
            selected && selectedRing,
          )}
          onPointerDown={(event) => event.preventDefault()}
        >
          <span className={`absolute top-2 left-3 z-10 ${chromeNameTag}`}>Link</span>
          {payload.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={String(payload.image)} alt="" className="h-28 w-full rounded-t-[28px] object-cover" />
          ) : (
            <div className="flex h-28 items-center justify-center bg-[#F7F8E6] text-[#A89478]">Link</div>
          )}
          <div className="p-3">
            <p className="line-clamp-2 text-sm font-extrabold text-[#8A7B66]">{String(payload.title || "Link")}</p>
            <p className="mt-1 truncate text-xs font-semibold text-[#A89478]">{String(payload.href || "")}</p>
          </div>
        </a>
      ) : null}

      {item.type === "image" ? (
        <div
          className={cn("h-full w-full overflow-hidden rounded-[22px] p-2", selected && selectedRing)}
          style={{
            background: "linear-gradient(180deg, #d4b07a 0%, #b8894a 100%)",
            boxShadow: "0 8px 0 rgba(90,60,20,0.2), inset 0 0 0 2px #8B5A2B",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={String(payload.url || "")}
            alt={String(payload.name || "Photo")}
            className="h-full w-full rounded-[14px] object-cover"
            draggable={false}
          />
        </div>
      ) : null}

      {item.type === "video" ? (
        <div
          className={cn("h-full w-full overflow-hidden rounded-[22px] p-2", selected && selectedRing)}
          style={{
            background: "linear-gradient(180deg, #d4b07a 0%, #b8894a 100%)",
            boxShadow: "0 8px 0 rgba(90,60,20,0.2), inset 0 0 0 2px #8B5A2B",
          }}
        >
          {payload.embed ? (
            <iframe
              src={String(payload.embed)}
              title="Video"
              className="h-full w-full rounded-[14px]"
              allow="autoplay; encrypted-media"
            />
          ) : (
            <video
              src={String(payload.url || "")}
              controls
              className="h-full w-full rounded-[14px] object-cover"
            />
          )}
        </div>
      ) : null}

      {item.type === "audio" ? (
        <div
          className={cn(
            "flex h-full items-center rounded-[999px] bg-[#FFFBE7] px-4",
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
        <span className="absolute right-1 bottom-1 size-3.5 cursor-nwse-resize rounded-full bg-[#F7CD67] ring-2 ring-[#FFFBE7]" data-resize="1" />
      ) : null}
    </div>
  )
}
