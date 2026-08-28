import { BoardApp } from "@/components/board/BoardApp"
import { todayInBoardTz } from "@/lib/dates"
import { ensureBoard, listItems, neighborDates } from "@/lib/db"
import { getClientIp, identityFromIp } from "@/lib/identity"
import { headers } from "next/headers"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const today = todayInBoardTz()
  const board = await ensureBoard(today)
  const [items, neighbors, headerList] = await Promise.all([
    listItems(board.id),
    neighborDates(board.board_date),
    headers(),
  ])
  const identity = identityFromIp(getClientIp(headerList))

  return (
    <BoardApp
      board={board}
      initialItems={items}
      identity={identity}
      neighbors={neighbors}
      readOnly={false}
      today={today}
    />
  )
}
