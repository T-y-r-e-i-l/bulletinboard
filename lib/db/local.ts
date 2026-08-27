import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { randomUUID } from "node:crypto"
import type { Board, BoardItem, ItemEvent } from "@/lib/types"

type Store = {
  boards: Board[]
  items: BoardItem[]
  events: ItemEvent[]
}

const DATA_DIR = path.join(process.cwd(), ".data")
const STORE_PATH = path.join(DATA_DIR, "store.json")

const g = globalThis as typeof globalThis & {
  __storeMutex?: Promise<void>
}

function emptyStore(): Store {
  return { boards: [], items: [], events: [] }
}

async function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const previous = g.__storeMutex ?? Promise.resolve()
  let release: () => void = () => {}
  g.__storeMutex = new Promise<void>((resolve) => {
    release = resolve
  })
  await previous
  try {
    return await fn()
  } finally {
    release()
  }
}

async function readStore(): Promise<Store> {
  try {
    const raw = await readFile(STORE_PATH, "utf8")
    return JSON.parse(raw) as Store
  } catch {
    return emptyStore()
  }
}

async function writeStore(store: Store) {
  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(STORE_PATH, JSON.stringify(store), "utf8")
}

export async function localEnsureBoard(boardDate: string): Promise<Board> {
  return withLock(async () => {
    const store = await readStore()
    const existing = store.boards.find((b) => b.board_date === boardDate)
    if (existing) {
      const today = store.boards
        .filter((b) => b.board_date < boardDate && !b.archived_at)
        .map((b) => {
          b.archived_at = new Date().toISOString()
          return b
        })
      if (today.length) await writeStore(store)
      return existing
    }
    const now = new Date().toISOString()
    for (const board of store.boards) {
      if (!board.archived_at && board.board_date < boardDate) {
        board.archived_at = now
      }
    }
    const board: Board = {
      id: randomUUID(),
      board_date: boardDate,
      created_at: now,
      archived_at: null,
    }
    store.boards.push(board)
    await writeStore(store)
    return board
  })
}

export async function localGetBoardByDate(boardDate: string) {
  const store = await readStore()
  return store.boards.find((b) => b.board_date === boardDate) ?? null
}

export async function localGetBoard(id: string) {
  const store = await readStore()
  return store.boards.find((b) => b.id === id) ?? null
}

export async function localNeighborDates(boardDate: string) {
  const store = await readStore()
  const dates = store.boards.map((b) => b.board_date).sort()
  const prev = [...dates].reverse().find((d) => d < boardDate) ?? null
  const next = dates.find((d) => d > boardDate) ?? null
  return { prev, next }
}

export async function localListItems(boardId: string) {
  const store = await readStore()
  return store.items
    .filter((item) => item.board_id === boardId)
    .sort((a, b) => a.z_index - b.z_index)
}

export async function localGetItem(id: string) {
  const store = await readStore()
  return store.items.find((item) => item.id === id) ?? null
}

export async function localInsertItem(item: BoardItem, actorName: string) {
  return withLock(async () => {
    const store = await readStore()
    store.items.push(item)
    store.events.push({
      id: randomUUID(),
      board_id: item.board_id,
      item_id: item.id,
      action: "insert",
      actor_name: actorName,
      snapshot: item,
      created_at: new Date().toISOString(),
    })
    await writeStore(store)
    return item
  })
}

export async function localUpdateItem(
  id: string,
  patch: Partial<BoardItem>,
  actorName: string,
  recordEvent: boolean,
) {
  return withLock(async () => {
    const store = await readStore()
    const index = store.items.findIndex((item) => item.id === id)
    if (index < 0) return null
    const next: BoardItem = {
      ...store.items[index]!,
      ...patch,
      updated_at: new Date().toISOString(),
    }
    store.items[index] = next
    if (recordEvent) {
      store.events.push({
        id: randomUUID(),
        board_id: next.board_id,
        item_id: next.id,
        action: "update",
        actor_name: actorName,
        snapshot: next,
        created_at: new Date().toISOString(),
      })
    }
    await writeStore(store)
    return next
  })
}

export async function localDeleteItem(id: string, actorName: string) {
  return withLock(async () => {
    const store = await readStore()
    const index = store.items.findIndex((item) => item.id === id)
    if (index < 0) return null
    const [removed] = store.items.splice(index, 1)
    store.events.push({
      id: randomUUID(),
      board_id: removed!.board_id,
      item_id: removed!.id,
      action: "delete",
      actor_name: actorName,
      snapshot: null,
      created_at: new Date().toISOString(),
    })
    await writeStore(store)
    return removed!
  })
}

export async function localListEvents(boardId: string) {
  const store = await readStore()
  return store.events
    .filter((event) => event.board_id === boardId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
}

export async function localMaxZ(boardId: string) {
  const items = await localListItems(boardId)
  return items.reduce((max, item) => Math.max(max, item.z_index), 0)
}
