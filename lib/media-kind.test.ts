import { describe, expect, it } from "vitest"
import { mediaAccept, mediaKindFromFile } from "@/lib/media-kind"

describe("mediaKindFromFile", () => {
  it("treats images as image items", () => {
    expect(mediaKindFromFile({ type: "image/png", name: "pic.png" })).toBe("image")
    expect(mediaKindFromFile({ type: "image/jpeg", name: "pic.jpg" })).toBe("image")
  })

  it("treats videos as video items", () => {
    expect(mediaKindFromFile({ type: "video/mp4", name: "clip.mp4" })).toBe("video")
    expect(mediaKindFromFile({ type: "video/webm", name: "clip.webm" })).toBe("video")
  })

  it("rejects audio and unknown files for the media tool", () => {
    expect(mediaKindFromFile({ type: "audio/mpeg", name: "song.mp3" })).toBeNull()
    expect(mediaKindFromFile({ type: "application/pdf", name: "doc.pdf" })).toBeNull()
  })
})

describe("mediaAccept", () => {
  it("accepts images and videos in one picker", () => {
    expect(mediaAccept).toContain("image/")
    expect(mediaAccept).toContain("video/")
  })
})
