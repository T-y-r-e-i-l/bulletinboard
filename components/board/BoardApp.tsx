"use client"

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent, type WheelEvent } from "react"
import { Inspector } from "@/components/board/Inspector"
import { BoardItemView } from "@/components/board/BoardItemView"
import { TimelapsePlayer } from "@/components/board/TimelapsePlayer"
import { Toolbar } from "@/components/board/Toolbar"
import { TopBar } from "@/components/board/TopBar"
import { ViewControls } from "@/components/board/ViewControls"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  DEFAULT_ZOOM,
  VIEW_ANIMATION_MS,
  ZOOM_STEP,
} from "@/lib/constants"
import { boundsForStrokes, pointsToPath, strokeStyle } from "@/lib/drawing"
import { centerPan, clampPan, defaultView, easePalmer, focusViewForItem, lerpView, zoomAround } from "@/lib/viewport"
import { usesSupabase } from "@/lib/flags"
import { createBrowserClient } from "@/lib/supabase/browser"
import type {
  Board,
  BoardItem,
  CursorPayload,
  Identity,
  NeighborDates,
  Point,
  PresenceUser,
  Stroke,
  Tool,
} from "@/lib/types"
import { cn } from "@/lib/utils"

type Props = {
  board: Board
  initialItems: BoardItem[]
  identity: Identity
  neighbors: NeighborDates
  readOnly: boolean
}

