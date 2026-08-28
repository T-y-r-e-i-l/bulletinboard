"use client"

import { Locate, Minus, Plus } from "lucide-react"
import { Minimap } from "@/components/board/Minimap"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { MAX_ZOOM, MIN_ZOOM } from "@/lib/constants"
import type { BoardItem, CursorPayload, Point } from "@/lib/types"
import { chromeCard, chromeSquircle } from "./chrome"

export function ViewControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onRecenter,
  pan,
  viewport,
  cursor,
  cursorColor,
  remoteCursors,
  items,
  onJump,
}: {
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  onRecenter: () => void
  pan: { x: number; y: number }
  viewport: { w: number; h: number }
  cursor: Point | null
  cursorColor: string
  remoteCursors: CursorPayload[]
  items: BoardItem[]
  onJump: (x: number, y: number) => void
}) {
  const percent = Math.round(zoom * 100)

  return (
    <div className="pointer-events-none absolute right-4 bottom-5 z-30 flex items-end gap-2">
      <Minimap
        pan={pan}
        zoom={zoom}
        viewport={viewport}
        cursor={cursor}
        cursorColor={cursorColor}
        remoteCursors={remoteCursors}
        items={items}
        onJump={onJump}
      />
      <div className="flex flex-col items-center gap-2">
        <div
          className={`pointer-events-auto flex flex-col items-center gap-1 ${chromeCard} p-1.5`}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Zoom in"
                disabled={zoom >= MAX_ZOOM - 0.001}
                onClick={onZoomIn}
                className={`size-10 ${chromeSquircle} text-[#8A7B66] hover:bg-[#E8D9A0]/40`}
              >
                <Plus />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Zoom in</TooltipContent>
          </Tooltip>
          <p className="px-1 py-0.5 text-center text-[11px] font-extrabold tabular-nums text-[#8A7B66]">
            {percent}%
          </p>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Zoom out"
                disabled={zoom <= MIN_ZOOM + 0.001}
                onClick={onZoomOut}
                className={`size-10 ${chromeSquircle} text-[#8A7B66] hover:bg-[#E8D9A0]/40`}
              >
                <Minus />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Zoom out</TooltipContent>
          </Tooltip>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Recenter canvas"
              onClick={onRecenter}
              onPointerDown={(event) => event.stopPropagation()}
              className={`pointer-events-auto size-10 ${chromeCard} text-[#8A7B66] hover:bg-[#E8D9A0]/40`}
            >
              <Locate />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Recenter</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
