import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  DEFAULT_ZOOM,
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
