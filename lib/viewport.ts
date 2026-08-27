import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  DEFAULT_ZOOM,
  FOCUS_PADDING_PX,
  MAX_ZOOM,
  MIN_ZOOM,
  PAN_MARGIN,
} from "@/lib/constants"
import { clamp } from "@/lib/geometry"

export function clampZoom(zoom: number) {
  return clamp(zoom, MIN_ZOOM, MAX_ZOOM)
}

export function clampPan(
  x: number,
  y: number,
  zoom: number,
  viewportWidth: number,
  viewportHeight: number,
) {
  const scaledW = BOARD_WIDTH * zoom
  const scaledH = BOARD_HEIGHT * zoom
  const margin = PAN_MARGIN

  let minX: number
  let maxX: number
  if (scaledW <= viewportWidth - margin * 2) {
    const centered = (viewportWidth - scaledW) / 2
    minX = centered
    maxX = centered
  } else {
    minX = viewportWidth - scaledW - margin
    maxX = margin
  }

  let minY: number
  let maxY: number
  if (scaledH <= viewportHeight - margin * 2) {
    const centered = (viewportHeight - scaledH) / 2
    minY = centered
    maxY = centered
  } else {
    minY = viewportHeight - scaledH - margin
    maxY = margin
  }

  return {
    x: clamp(x, minX, maxX),
    y: clamp(y, minY, maxY),
  }
}

export function centerPan(zoom: number, viewportWidth: number, viewportHeight: number) {
  return clampPan(
    (viewportWidth - BOARD_WIDTH * zoom) / 2,
    (viewportHeight - BOARD_HEIGHT * zoom) / 2,
    zoom,
    viewportWidth,
    viewportHeight,
  )
}

export function zoomAround(
  currentZoom: number,
  nextZoom: number,
  pan: { x: number; y: number },
  originX: number,
  originY: number,
  viewportWidth: number,
  viewportHeight: number,
) {
  const zoom = clampZoom(nextZoom)
  const boardX = (originX - pan.x) / currentZoom
  const boardY = (originY - pan.y) / currentZoom
  return {
    zoom,
    pan: clampPan(
      originX - boardX * zoom,
      originY - boardY * zoom,
      zoom,
      viewportWidth,
      viewportHeight,
    ),
  }
}

export function defaultView(viewportWidth: number, viewportHeight: number) {
  const zoom = clampZoom(DEFAULT_ZOOM)
  return { zoom, pan: centerPan(zoom, viewportWidth, viewportHeight) }
}

export type ViewState = {
  pan: { x: number; y: number }
  zoom: number
}

/** Approximates CSS cubic-bezier(0.22, 1, 0.36, 1). */
export function easePalmer(t: number) {
  const x = clamp(t, 0, 1)
  return 1 - (1 - x) ** 4
}

export function lerpView(from: ViewState, to: ViewState, t: number): ViewState {
  const k = clamp(t, 0, 1)
  return {
    zoom: from.zoom + (to.zoom - from.zoom) * k,
    pan: {
      x: from.pan.x + (to.pan.x - from.pan.x) * k,
      y: from.pan.y + (to.pan.y - from.pan.y) * k,
    },
  }
}

function itemScreenRect(
  item: { x: number; y: number; width: number; height: number },
  view: ViewState,
) {
  const left = view.pan.x + item.x * view.zoom
  const top = view.pan.y + item.y * view.zoom
  return {
    left,
    top,
    right: left + item.width * view.zoom,
    bottom: top + item.height * view.zoom,
  }
}

export function focusViewForItem(
  item: { x: number; y: number; width: number; height: number },
  current: ViewState,
  viewport: { w: number; h: number },
): ViewState {
  const pad = FOCUS_PADDING_PX
  const rect = itemScreenRect(item, current)
  const padded =
    rect.left >= pad &&
    rect.top >= pad &&
    rect.right <= viewport.w - pad &&
    rect.bottom <= viewport.h - pad
  if (padded) return current

  const fullyOnscreen =
    rect.left >= 0 &&
    rect.top >= 0 &&
    rect.right <= viewport.w &&
    rect.bottom <= viewport.h
  if (fullyOnscreen) {
    let panX = current.pan.x
    let panY = current.pan.y
    if (rect.left < pad) panX += pad - rect.left
    if (rect.top < pad) panY += pad - rect.top
    if (rect.right > viewport.w - pad) panX -= rect.right - (viewport.w - pad)
    if (rect.bottom > viewport.h - pad) panY -= rect.bottom - (viewport.h - pad)
    return {
      zoom: current.zoom,
      pan: clampPan(panX, panY, current.zoom, viewport.w, viewport.h),
    }
  }

  const fitZoom = Math.min(
    (viewport.w - pad * 2) / item.width,
    (viewport.h - pad * 2) / item.height,
  )
  const zoom = clamp(fitZoom, current.zoom, MAX_ZOOM)
  return {
    zoom,
    pan: clampPan(
      viewport.w / 2 - (item.x + item.width / 2) * zoom,
      viewport.h / 2 - (item.y + item.height / 2) * zoom,
      zoom,
      viewport.w,
      viewport.h,
    ),
  }
}
