"use client"

import { useEffect, useMemo, useState } from "react"
import { Pause, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { BoardItemView } from "@/components/board/BoardItemView"
import { BOARD_HEIGHT, BOARD_WIDTH } from "@/lib/constants"
import type { BoardItem, ItemEvent } from "@/lib/types"

type TimedEvent = ItemEvent & { playAt: number }

function timedEvents(events: ItemEvent[]): TimedEvent[] {
  if (!events.length) return []
  const start = new Date(events[0]!.created_at).getTime()
  let cursor = 0
  return events.map((event, index) => {
    if (index === 0) return { ...event, playAt: 0 }
    const previous = new Date(events[index - 1]!.created_at).getTime()
    const current = new Date(event.created_at).getTime()
    const gap = Math.min(1200, Math.max(180, (current - previous) * 0.04))
    cursor += Number.isFinite(gap) ? gap : 400
    void start
    return { ...event, playAt: cursor }
  })
}

function itemsAt(events: TimedEvent[], time: number) {
  const map = new Map<string, BoardItem>()
  for (const event of events) {
    if (event.playAt > time) break
    if (event.action === "delete") {
      map.delete(event.item_id)
    } else if (event.snapshot) {
      map.set(event.item_id, event.snapshot)
    }
  }
  return [...map.values()]
}

export function TimelapsePlayer({
  boardId,
  open,
  onClose,
}: {
  boardId: string
  open: boolean
  onClose: () => void
}) {
  const [events, setEvents] = useState<TimedEvent[]>([])
  const [playing, setPlaying] = useState(true)
  const [speed, setSpeed] = useState(1)
  const [time, setTime] = useState(0)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    fetch(`/api/events?boardId=${boardId}`)
      .then((response) => response.json())
      .then((data: { events: ItemEvent[] }) => {
        if (!cancelled) {
          setEvents(timedEvents(data.events ?? []))
          setTime(0)
          setPlaying(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [boardId, open])

  const duration = events.at(-1)?.playAt ?? 0
  const framed = useMemo(() => itemsAt(events, time), [events, time])

  useEffect(() => {
    if (!open || !playing || duration === 0) return
    let frame = 0
    let last = performance.now()
    const tick = (now: number) => {
      const delta = (now - last) * speed
      last = now
      setTime((current) => {
        const next = current + delta
        if (next >= duration) {
          setPlaying(false)
          return duration
        }
        return next
      })
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [open, playing, speed, duration])

  if (!open) return null

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-[#1c1814]/70 backdrop-blur-[2px]">
      <div className="relative mx-auto mt-16 mb-24 flex min-h-0 flex-1 items-center justify-center overflow-hidden px-6">
        <div
          className="origin-center"
          style={{
            width: BOARD_WIDTH,
            height: BOARD_HEIGHT,
            transform: `scale(${Math.min(0.08, 1100 / BOARD_WIDTH, 620 / BOARD_HEIGHT)})`,
          }}
        >
          <div className="wall-surface h-full w-full overflow-hidden">
            {framed.map((item) => (
              <BoardItemView
                key={item.id}
                item={item}
                selected={false}
                readOnly
                onSelect={(event) => event.preventDefault()}
                onCommitText={() => {}}
              />
            ))}
            {!events.length ? (
              <p className="absolute inset-0 flex items-center justify-center text-2xl text-stone-400">
                Nothing happened on this wall yet.
              </p>
            ) : null}
          </div>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-6 mx-auto flex w-[min(640px,92vw)] items-center gap-3 rounded-full border border-white/10 bg-[#1c1814]/90 px-4 py-2 text-stone-100 shadow-xl">
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-stone-100"
          onClick={() => setPlaying((value) => !value)}
        >
          {playing ? <Pause /> : <Play />}
        </Button>
        <Slider
          value={[duration ? (time / duration) * 100 : 0]}
          onValueChange={(value) => {
            setPlaying(false)
            setTime(((value[0] ?? 0) / 100) * duration)
          }}
        />
        <div className="flex gap-1">
          {[1, 2, 8].map((value) => (
            <Button
              key={value}
              size="xs"
              variant={speed === value ? "secondary" : "ghost"}
              className="text-stone-100"
              onClick={() => setSpeed(value)}
            >
              {value}x
            </Button>
          ))}
        </div>
        <Button size="sm" variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  )
}
