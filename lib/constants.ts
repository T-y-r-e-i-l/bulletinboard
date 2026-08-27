export const BOARD_WIDTH = 8000
export const BOARD_HEIGHT = 5000
export const MIN_ZOOM = 0.08
export const MAX_ZOOM = 1.5
export const DEFAULT_ZOOM = 0.72
export const ZOOM_STEP = 1.2
export const PAN_MARGIN = 64
export const BOARD_TIMEZONE = "America/Los_Angeles"
export const MAX_ITEMS_PER_BOARD = 500
export const MAX_TEXT_LENGTH = 4000
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024
export const MAX_MEDIA_BYTES = 25 * 1024 * 1024
export const RATE_LIMIT_PER_MINUTE = 20
export const MEDIA_BUCKET = "board-media"

export const STICKY_COLORS = [
  "#fde68a",
  "#f9a8d4",
  "#7dd3fc",
  "#86efac",
  "#fdba74",
  "#e9d5ff",
  "#fafaf9",
] as const

export const FONT_OPTIONS = [
  { id: "sans", label: "Sans", css: "var(--font-wall-sans), system-ui, sans-serif" },
  { id: "serif", label: "Serif", css: "var(--font-wall-serif), Georgia, serif" },
  { id: "mono", label: "Mono", css: "var(--font-wall-mono), ui-monospace, monospace" },
  { id: "display", label: "Display", css: "var(--font-wall-display), Impact, sans-serif" },
  { id: "hand", label: "Hand", css: "var(--font-wall-hand), cursive" },
  { id: "comic", label: "Comic", css: "var(--font-wall-comic), 'Comic Sans MS', cursive" },
] as const

export const FONT_WEIGHTS = [
  { id: "400", label: "Regular" },
  { id: "600", label: "Semibold" },
  { id: "800", label: "Bold" },
] as const

export const BRUSHES = [
  { id: "pen", label: "Pen", widthScale: 1, opacity: 1, lineCap: "round" as const },
  { id: "marker", label: "Marker", widthScale: 1.8, opacity: 0.88, lineCap: "round" as const },
  { id: "highlighter", label: "Highlighter", widthScale: 4.2, opacity: 0.32, lineCap: "square" as const },
] as const

export const DEFAULT_SIZES: Record<string, { width: number; height: number }> = {
  text: { width: 280, height: 72 },
  sticky: { width: 188, height: 188 },
  url: { width: 280, height: 210 },
  image: { width: 320, height: 240 },
  video: { width: 360, height: 220 },
  audio: { width: 300, height: 76 },
  drawing: { width: 200, height: 200 },
}

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm"]
export const ALLOWED_AUDIO_TYPES = [
  "audio/mpeg",
  "audio/wav",
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
]
