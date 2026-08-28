import { ALLOWED_IMAGE_TYPES, ALLOWED_VIDEO_TYPES } from "@/lib/constants"

export type VisualMediaKind = "image" | "video"

export const mediaAccept = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES].join(",")

export function mediaKindFromFile(file: { type: string; name: string }): VisualMediaKind | null {
  if (ALLOWED_IMAGE_TYPES.includes(file.type)) return "image"
  if (ALLOWED_VIDEO_TYPES.includes(file.type)) return "video"
  return null
}
