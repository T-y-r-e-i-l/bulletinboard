"use client"

import type { ReactNode } from "react"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { BRUSHES, FONT_OPTIONS, FONT_WEIGHTS, STICKY_COLORS } from "@/lib/constants"
import type { BoardItem, Tool } from "@/lib/types"
import { cn } from "@/lib/utils"
import { chromeCard, chromeNameTag } from "./chrome"

export function Inspector({
  tool,
  selected,
  drawColor,
  drawSize,
  drawBrush,
  onDrawColor,
  onDrawSize,
  onDrawBrush,
  onChangePayload,
  onDelete,
}: {
  tool: Tool
  selected: BoardItem | null
  drawColor: string
  drawSize: number
  drawBrush: "pen" | "marker" | "highlighter"
  onDrawColor: (color: string) => void
  onDrawSize: (size: number) => void
  onDrawBrush: (brush: "pen" | "marker" | "highlighter") => void
  onChangePayload: (payload: Record<string, unknown>) => void
  onDelete: () => void
}) {
  if (tool === "draw" && !selected) {
    return (
      <Panel tag="Brush">
        <div className="mt-2 flex gap-1">
          {BRUSHES.map((brush) => (
            <Button
              key={brush.id}
              size="sm"
              variant={drawBrush === brush.id ? "default" : "secondary"}
              className="flex-1 rounded-full"
              onClick={() => onDrawBrush(brush.id)}
            >
              {brush.label}
            </Button>
          ))}
        </div>
        <label className="mt-3 block text-[11px] font-extrabold tracking-wide text-[#A89478]">Size</label>
        <Slider
          className="mt-2"
          min={2}
          max={36}
          value={[drawSize]}
          onValueChange={(value) => onDrawSize(value[0] ?? 4)}
        />
        <label className="mt-3 block text-[11px] font-extrabold tracking-wide text-[#A89478]">Color</label>
        <input
          type="color"
          value={drawColor}
          onChange={(event) => onDrawColor(event.target.value)}
          className="mt-2 h-8 w-full cursor-pointer rounded-full border border-[#E8D9A0] bg-transparent"
        />
      </Panel>
    )
  }

  if (!selected) return null

  return (
    <Panel tag={selected.type === "sticky" ? "Sticky" : selected.type === "text" ? "Text" : "Item"}>
      {selected.type === "text" ? (
        <>
          <select
            className="mt-2 w-full rounded-full border border-[#E8D9A0] bg-[#F7F8E6] px-3 py-1.5 text-sm font-semibold text-[#8A7B66]"
            value={String(selected.payload.fontFamily || "sans")}
            onChange={(event) => onChangePayload({ fontFamily: event.target.value })}
          >
            {FONT_OPTIONS.map((font) => (
              <option key={font.id} value={font.id}>
                {font.label}
              </option>
            ))}
          </select>
          <select
            className="mt-2 w-full rounded-full border border-[#E8D9A0] bg-[#F7F8E6] px-3 py-1.5 text-sm font-semibold text-[#8A7B66]"
            value={String(selected.payload.fontWeight || "400")}
            onChange={(event) => onChangePayload({ fontWeight: event.target.value })}
          >
            {FONT_WEIGHTS.map((weight) => (
              <option key={weight.id} value={weight.id}>
                {weight.label}
              </option>
            ))}
          </select>
          <label className="mt-3 block text-[11px] font-extrabold tracking-wide text-[#A89478]">Size</label>
          <Slider
            className="mt-2"
            min={14}
            max={96}
            value={[Number(selected.payload.fontSize || 28)]}
            onValueChange={(value) => onChangePayload({ fontSize: value[0] ?? 28 })}
          />
          <label className="mt-3 block text-[11px] font-extrabold tracking-wide text-[#A89478]">Color</label>
          <input
            type="color"
            value={String(selected.payload.color || "#1c1917")}
            onChange={(event) => onChangePayload({ color: event.target.value })}
            className="mt-2 h-8 w-full cursor-pointer rounded-full border border-[#E8D9A0] bg-transparent"
          />
        </>
      ) : null}

      {selected.type === "sticky" ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {STICKY_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={`Sticky ${color}`}
              onClick={() => onChangePayload({ color })}
              className={cn(
                "size-7 rounded-full border border-[#E8D9A0] shadow-sm",
                selected.payload.color === color && "ring-[3px] ring-[#F7CD67]",
              )}
              style={{ background: color }}
            />
          ))}
        </div>
      ) : null}

      <Button variant="ghost" size="sm" className="mt-4 w-full rounded-full text-[#A89478] hover:bg-[#E8D9A0]/40 hover:text-[#8A7B66]" onClick={onDelete}>
        <Trash2 />
        Remove
      </Button>
    </Panel>
  )
}

function Panel({ children, tag }: { children: ReactNode; tag: string }) {
  return (
    <aside className={`pointer-events-auto absolute top-24 right-4 z-30 w-56 ${chromeCard} p-4 pt-5 text-[#8A7B66]`}>
      <span className={`absolute -top-2.5 left-4 ${chromeNameTag}`}>{tag}</span>
      {children}
    </aside>
  )
}
