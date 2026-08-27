import { BRUSHES } from "@/lib/constants"
import type { Point, Stroke } from "@/lib/types"

export function pointsToPath(points: Point[]) {
  if (!points.length) return ""
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(" ")
}

export function strokeStyle(stroke: Pick<Stroke, "brush" | "size" | "color">) {
  const brush = BRUSHES.find((item) => item.id === stroke.brush) ?? BRUSHES[0]
  return {
    stroke: stroke.color,
    strokeWidth: stroke.size * brush.widthScale,
    strokeLinecap: brush.lineCap,
    strokeLinejoin: "round" as const,
    fill: "none",
    opacity: brush.opacity,
  }
}

export function boundsForStrokes(strokes: Stroke[]) {
  let minX = Number.POSITIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY
  for (const stroke of strokes) {
    const pad = (stroke.size * 4) / 2
    for (const point of stroke.points) {
      minX = Math.min(minX, point.x - pad)
      minY = Math.min(minY, point.y - pad)
      maxX = Math.max(maxX, point.x + pad)
      maxY = Math.max(maxY, point.y + pad)
    }
  }
  if (!Number.isFinite(minX)) {
    return { x: 0, y: 0, width: 200, height: 200 }
  }
  return {
    x: minX,
    y: minY,
    width: Math.max(40, maxX - minX),
    height: Math.max(32, maxY - minY),
  }
}
