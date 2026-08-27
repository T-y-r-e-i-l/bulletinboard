import { BOARD_TIMEZONE } from "@/lib/constants"

export function todayInBoardTz(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BOARD_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}

export function formatBoardDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number)
  const utc = new Date(Date.UTC(year ?? 2026, (month ?? 1) - 1, day ?? 1))
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(utc)
}

export function isValidDateParam(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}
