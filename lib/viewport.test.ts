import { describe, expect, it } from "vitest"
import { MAX_ZOOM } from "@/lib/constants"
import { easePalmer, focusViewForItem, lerpView, type ViewState } from "@/lib/viewport"

const viewport = { w: 1000, h: 800 }

describe("easePalmer", () => {
  it("starts at 0 and ends at 1", () => {
    expect(easePalmer(0)).toBe(0)
    expect(easePalmer(1)).toBe(1)
  })

  it("is ease-out (midpoint ahead of linear)", () => {
    expect(easePalmer(0.5)).toBeGreaterThan(0.5)
  })
})

describe("lerpView", () => {
  it("interpolates pan and zoom", () => {
    const from: ViewState = { pan: { x: 0, y: 0 }, zoom: 0.5 }
    const to: ViewState = { pan: { x: 100, y: 40 }, zoom: 1 }
    expect(lerpView(from, to, 0.25)).toEqual({
      pan: { x: 25, y: 10 },
      zoom: 0.625,
    })
  })

  it("clamps t to [0, 1]", () => {
    const from: ViewState = { pan: { x: 0, y: 0 }, zoom: 0.5 }
    const to: ViewState = { pan: { x: 100, y: 40 }, zoom: 1 }
    expect(lerpView(from, to, -1)).toEqual(from)
    expect(lerpView(from, to, 2)).toEqual(to)
  })
})

describe("focusViewForItem", () => {
  it("does not change a fully padded in-view item", () => {
    const current: ViewState = { pan: { x: 0, y: 0 }, zoom: 1 }
    const item = { x: 200, y: 200, width: 120, height: 80 }
    expect(focusViewForItem(item, current, viewport)).toEqual(current)
  })

  it("pans without zooming when the item is on-screen but closer than 64px to an edge", () => {
    const current: ViewState = { pan: { x: 0, y: 0 }, zoom: 1 }
    const item = { x: 10, y: 20, width: 80, height: 60 }
    const next = focusViewForItem(item, current, viewport)
    expect(next.zoom).toBe(1)
    expect(next.pan.x).toBe(54)
    expect(next.pan.y).toBe(44)
  })

  it("never zooms out, and clamps zoom to MAX_ZOOM when framing a small far item", () => {
    const current: ViewState = { pan: { x: 0, y: 0 }, zoom: 0.2 }
    const item = { x: 7000, y: 4200, width: 80, height: 80 }
    const next = focusViewForItem(item, current, viewport)
    expect(next.zoom).toBe(MAX_ZOOM)
    expect(next.zoom).toBeGreaterThanOrEqual(current.zoom)
  })

  it("keeps current zoom when the item is larger than the padded viewport", () => {
    const current: ViewState = { pan: { x: 0, y: 0 }, zoom: 0.72 }
    const item = { x: 100, y: 100, width: 4000, height: 3000 }
    const next = focusViewForItem(item, current, viewport)
    expect(next.zoom).toBe(0.72)
  })
})
