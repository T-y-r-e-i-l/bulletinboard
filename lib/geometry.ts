import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  DEFAULT_SIZES,
  MAX_TEXT_LENGTH,
} from "@/lib/constants"
import type { BoardItem, ItemType } from "@/lib/types"

const ITEM_TYPES: ItemType[] = [
  "text",
  "sticky",
  "url",
  "image",
  "video",
  "audio",
  "drawing",
]

export function isItemType(value: unknown): value is ItemType {
  return typeof value === "string" && ITEM_TYPES.includes(value as ItemType)
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

export function clampItem(item: Pick<BoardItem, "x" | "y" | "width" | "height">) {
  const width = clamp(item.width, 40, BOARD_WIDTH)
  const height = clamp(item.height, 32, BOARD_HEIGHT)
  return {
    width,
    height,
    x: clamp(item.x, 0, BOARD_WIDTH - width),
    y: clamp(item.y, 0, BOARD_HEIGHT - height),
  }
}

export function defaultSize(type: ItemType) {
  return DEFAULT_SIZES[type] ?? { width: 200, height: 160 }
}

export function sanitizeText(value: unknown) {
  if (typeof value !== "string") return ""
  return value.slice(0, MAX_TEXT_LENGTH)
}

export function itemSnapshot(item: BoardItem): BoardItem {
  return { ...item, payload: { ...item.payload } }
}
