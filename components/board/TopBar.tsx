"use client"

import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AvatarStack } from "@/components/board/AvatarStack"
import { chromeDateLabel } from "@/lib/dates"
import type { Identity, NeighborDates, PresenceUser } from "@/lib/types"
import { chromePill } from "./chrome"

export function TopBar({
  boardDate,
  readOnly,
  neighbors,
  users,
  identity,
  onTimelapse,
}: {
  boardDate: string
  readOnly: boolean
  neighbors: NeighborDates
  users: PresenceUser[]
  identity: Identity
  onTimelapse: () => void
}) {
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-4 p-4">
      <div className={`pointer-events-auto flex items-center gap-2 ${chromePill} px-2 py-1.5 text-[#111111]`}>
        {neighbors.prev ? (
          <Button variant="ghost" size="icon-sm" className="text-[#111111] hover:bg-black/5" asChild>
            <Link href={neighbors.prev === todayDate() ? "/" : `/archive/${neighbors.prev}`} aria-label="Previous day">
              <ChevronLeft />
            </Link>
          </Button>
        ) : (
          <span className="size-7" />
        )}
        <div className="min-w-48 px-1 text-center">
          <p className="text-[11px] tracking-[0.18em] text-[#8E8E93] lowercase">publicpaste.</p>
          <p className="text-sm font-medium text-[#111111]">{chromeDateLabel(boardDate)}</p>
        </div>
        {neighbors.next ? (
          <Button variant="ghost" size="icon-sm" className="text-[#111111] hover:bg-black/5" asChild>
            <Link href={neighbors.next === todayDate() ? "/" : `/archive/${neighbors.next}`} aria-label="Next day">
              <ChevronRight />
            </Link>
          </Button>
        ) : (
          <span className="size-7" />
        )}
        <Button
          size="sm"
          className="ml-1 rounded-full bg-[#FF6B00] text-white hover:bg-[#FF6B00]/90"
          onClick={onTimelapse}
        >
          Timelapse
        </Button>
      </div>
      <div className="pointer-events-auto flex items-center gap-3">
        <p className="hidden max-w-xs text-right text-xs text-[#8E8E93] sm:block">
          {readOnly ? "Archived wall — look, don’t rearrange." : "Clears at midnight Pacific. Anyone can add, move, or take down a note."}
        </p>
        <div className={`${chromePill} px-2 py-1.5`}>
          <AvatarStack users={users.length ? users : [{ ...identity, sessionId: "self", self: true }]} />
        </div>
      </div>
    </header>
  )
}

function todayDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}
