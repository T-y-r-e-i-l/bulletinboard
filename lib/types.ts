export type ItemType =
  | "text"
  | "sticky"
  | "url"
  | "image"
  | "video"
  | "audio"
  | "drawing"

export type ItemAction = "insert" | "update" | "delete"

export type Tool =
  | "select"
  | "draw"
  | "text"
  | "sticky"
  | "url"
  | "image"
  | "video"
  | "audio"

export type Point = { x: number; y: number }

export type Stroke = {
  points: Point[]
  color: string
  size: number
  brush: "pen" | "marker" | "highlighter"
}

export type Board = {
  id: string
  board_date: string
  created_at: string
  archived_at: string | null
}

export type BoardItem = {
  id: string
  board_id: string
  type: ItemType
  x: number
  y: number
  width: number
  height: number
  z_index: number
  payload: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type ItemEvent = {
  id: string
  board_id: string
  item_id: string
  action: ItemAction
  actor_name: string
  snapshot: BoardItem | null
  created_at: string
}

export type Identity = {
  name: string
  color: string
  animal: string
  emoji: string
}

export type PresenceUser = Identity & {
  sessionId: string
  self?: boolean
}

export type NeighborDates = {
  prev: string | null
  next: string | null
}

export type CursorPayload = {
  sessionId: string
  name: string
  color: string
  x: number
  y: number
}
