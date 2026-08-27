import { describe, expect, it } from "vitest"
import { chromeDateLabel } from "@/lib/dates"

describe("chromeDateLabel", () => {
  it("returns today. when the board is today", () => {
    expect(chromeDateLabel("2026-08-27", "2026-08-27")).toBe("today.")
  })

  it("returns the human archive date otherwise", () => {
    expect(chromeDateLabel("2026-08-26", "2026-08-27")).toBe("Wednesday, August 26, 2026")
  })
})
