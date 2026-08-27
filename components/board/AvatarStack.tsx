"use client"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { PresenceUser } from "@/lib/types"
import { cn } from "@/lib/utils"

export function AvatarStack({ users }: { users: PresenceUser[] }) {
  const visible = users.slice(0, 6)
  const extra = users.length - visible.length

  return (
    <div className="flex items-center pr-2">
      {visible.map((user, index) => (
        <Tooltip key={user.sessionId}>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "relative flex size-9 items-center justify-center rounded-full border-2 border-white text-base shadow-md",
                user.self && "ring-2 ring-[#FF6B00]",
              )}
              style={{
                background: user.color,
                marginLeft: index === 0 ? 0 : -10,
                zIndex: 20 - index,
              }}
            >
              <span aria-hidden>{user.emoji}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {user.name}
            {user.self ? " (you)" : ""}
          </TooltipContent>
        </Tooltip>
      ))}
      {extra > 0 ? (
        <div className="relative z-0 -ml-2 flex size-9 items-center justify-center rounded-full border-2 border-white bg-[#F5F5F5] text-xs font-medium text-[#111111]">
          +{extra}
        </div>
      ) : null}
    </div>
  )
}