export function BoardApp({ board, initialItems, identity, neighbors, readOnly }: Props) {
  const [items, setItems] = useState<BoardItem[]>(initialItems)
  const [tool, setTool] = useState<Tool>("select")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(DEFAULT_ZOOM)
  const [drawColor, setDrawColor] = useState("#1c1917")
  const [drawSize, setDrawSize] = useState(4)
  const [drawBrush, setDrawBrush] = useState<"pen" | "marker" | "highlighter">("pen")
  const [liveStroke, setLiveStroke] = useState<Stroke | null>(null)
  const [remoteInk, setRemoteInk] = useState<Record<string, Stroke>>({})
  const [cursors, setCursors] = useState<Record<string, CursorPayload>>({})
  const [users, setUsers] = useState<PresenceUser[]>([])
  const [localCursor, setLocalCursor] = useState<Point | null>(null)
  const [urlOpen, setUrlOpen] = useState(false)
  const [urlValue, setUrlValue] = useState("")
  const [timelapse, setTimelapse] = useState(false)
  const [sessionId] = useState(() => crypto.randomUUID())
  const viewportRef = useRef<HTMLDivElement>(null)
  const viewAnimRef = useRef<number | null>(null)
  const viewRef = useRef({ pan, zoom })
  viewRef.current = { pan, zoom }
  const pointerMovedRef = useRef(false)
  const clickFocusIdRef = useRef<string | null>(null)
  const clickFocusOriginRef = useRef<{ x: number; y: number } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const dragRef = useRef<{
    mode: "pan" | "item" | "resize" | "draw"
    id?: string
    startX: number
    startY: number
    origX: number
    origY: number
    origW: number
    origH: number
  } | null>(null)
  const itemsRef = useRef(items)
  itemsRef.current = items

  const selected = items.find((item) => item.id === selectedId) ?? null
  const selfUser: PresenceUser = useMemo(
    () => ({ ...identity, sessionId, self: true }),
    [identity, sessionId],
  )
  const lastCursor = useRef(0)
  const lastInk = useRef(0)
  const liveStrokeRef = useRef<Stroke | null>(null)

  const screenToBoard = useCallback(
    (clientX: number, clientY: number) => {
      const rect = viewportRef.current?.getBoundingClientRect()
      if (!rect) return { x: 0, y: 0 }
      return {
        x: (clientX - rect.left - pan.x) / zoom,
        y: (clientY - rect.top - pan.y) / zoom,
      }
    },
    [pan.x, pan.y, zoom],
  )

  const viewportSize = useCallback(() => {
    const rect = viewportRef.current?.getBoundingClientRect()
    return { w: rect?.width ?? 1280, h: rect?.height ?? 800 }
  }, [])

  const cancelViewAnim = useCallback(() => {
    if (viewAnimRef.current != null) {
      cancelAnimationFrame(viewAnimRef.current)
      viewAnimRef.current = null
    }
  }, [])

  const animateToView = useCallback(
    (next: { pan: { x: number; y: number }; zoom: number }) => {
      const { w, h } = viewportSize()
      const to = {
        zoom: next.zoom,
        pan: clampPan(next.pan.x, next.pan.y, next.zoom, w, h),
      }
      const from = { ...viewRef.current }
      cancelViewAnim()
      const started = performance.now()
      const tick = (now: number) => {
        const t = Math.min(1, (now - started) / VIEW_ANIMATION_MS)
        const view = lerpView(from, to, easePalmer(t))
        viewRef.current = view
        setZoom(view.zoom)
        setPan(view.pan)
        if (t < 1) viewAnimRef.current = requestAnimationFrame(tick)
        else viewAnimRef.current = null
      }
      viewAnimRef.current = requestAnimationFrame(tick)
    },
    [cancelViewAnim, viewportSize],
  )

  const applyZoom = useCallback(
    (nextZoom: number, originX?: number, originY?: number) => {
      const { w, h } = viewportSize()
      const current = viewRef.current
      const result = zoomAround(
        current.zoom,
        nextZoom,
        current.pan,
        originX ?? w / 2,
        originY ?? h / 2,
        w,
        h,
      )
      animateToView(result)
    },
    [animateToView, viewportSize],
  )

  const recenter = useCallback(() => {
    const { w, h } = viewportSize()
    const { zoom: currentZoom } = viewRef.current
    animateToView({ zoom: currentZoom, pan: centerPan(currentZoom, w, h) })
  }, [animateToView, viewportSize])

  useEffect(() => () => cancelViewAnim(), [cancelViewAnim])

  useLayoutEffect(() => {
    const { w, h } = viewportSize()
    const view = defaultView(w, h)
    setZoom(view.zoom)
    setPan(view.pan)
  }, [viewportSize])

  useEffect(() => {
    function onResize() {
      const { w, h } = viewportSize()
      setPan((current) => clampPan(current.x, current.y, zoom, w, h))
    }
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [viewportSize, zoom])

  const upsertItem = useCallback((item: BoardItem) => {
    setItems((current) => {
      const index = current.findIndex((row) => row.id === item.id)
      if (index < 0) return [...current, item]
      const next = [...current]
      next[index] = item
      return next
    })
  }, [])

  const signal = useCallback(
    (payload: Record<string, unknown>) => {
      const body = { ...payload, boardId: board.id, sessionId }
      if (usesSupabase()) {
        const client = createBrowserClient()
        void client?.channel(`board:${board.id}`).send({
          type: "broadcast",
          event: String(payload.kind || "signal"),
          payload: body,
        })
        return
      }
      void fetch("/api/signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
    },
    [board.id, sessionId],
  )

  useEffect(() => {
    const source = new EventSource(`/api/realtime?boardId=${board.id}`)
    source.addEventListener("item", (event) => {
      const data = JSON.parse((event as MessageEvent).data) as {
        kind: string
        item: BoardItem
      }
      if (data.kind === "delete") {
        setItems((current) => current.filter((item) => item.id !== data.item.id))
        return
      }
      upsertItem(data.item)
    })
    source.addEventListener("presence", (event) => {
      const data = JSON.parse((event as MessageEvent).data) as { user?: PresenceUser }
      if (!data.user || data.user.sessionId === sessionId) return
      const incoming = data.user
      setUsers((current) => {
        const rest = current.filter((user) => user.sessionId !== incoming.sessionId)
        return [...rest, incoming]
      })
    })
    source.addEventListener("cursor", (event) => {
      const data = JSON.parse((event as MessageEvent).data) as CursorPayload
      if (data.sessionId === sessionId) return
      setCursors((current) => ({ ...current, [data.sessionId]: data }))
    })
    source.addEventListener("ink", (event) => {
      const data = JSON.parse((event as MessageEvent).data) as {
        sessionId: string
        stroke: Stroke | null
      }
      if (data.sessionId === sessionId) return
      setRemoteInk((current) => {
        const next = { ...current }
        if (!data.stroke) delete next[data.sessionId]
        else next[data.sessionId] = data.stroke
        return next
      })
    })
    return () => source.close()
  }, [board.id, sessionId, upsertItem])

  useEffect(() => {
    if (!usesSupabase()) return
    const client = createBrowserClient()
    if (!client) return
    const channel = client
      .channel(`board:${board.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "items", filter: `board_id=eq.${board.id}` },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const id = (payload.old as { id?: string }).id
            if (id) setItems((current) => current.filter((item) => item.id !== id))
            return
          }
          upsertItem(payload.new as BoardItem)
        },
      )
      .on("broadcast", { event: "cursor" }, ({ payload }) => {
        const data = payload as CursorPayload
        if (data.sessionId !== sessionId) {
          setCursors((current) => ({ ...current, [data.sessionId]: data }))
        }
      })
      .on("broadcast", { event: "ink" }, ({ payload }) => {
        const data = payload as { sessionId: string; stroke: Stroke | null }
        if (data.sessionId === sessionId) return
        setRemoteInk((current) => {
          const next = { ...current }
          if (!data.stroke) delete next[data.sessionId]
          else next[data.sessionId] = data.stroke
          return next
        })
      })
      .on("broadcast", { event: "presence" }, ({ payload }) => {
        const user = (payload as { user?: PresenceUser }).user
        if (!user || user.sessionId === sessionId) return
        setUsers((current) => {
          const rest = current.filter((row) => row.sessionId !== user.sessionId)
          return [...rest, user]
        })
      })
      .subscribe()
    return () => {
      void client.removeChannel(channel)
    }
  }, [board.id, sessionId, upsertItem])

  useEffect(() => {
    const tick = () => signal({ kind: "presence", user: selfUser })
    tick()
    const id = setInterval(tick, 4000)
    return () => clearInterval(id)
  }, [selfUser, signal])

  async function createItem(partial: Partial<BoardItem> & { type: BoardItem["type"] }) {
    const response = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ boardId: board.id, ...partial }),
    })
    const data = (await response.json()) as { item?: BoardItem; error?: string }
    if (data.item) {
      upsertItem(data.item)
      if (data.item.type !== "drawing") {
        setSelectedId(data.item.id)
        setTool("select")
      }
    }
  }

  async function patchItem(id: string, patch: Record<string, unknown>, recordEvent = true) {
    const response = await fetch(`/api/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...patch, recordEvent }),
    })
    const data = (await response.json()) as { item?: BoardItem }
    if (data.item) upsertItem(data.item)
  }

  async function removeItem(id: string) {
    await fetch(`/api/items/${id}`, { method: "DELETE" })
    setItems((current) => current.filter((item) => item.id !== id))
    setSelectedId(null)
  }

  async function uploadAt(file: File, kind: "image" | "video" | "audio", point: Point) {
    const form = new FormData()
    form.set("file", file)
    form.set("boardId", board.id)
    form.set("kind", kind)
    const uploaded = await fetch("/api/upload", { method: "POST", body: form })
    const data = (await uploaded.json()) as { url?: string; name?: string; error?: string }
    if (!data.url) return
    await createItem({
      type: kind,
      x: point.x,
      y: point.y,
      payload: { url: data.url, name: data.name },
    })
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (timelapse) return
    pointerMovedRef.current = false
    clickFocusIdRef.current = null
    clickFocusOriginRef.current = null
    const point = screenToBoard(event.clientX, event.clientY)
    const target = event.target as HTMLElement
    const itemEl = target.closest<HTMLElement>("[data-item-id]")
    const resize = target.dataset.resize === "1"

    if (tool === "draw" && !readOnly) {
      cancelViewAnim()
      const stroke: Stroke = {
        points: [point],
        color: drawColor,
        size: drawSize,
        brush: drawBrush,
      }
      setLiveStroke(stroke)
      liveStrokeRef.current = stroke
      dragRef.current = { mode: "draw", startX: point.x, startY: point.y, origX: 0, origY: 0, origW: 0, origH: 0 }
      signal({ kind: "ink", stroke })
      return
    }

    if (itemEl && tool === "select") {
      const id = itemEl.dataset.itemId!
      const item = itemsRef.current.find((row) => row.id === id)
      if (!item) return
      setSelectedId(id)
      if (readOnly) return
      if (target.isContentEditable && !resize) {
        clickFocusIdRef.current = id
        clickFocusOriginRef.current = { x: event.clientX, y: event.clientY }
        return
      }
      cancelViewAnim()
      void patchItem(id, { z_index: Math.max(...itemsRef.current.map((row) => row.z_index), 0) + 1 }, false)
      dragRef.current = {
        mode: resize ? "resize" : "item",
        id,
        startX: point.x,
        startY: point.y,
        origX: item.x,
        origY: item.y,
        origW: item.width,
        origH: item.height,
      }
      return
    }

    if (!itemEl && (tool === "select" || event.button === 1)) {
      setSelectedId(null)
      cancelViewAnim()
      dragRef.current = {
        mode: "pan",
        startX: event.clientX,
        startY: event.clientY,
        origX: viewRef.current.pan.x,
        origY: viewRef.current.pan.y,
        origW: 0,
        origH: 0,
      }
      return
    }

    if (readOnly) return
    if (tool === "text") void createItem({ type: "text", x: point.x, y: point.y })
    if (tool === "sticky") void createItem({ type: "sticky", x: point.x, y: point.y })
    if (tool === "url") {
      setUrlOpen(true)
      pendingPoint.current = point
    }
    if (tool === "image" || tool === "video" || tool === "audio") {
      pendingPoint.current = point
      pendingKind.current = tool
      fileRef.current?.click()
    }
  }

  const pendingPoint = useRef<Point>({ x: 120, y: 120 })
  const pendingKind = useRef<"image" | "video" | "audio">("image")

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const point = screenToBoard(event.clientX, event.clientY)
    setLocalCursor(point)
    const now = Date.now()
    if (now - lastCursor.current > 80) {
      lastCursor.current = now
      signal({
        kind: "cursor",
        sessionId,
        name: identity.name,
        color: identity.color,
        x: point.x,
        y: point.y,
      })
    }
    const drag = dragRef.current
    if (!drag) return
    if (drag.mode === "item" || drag.mode === "resize") {
      const dx = point.x - drag.startX
      const dy = point.y - drag.startY
      if (Math.hypot(dx, dy) > 4) pointerMovedRef.current = true
    }
    if (drag.mode === "pan") {
      const dx = event.clientX - drag.startX
      const dy = event.clientY - drag.startY
      if (Math.hypot(dx, dy) > 4) pointerMovedRef.current = true
    }
    if (drag.mode === "pan") {
      const { w, h } = viewportSize()
      setPan(
        clampPan(
          drag.origX + (event.clientX - drag.startX),
          drag.origY + (event.clientY - drag.startY),
          viewRef.current.zoom,
          w,
          h,
        ),
      )
    }
    if (drag.mode === "item" && drag.id) {
      const x = drag.origX + (point.x - drag.startX)
      const y = drag.origY + (point.y - drag.startY)
      setItems((current) => {
        const next = current.map((item) => (item.id === drag.id ? { ...item, x, y } : item))
        itemsRef.current = next
        return next
      })
    }
    if (drag.mode === "resize" && drag.id) {
      const width = Math.max(80, drag.origW + (point.x - drag.startX))
      const height = Math.max(48, drag.origH + (point.y - drag.startY))
      setItems((current) => {
        const next = current.map((item) => (item.id === drag.id ? { ...item, width, height } : item))
        itemsRef.current = next
        return next
      })
    }
    if (drag.mode === "draw") {
      setLiveStroke((stroke) => {
        if (!stroke) return stroke
        const next = { ...stroke, points: [...stroke.points, point] }
        liveStrokeRef.current = next
        if (Date.now() - lastInk.current > 40) {
          lastInk.current = Date.now()
          signal({ kind: "ink", stroke: next })
        }
        return next
      })
    }
  }

  async function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    dragRef.current = null
    const clickFocusId = clickFocusIdRef.current
    const clickFocusOrigin = clickFocusOriginRef.current
    clickFocusIdRef.current = null
    clickFocusOriginRef.current = null
    const clickFocusMoved =
      clickFocusOrigin != null &&
      Math.hypot(event.clientX - clickFocusOrigin.x, event.clientY - clickFocusOrigin.y) > 4
    const focusId =
      !pointerMovedRef.current && !clickFocusMoved && !readOnly
        ? drag?.mode === "item" && drag.id
          ? drag.id
          : clickFocusId
        : null
    if (focusId) {
      const item = itemsRef.current.find((row) => row.id === focusId)
      const { w, h } = viewportSize()
      if (item) animateToView(focusViewForItem(item, viewRef.current, { w, h }))
    }
    if (drag?.mode === "item" && drag.id) {
      const item = itemsRef.current.find((row) => row.id === drag.id)
      if (item) void patchItem(item.id, { x: item.x, y: item.y }, true)
    }
    if (drag?.mode === "resize" && drag.id) {
      const item = itemsRef.current.find((row) => row.id === drag.id)
      if (item) void patchItem(item.id, { width: item.width, height: item.height }, true)
    }
    if (drag?.mode === "draw" && liveStrokeRef.current) {
      const strokes = [liveStrokeRef.current]
      const box = boundsForStrokes(strokes)
      await createItem({
        type: "drawing",
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
        payload: { strokes },
      })
      liveStrokeRef.current = null
      setLiveStroke(null)
      signal({ kind: "ink", stroke: null })
    }
  }

  function onWheel(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault()
    const { w, h } = viewportSize()
    cancelViewAnim()
    const current = viewRef.current
    if (event.ctrlKey || event.metaKey) {
      const rect = viewportRef.current?.getBoundingClientRect()
      animateToView(
        zoomAround(
          current.zoom,
          current.zoom * (event.deltaY > 0 ? 1 / 1.06 : 1.06),
          current.pan,
          event.clientX - (rect?.left ?? 0),
          event.clientY - (rect?.top ?? 0),
          w,
          h,
        ),
      )
      return
    }
    animateToView({
      zoom: current.zoom,
      pan: clampPan(current.pan.x - event.deltaX, current.pan.y - event.deltaY, current.zoom, w, h),
    })
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedId(null)
      if ((event.key === "Backspace" || event.key === "Delete") && selectedId && !readOnly) {
        const target = event.target as HTMLElement
        if (target.isContentEditable || target.tagName === "INPUT") return
        void removeItem(selectedId)
      }
      if (event.key === "v") setTool("select")
      if (event.target instanceof HTMLElement && (event.target.isContentEditable || event.target.tagName === "INPUT")) {
        return
      }
      if (event.key === "=" || event.key === "+") {
        event.preventDefault()
        applyZoom(viewRef.current.zoom * ZOOM_STEP)
      }
      if (event.key === "-" || event.key === "_") {
        event.preventDefault()
        applyZoom(viewRef.current.zoom / ZOOM_STEP)
      }
      if (event.key === "0") {
        event.preventDefault()
        recenter()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [applyZoom, readOnly, recenter, selectedId])

  const presenceList = useMemo(() => {
    const map = new Map<string, PresenceUser>()
    map.set(sessionId, selfUser)
    for (const user of users) map.set(user.sessionId, user)
    return [...map.values()]
  }, [selfUser, users, sessionId])

  return (
    <div className="relative h-dvh w-full overflow-hidden">
      <TopBar
        boardDate={board.board_date}
        readOnly={readOnly}
        neighbors={neighbors}
        users={presenceList}
        identity={identity}
        onTimelapse={() => setTimelapse(true)}
      />
      {!readOnly && !timelapse ? (
        <>
          <Toolbar tool={tool} onTool={setTool} />
          <Inspector
            tool={tool}
            selected={selected}
            drawColor={drawColor}
            drawSize={drawSize}
            drawBrush={drawBrush}
            onDrawColor={setDrawColor}
            onDrawSize={setDrawSize}
            onDrawBrush={setDrawBrush}
            onChangePayload={(payload) => {
              if (!selected) return
              const next = { ...selected.payload, ...payload }
              setItems((current) =>
                current.map((item) => (item.id === selected.id ? { ...item, payload: next } : item)),
              )
              void patchItem(selected.id, { payload: next })
            }}
            onDelete={() => selected && void removeItem(selected.id)}
          />
        </>
      ) : null}
      {!timelapse ? (
        <ViewControls
          zoom={zoom}
          onZoomIn={() => applyZoom(viewRef.current.zoom * ZOOM_STEP)}
          onZoomOut={() => applyZoom(viewRef.current.zoom / ZOOM_STEP)}
          onRecenter={recenter}
          pan={pan}
          viewport={viewportSize()}
          cursor={localCursor}
          cursorColor={identity.color}
          remoteCursors={Object.values(cursors)}
          items={items}
          onJump={(x, y) => {
            const { w, h } = viewportSize()
            const { zoom: currentZoom } = viewRef.current
            animateToView({
              zoom: currentZoom,
              pan: clampPan(w / 2 - x * currentZoom, h / 2 - y * currentZoom, currentZoom, w, h),
            })
          }}
        />
      ) : null}

      <div
        ref={viewportRef}
        className={cn("h-full w-full cursor-grab overflow-hidden bg-[#F5F5F5]", tool === "draw" && "cursor-crosshair")}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onWheel={onWheel}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault()
          if (readOnly) return
          const file = event.dataTransfer.files[0]
          if (!file) return
          const point = screenToBoard(event.clientX, event.clientY)
          const kind = file.type.startsWith("video")
            ? "video"
            : file.type.startsWith("audio")
              ? "audio"
              : "image"
          void uploadAt(file, kind, point)
        }}
      >
        <div
          className="origin-top-left"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            width: BOARD_WIDTH,
            height: BOARD_HEIGHT,
          }}
        >
          <div className="relative h-full w-full bg-[#F5F5F5]">
            {items.map((item) => (
              <BoardItemView
                key={item.id}
                item={item}
                selected={item.id === selectedId}
                readOnly={readOnly}
                onSelect={(event) => {
                  event.stopPropagation()
                  onPointerDown(event as unknown as PointerEvent<HTMLDivElement>)
                }}
                onCommitText={(content) => void patchItem(item.id, { payload: { ...item.payload, content } })}
              />
            ))}
            <svg className="pointer-events-none absolute inset-0 h-full w-full">
              {liveStroke ? <path d={pointsToPath(liveStroke.points)} {...strokeStyle(liveStroke)} /> : null}
              {Object.values(remoteInk).map((stroke, index) => (
                <path key={index} d={pointsToPath(stroke.points)} {...strokeStyle(stroke)} />
              ))}
            </svg>
            {Object.values(cursors).map((cursor) => (
              <div
                key={cursor.sessionId}
                className="pointer-events-none absolute z-50"
                style={{ left: cursor.x, top: cursor.y }}
              >
                <svg width="18" height="22" viewBox="0 0 18 22" aria-hidden>
                  <path d="M1 1 L1 18 L6 13 L11 21 L14 19 L9 12 L17 12 Z" fill={cursor.color} stroke="#FFFFFF" />
                </svg>
                <span className="ml-3 rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-[#111111] shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
                  {cursor.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ""
          if (file) void uploadAt(file, pendingKind.current, pendingPoint.current)
        }}
      />

      <Dialog open={urlOpen} onOpenChange={setUrlOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pin a link</DialogTitle>
          </DialogHeader>
          <input
            value={urlValue}
            onChange={(event) => setUrlValue(event.target.value)}
            placeholder="https://"
            className="w-full rounded-[20px] border border-black/10 bg-white px-3 py-2 text-[#111111]"
          />
          <Button
            onClick={() => {
              setUrlOpen(false)
              void createItem({
                type: "url",
                x: pendingPoint.current.x,
                y: pendingPoint.current.y,
                payload: { href: urlValue },
              })
              setUrlValue("")
            }}
          >
            Add to wall
          </Button>
        </DialogContent>
      </Dialog>

      <TimelapsePlayer boardId={board.id} open={timelapse} onClose={() => setTimelapse(false)} />
    </div>
  )
}
