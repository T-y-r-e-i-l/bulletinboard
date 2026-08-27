"use client"

import type { ReactNode } from "react"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { BRUSHES, FONT_OPTIONS, FONT_WEIGHTS, STICKY_COLORS } from "@/lib/constants"
import type { BoardItem, Tool } from "@/lib/types"
import { cn } from "@/lib/utils"

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
      <Panel>
        <p className="text-[11px] tracking-wide text-stone-400 uppercase">Brush</p>
        <div className="mt-2 flex gap-1">
          {BRUSHES.map((brush) => (
            <Button
              key={brush.id}
              size="sm"
              variant={drawBrush === brush.id ? "default" : "secondary"}
              className="flex-1"
              onClick={() => onDrawBrush(brush.id)}
            >
              {brush.label}
            </Button>
          ))}
        </div>
        <label className="mt-3 block text-[11px] text-stone-400 uppercase">Size</label>
        <Slider
          className="mt-2"
          min={2}
          max={36}
          value={[drawSize]}
          onValueChange={(value) => onDrawSize(value[0] ?? 4)}
        />
        <label className="mt-3 block text-[11px] text-stone-400 uppercase">Color</label>
        <input
          type="color"
          value={drawColor}
          onChange={(event) => onDrawColor(event.target.value)}
          className="mt-2 h-8 w-full cursor-pointer rounded border border-white/10 bg-transparent"
        />
      </Panel>
    )
  }

  if (!selected) return null

  return (
    <Panel>
      {selected.type === "text" ? (
        <>
          <p className="text-[11px] tracking-wide text-stone-400 uppercase">Text</p>
          <select
            className="mt-2 w-full rounded-md border border-white/10 bg-[#2a2420] px-2 py-1.5 text-sm"
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
            className="mt-2 w-full rounded-md border border-white/10 bg-[#2a2420] px-2 py-1.5 text-sm"
            value={String(selected.payload.fontWeight || "400")}
            onChange={(event) => onChangePayload({ fontWeight: event.target.value })}
          >
            {FONT_WEIGHTS.map((weight) => (
              <option key={weight.id} value={weight.id}>
                {weight.label}
              </option>
            ))}
          </select>
          <label className="mt-3 block text-[11px] text-stone-400 uppercase">Size</label>
          <Slider
            className="mt-2"
            min={14}
            max={96}
            value={[Number(selected.payload.fontSize || 28)]}
            onValueChange={(value) => onChangePayload({ fontSize: value[0] ?? 28 })}
          />
          <label className="mt-3 block text-[11px] text-stone-400 uppercase">Color</label>
          <input
            type="color"
            value={String(selected.payload.color || "#1c1917")}
            onChange={(event) => onChangePayload({ color: event.target.value })}
            className="mt-2 h-8 w-full cursor-pointer rounded border border-white/10 bg-transparent"
          />
        </>
      ) : null}

      {selected.type === "sticky" ? (
        <>
          <p className="text-[11px] tracking-wide text-stone-400 uppercase">Sticky color</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {STICKY_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={`Sticky ${color}`}
                onClick={() => onChangePayload({ color })}
                className={cn(
                  "size-7 rounded-md border border-black/10 shadow-sm",
                  selected.payload.color === color && "ring-2 ring-amber-200",
                )}
                style={{ background: color }}
              />
            ))}
          </div>
        </>
      ) : null}

      <Button variant="destructive" size="sm" className="mt-4 w-full" onClick={onDelete}>
        <Trash2 />
        Remove
      </Button>
    </Panel>
  )
}

function Panel({ children }: { children: ReactNode }) {
  return (
    <aside className="pointer-events-auto absolute top-24 right-4 z-30 w-56 rounded-2xl border border-white/10 bg-[#1c1814]/90 p-3 text-stone-100 shadow-xl backdrop-blur-md">
      {children}
    </aside>
  )
}
