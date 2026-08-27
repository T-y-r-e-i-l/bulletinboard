"use client"

import {
  Link2,
  MousePointer2,
  Music,
  Pencil,
  StickyNote,
  Type,
  ImageIcon,
  Video,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { Tool } from "@/lib/types"
import { cn } from "@/lib/utils"

const TOOLS: { id: Tool; label: string; icon: typeof Type }[] = [
  { id: "select", label: "Select", icon: MousePointer2 },
  { id: "draw", label: "Draw", icon: Pencil },
  { id: "text", label: "Text", icon: Type },
  { id: "sticky", label: "Sticky", icon: StickyNote },
  { id: "url", label: "Link", icon: Link2 },
  { id: "image", label: "Photo", icon: ImageIcon },
  { id: "video", label: "Video", icon: Video },
  { id: "audio", label: "Audio", icon: Music },
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
      <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-white/10 bg-[#1c1814]/90 p-1.5 shadow-2xl backdrop-blur-md">
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
                    "size-10 rounded-full text-stone-200 hover:bg-white/10 hover:text-white",
                    active && "bg-amber-100 text-[#1c1814] hover:bg-amber-50 hover:text-[#1c1814]",
                  )}
                  aria-label={item.label}
                >
                  <Icon />
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
