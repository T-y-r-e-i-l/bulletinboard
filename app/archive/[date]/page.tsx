import { notFound, redirect } from "next/navigation"
import { BoardApp } from "@/components/board/BoardApp"
import { isValidDateParam, todayInBoardTz } from "@/lib/dates"
import { ensureBoard, getBoardByDate, listItems, neighborDates } from "@/lib/db"
import { getClientIp, identityFromIp } from "@/lib/identity"
import { headers } from "next/headers"

export const dynamic = "force-dynamic"

export default async function ArchivePage({
  params,
}: {
  params: Promise<{ date: string }>
}) {
  const { date } = await params
  if (!isValidDateParam(date)) notFound()
  const today = todayInBoardTz()
  if (date === today) {
    redirect("/")
  }
  await ensureBoard(today)
  const board = await getBoardByDate(date)
  if (!board) notFound()
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
      readOnly
      today={today}
    />
  )
}
