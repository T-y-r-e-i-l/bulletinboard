"use client"

import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AvatarStack } from "@/components/board/AvatarStack"
import { chromeDateLabel } from "@/lib/dates"
import type { Identity, NeighborDates, PresenceUser } from "@/lib/types"
import { chromeNameTag, chromePill } from "./chrome"

export function TopBar({
  boardDate,
  today,
  readOnly,
  neighbors,
  users,
  identity,
}: {
  boardDate: string
  today: string
  readOnly: boolean
  neighbors: NeighborDates
  users: PresenceUser[]
  identity: Identity
}) {
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex flex-wrap items-start justify-between gap-2 p-3 sm:gap-4 sm:p-4">
      <div className={`pointer-events-auto relative flex min-w-0 max-w-full items-center gap-1 ${chromePill} px-1.5 py-2 text-[#8A7B66] sm:gap-2 sm:px-2`}>
        <span className={`absolute -top-2 left-6 ${chromeNameTag}`}>publicpaste.</span>
        {neighbors.prev ? (
          <Button variant="ghost" size="icon-sm" className="mt-2 shrink-0 text-[#8A7B66] hover:bg-[#E8D9A0]/40" asChild>
            <Link href={neighbors.prev === today ? "/" : `/archive/${neighbors.prev}`} aria-label="Previous day">
              <ChevronLeft />
            </Link>
          </Button>
        ) : (
          <span className="size-7 shrink-0" />
        )}
        <div className="min-w-0 flex-1 overflow-hidden px-1 pt-2 text-center">
          <p className="truncate text-sm font-extrabold text-[#8A7B66]">{chromeDateLabel(boardDate, today)}</p>
        </div>
        {neighbors.next ? (
          <Button variant="ghost" size="icon-sm" className="mt-2 shrink-0 text-[#8A7B66] hover:bg-[#E8D9A0]/40" asChild>
            <Link href={neighbors.next === today ? "/" : `/archive/${neighbors.next}`} aria-label="Next day">
              <ChevronRight />
            </Link>
          </Button>
        ) : (
          <span className="size-7 shrink-0" />
        )}
      </div>
      <div className="pointer-events-auto flex shrink-0 items-center gap-3">
        <p className={`${chromePill} hidden max-w-xs px-4 py-2 text-right text-xs font-semibold text-[#8A7B66] sm:block`}>
          {readOnly ? "Archived wall — look, don’t rearrange." : "Clears at midnight Pacific. Anyone can add, move, or take down a note."}
        </p>
        <div className={`${chromePill} px-2 py-1.5`}>
          <AvatarStack users={users.length ? users : [{ ...identity, sessionId: "self", self: true }]} />
        </div>
      </div>
    </header>
  )
}
