"use client"

import {
  Link2,
  MousePointer2,
  Music,
  Pencil,
  StickyNote,
  Type,
  ImageIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { Tool } from "@/lib/types"
import { cn } from "@/lib/utils"
import { chromePhone, chromeSquircle, island } from "./chrome"

const TOOLS: { id: Tool; label: string; icon: typeof Type; color: string }[] = [
  { id: "select", label: "Select", icon: MousePointer2, color: island.phone.select },
  { id: "draw", label: "Draw", icon: Pencil, color: island.phone.draw },
  { id: "text", label: "Text", icon: Type, color: island.phone.text },
  { id: "sticky", label: "Sticky", icon: StickyNote, color: island.phone.sticky },
  { id: "url", label: "Link", icon: Link2, color: island.phone.url },
  { id: "image", label: "Media", icon: ImageIcon, color: island.phone.image },
  { id: "audio", label: "Audio", icon: Music, color: island.phone.audio },
]

export function Toolbar({
  tool,
  onTool,
  disabled,
}: {
  tool: Tool
  onTool: (tool: Tool) => void
  disabled?: boolean
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-5 z-30 flex justify-center">
      <div className={`pointer-events-auto flex items-center gap-2 ${chromePhone} p-2.5`}>
        {TOOLS.map((item) => {
          const Icon = item.icon
          const active = tool === item.id
          return (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={disabled}
                  onClick={() => onTool(item.id)}
                  className={cn(
                    `size-12 ${chromeSquircle} text-[#5C4A38] hover:bg-transparent hover:brightness-105`,
                    active && "ring-[4px] ring-[#F7CD67] ring-offset-2 ring-offset-[#FFFBE7]",
                  )}
                  style={{ background: item.color }}
                  aria-label={item.label}
                >
                  <Icon className="size-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{item.label}</TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </div>
  )
}
