import { randomUUID } from "node:crypto"
import { MEDIA_BUCKET } from "@/lib/constants"
import { usesSupabaseAdmin } from "@/lib/flags"
import { createAdminClient, createAnonServerClient } from "@/lib/supabase/server"
import type { Board, BoardItem, NeighborDates } from "@/lib/types"
import {
  localDeleteItem,
  localEnsureBoard,
  localGetBoard,
  localGetBoardByDate,
  localGetItem,
  localInsertItem,
  localListItems,
  localMaxZ,
  localNeighborDates,
  localUpdateItem,
} from "@/lib/db/local"

export async function ensureBoard(boardDate: string): Promise<Board> {
  if (usesSupabaseAdmin()) {
    const admin = createAdminClient()!
    const { data: existing, error } = await admin
      .from("boards")
      .select("*")
      .eq("board_date", boardDate)
      .maybeSingle()
    if (error) throw error
    if (existing) {
      await admin
        .from("boards")
        .update({ archived_at: new Date().toISOString() })
        .is("archived_at", null)
        .lt("board_date", boardDate)
      return existing as Board
    }
    const { data, error: insertError } = await admin
      .from("boards")
      .insert({ board_date: boardDate })
      .select("*")
      .single()
    if (insertError) throw insertError
    await admin
      .from("boards")
      .update({ archived_at: new Date().toISOString() })
      .is("archived_at", null)
      .lt("board_date", boardDate)
    return data as Board
  }
  return localEnsureBoard(boardDate)
}

export async function getBoardByDate(boardDate: string) {
  if (usesSupabaseAdmin()) {
    const client = createAnonServerClient() ?? createAdminClient()
    const { data, error } = await client!
      .from("boards")
      .select("*")
      .eq("board_date", boardDate)
      .maybeSingle()
    if (error) throw error
    return (data as Board | null) ?? null
  }
  return localGetBoardByDate(boardDate)
}

export async function getBoard(id: string) {
  if (usesSupabaseAdmin()) {
    const client = createAnonServerClient() ?? createAdminClient()
    const { data, error } = await client!.from("boards").select("*").eq("id", id).maybeSingle()
    if (error) throw error
    return (data as Board | null) ?? null
  }
  return localGetBoard(id)
}

export async function neighborDates(boardDate: string): Promise<NeighborDates> {
  if (usesSupabaseAdmin()) {
    const client = createAnonServerClient() ?? createAdminClient()
    const { data: prev } = await client!
      .from("boards")
      .select("board_date")
      .lt("board_date", boardDate)
      .order("board_date", { ascending: false })
      .limit(1)
    const { data: next } = await client!
      .from("boards")
      .select("board_date")
      .gt("board_date", boardDate)
      .order("board_date", { ascending: true })
      .limit(1)
    return {
      prev: prev?.[0]?.board_date ?? null,
      next: next?.[0]?.board_date ?? null,
    }
  }
  return localNeighborDates(boardDate)
}

export async function listItems(boardId: string) {
  if (usesSupabaseAdmin()) {
    const client = createAnonServerClient() ?? createAdminClient()
    const { data, error } = await client!
      .from("items")
      .select("*")
      .eq("board_id", boardId)
      .order("z_index", { ascending: true })
    if (error) throw error
    return (data ?? []) as BoardItem[]
  }
  return localListItems(boardId)
}

export async function getItem(id: string) {
  if (usesSupabaseAdmin()) {
    const client = createAdminClient()!
    const { data, error } = await client.from("items").select("*").eq("id", id).maybeSingle()
    if (error) throw error
    return (data as BoardItem | null) ?? null
  }
  return localGetItem(id)
}

export async function maxZ(boardId: string) {
  if (usesSupabaseAdmin()) {
    const client = createAdminClient()!
    const { data, error } = await client
      .from("items")
      .select("z_index")
      .eq("board_id", boardId)
      .order("z_index", { ascending: false })
      .limit(1)
    if (error) throw error
    return data?.[0]?.z_index ?? 0
  }
  return localMaxZ(boardId)
}

export async function insertItem(item: Omit<BoardItem, "created_at" | "updated_at">) {
  const now = new Date().toISOString()
  const full: BoardItem = { ...item, created_at: now, updated_at: now }
  if (usesSupabaseAdmin()) {
    const admin = createAdminClient()!
    const { data, error } = await admin.from("items").insert(item).select("*").single()
    if (error) throw error
    return data as BoardItem
  }
  return localInsertItem(full)
}

export async function updateItem(id: string, patch: Partial<BoardItem>) {
  if (usesSupabaseAdmin()) {
    const admin = createAdminClient()!
    const { data, error } = await admin.from("items").update(patch).eq("id", id).select("*").single()
    if (error) throw error
    return data as BoardItem
  }
  return localUpdateItem(id, patch)
}

export async function deleteItem(id: string) {
  const existing = await getItem(id)
  if (!existing) return null
  if (usesSupabaseAdmin()) {
    const admin = createAdminClient()!
    const { error } = await admin.from("items").delete().eq("id", id)
    if (error) throw error
    return existing
  }
  return localDeleteItem(id)
}

export async function newItemId() {
  return randomUUID()
}

export { MEDIA_BUCKET }
