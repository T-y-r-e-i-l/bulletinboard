# Life Reset Skin + Palmer Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle Publicpaste’s existing freeform wall to Life Reset’s light UI (off-white room, white chrome, black type, orange actions) and add Palmer-style eased camera motion with focus-on-select.

**Architecture:** Tokens and cork/wood CSS go away first so the room is a flat `#F5F5F5` field. Pure view math (`focusViewForItem`, `easePalmer`, `lerpView`) lives in `lib/viewport.ts` and is unit-tested. `BoardApp` owns an interruptible 220ms rAF loop and only runs focus camera on a local click (not drag, resize, draw, or remote updates). Chrome and item components keep their current layout and swap class names.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind 4, existing shadcn `Button`/`Dialog`, Vitest (new) for viewport/date helpers. No GSAP.

## Global Constraints

- Room `#F5F5F5`, surface `#FFFFFF`, ink `#111111`, mute `#8E8E93`, accent `#FF6B00`
- Card radius `20px`, chrome pills `9999px`, shadow `0 8px 24px rgba(0,0,0,0.06)`
- Canvas stays `8000×5000`; `MIN_ZOOM` / `MAX_ZOOM` / `PAN_MARGIN` unchanged
- View animation `220ms`, easing cubic-bezier(0.22, 1, 0.36, 1) via `easePalmer`
- Focus padding `64px`; never zoom out to focus; Escape/empty click clears selection without zooming out
- No grid toggle, type filters, FAB, dark mode, new APIs, or GSAP
- Chrome titles lowercase with a period (`publicpaste.`, `today.`); archive dates stay `formatBoardDate` output
- Geist remains for chrome; user content keeps its fonts

---

## File map

| File | Responsibility |
| --- | --- |
| `lib/constants.ts` | Add `FOCUS_PADDING_PX = 64`, `VIEW_ANIMATION_MS = 220` |
| `lib/viewport.ts` | Add `ViewState`, `easePalmer`, `lerpView`, `focusViewForItem` |
| `lib/dates.ts` | Add `chromeDateLabel(boardDate, today?)` |
| `lib/viewport.test.ts` | Vitest: focus, ease, lerp |
| `lib/dates.test.ts` | Vitest: `today.` vs formatted archive date |
| `vitest.config.ts` | Node env + `@/` alias |
| `package.json` | `"test": "vitest run"` |
| `app/globals.css` | Tokens; delete `.room-bg` / `.board-frame` / `.wall-surface` |
| `app/layout.tsx` | Body uses room background |
| `components/board/chrome.ts` | Shared pill/card class strings |
| `components/board/TopBar.tsx` | Light pill, `today.`, orange Timelapse |
| `components/board/Toolbar.tsx` | White pill, orange active tool |
| `components/board/Inspector.tsx` | White card, mute delete |
| `components/board/AvatarStack.tsx` | White-border avatars |
| `components/board/Minimap.tsx` | White map, mute marks, orange viewport |
| `components/board/ViewControls.tsx` | White zoom stack, ink percent |
| `components/board/TimelapsePlayer.tsx` | Light overlay, white controls, no cork |
| `components/board/BoardItemView.tsx` | Card skins, orange focus ring |
| `components/board/BoardApp.tsx` | Room (no frame), empty wall (no copy), rAF view anim, focus-on-click, restyle URL dialog |

---

### Task 1: Viewport math + test runner

**Files:**
- Create: `vitest.config.ts`
- Create: `lib/viewport.test.ts`
- Create: `lib/dates.test.ts`
- Modify: `package.json`
- Modify: `lib/constants.ts`
- Modify: `lib/viewport.ts`
- Modify: `lib/dates.ts`

**Interfaces:**
- Consumes: existing `clampPan`, `clampZoom`, `MAX_ZOOM`, `todayInBoardTz`, `formatBoardDate`
- Produces:
  - `FOCUS_PADDING_PX: 64`
  - `VIEW_ANIMATION_MS: 220`
  - `type ViewState = { pan: { x: number; y: number }; zoom: number }`
  - `easePalmer(t: number): number`
  - `lerpView(from: ViewState, to: ViewState, t: number): ViewState`
  - `focusViewForItem(item: { x: number; y: number; width: number; height: number }, current: ViewState, viewport: { w: number; h: number }): ViewState`
  - `chromeDateLabel(boardDate: string, today?: string): string`

- [ ] **Step 1: Install Vitest and add config**

```bash
npm install -D vitest
```

Create `vitest.config.ts`:

```ts
import path from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
})
```

In `package.json` scripts, add `"test": "vitest run"` next to `"lint"`.

- [ ] **Step 2: Write the failing tests**

Create `lib/viewport.test.ts`:

```ts
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
```

Create `lib/dates.test.ts`:

```ts
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
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test`

Expected: FAIL — `easePalmer` / `focusViewForItem` / `chromeDateLabel` are not exported.

- [ ] **Step 4: Add constants**

Append to `lib/constants.ts` after `PAN_MARGIN`:

```ts
export const FOCUS_PADDING_PX = 64
export const VIEW_ANIMATION_MS = 220
```

- [ ] **Step 5: Implement viewport helpers**

Add to `lib/viewport.ts` (keep existing functions). Import `FOCUS_PADDING_PX` from constants (already imports `MAX_ZOOM`).

```ts
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
  return {
    zoom: from.zoom + (to.zoom - from.zoom) * t,
    pan: {
      x: from.pan.x + (to.pan.x - from.pan.x) * t,
      y: from.pan.y + (to.pan.y - from.pan.y) * t,
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
```

- [ ] **Step 6: Implement `chromeDateLabel`**

Add to `lib/dates.ts`:

```ts
export function chromeDateLabel(boardDate: string, today = todayInBoardTz()) {
  return boardDate === today ? "today." : formatBoardDate(boardDate)
}
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `npm test`

Expected: PASS (all Vitest tests).

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json vitest.config.ts lib/constants.ts lib/viewport.ts lib/viewport.test.ts lib/dates.ts lib/dates.test.ts
git commit -m "$(cat <<'EOF'
Add view-focus math and a Vitest runner.

EOF
)"
```

---

### Task 2: Room tokens (no cork, no frame)

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`
- Modify: `components/board/BoardApp.tsx` (room markup + empty state only)
- Modify: `components/board/TimelapsePlayer.tsx` (preview surface class only)

**Interfaces:**
- Consumes: tokens from the spec
- Produces: `--background #F5F5F5`, `--foreground #111111`, `--primary #FF6B00`, `--primary-foreground #FFFFFF`, `--muted-foreground #8E8E93`; no `.room-bg` / `.board-frame` / `.wall-surface` classes remaining in the repo

- [ ] **Step 1: Confirm cork classes still exist (baseline)**

Run: `rg "room-bg|board-frame|wall-surface" -g '!docs/**'`

Expected: matches in `app/globals.css`, `BoardApp.tsx`, `TimelapsePlayer.tsx`.

- [ ] **Step 2: Replace `:root` color tokens and delete cork CSS**

In `app/globals.css` `:root`, set:

```css
--background: #F5F5F5;
--foreground: #111111;
--card: #FFFFFF;
--card-foreground: #111111;
--popover: #FFFFFF;
--popover-foreground: #111111;
--primary: #FF6B00;
--primary-foreground: #FFFFFF;
--muted-foreground: #8E8E93;
--accent: #FF6B00;
--accent-foreground: #FFFFFF;
--ring: #FF6B00;
--radius: 1.25rem;
```

Leave `.dark` block as-is (dark mode is out of scope; the app does not toggle it).

Delete the entire `.room-bg`, `.board-frame`, and `.wall-surface` rules.

- [ ] **Step 3: Body uses the room color**

In `app/layout.tsx`, change the body class to:

```tsx
<body className="min-h-full overflow-hidden bg-background text-foreground">
```

- [ ] **Step 4: Flatten the board markup and drop empty-wall copy**

In `BoardApp.tsx`, replace the viewport root class `room-bg` with `h-full w-full cursor-grab overflow-hidden bg-[#F5F5F5]`.

Replace the inner

```tsx
<div className="board-frame">
  <div className="wall-surface relative h-full w-full">
```

with a single

```tsx
<div className="relative h-full w-full bg-[#F5F5F5]">
```

and close one fewer `div`. Delete the empty-state paragraph (`This wall is empty. Put something on it.`).

In `TimelapsePlayer.tsx`, replace `wall-surface` with `relative h-full w-full overflow-hidden bg-[#F5F5F5]`.

- [ ] **Step 5: Confirm cork classes are gone from app code**

Run: `rg "room-bg|board-frame|wall-surface" -g '!docs/**'`

Expected: no matches.

- [ ] **Step 6: Commit**

```bash
git add app/globals.css app/layout.tsx components/board/BoardApp.tsx components/board/TimelapsePlayer.tsx
git commit -m "$(cat <<'EOF'
Drop the cork room and map tokens to Life Reset light.

EOF
)"
```

---

### Task 3: Chrome skin

**Files:**
- Create: `components/board/chrome.ts`
- Modify: `components/board/TopBar.tsx`
- Modify: `components/board/Toolbar.tsx`
- Modify: `components/board/Inspector.tsx`
- Modify: `components/board/AvatarStack.tsx`
- Modify: `components/board/Minimap.tsx`
- Modify: `components/board/ViewControls.tsx`
- Modify: `components/board/TimelapsePlayer.tsx`
- Modify: `components/board/BoardApp.tsx` (URL dialog classes only)

**Interfaces:**
- Consumes: `chromeDateLabel` from Task 1; token hex values
- Produces:
  - `chromePill` and `chromeCard` class strings
  - Top bar wordmark `publicpaste.` + `chromeDateLabel(boardDate)`
  - Active tool: orange circle, white icon
  - Timelapse / dialog primary: `Button` default (now orange from tokens)

- [ ] **Step 1: Shared chrome classes**

Create `components/board/chrome.ts`:

```ts
export const chromeShadow = "shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
export const chromePill = `rounded-full bg-white ${chromeShadow}`
export const chromeCard = `rounded-[20px] bg-white ${chromeShadow}`
```

- [ ] **Step 2: TopBar**

Import `chromeDateLabel` from `@/lib/dates` and `chromePill` from `./chrome`.

Left cluster classes: `pointer-events-auto flex items-center gap-2 ${chromePill} px-2 py-1.5 text-[#111111]`

Chevrons: `text-[#111111] hover:bg-black/5`

Wordmark:

```tsx
<p className="text-[11px] tracking-[0.18em] text-[#8E8E93] lowercase">publicpaste.</p>
<p className="text-sm font-medium text-[#111111]">{chromeDateLabel(boardDate)}</p>
```

Timelapse: `className="ml-1 rounded-full bg-[#FF6B00] text-white hover:bg-[#FF6B00]/90"`

Caption: `text-xs text-[#8E8E93]`

Avatar wrapper: `${chromePill} px-2 py-1.5` (drop dark blur).

- [ ] **Step 3: Toolbar**

Root: `${chromePill} p-1.5`

Inactive button: `size-10 rounded-full text-[#8E8E93] hover:bg-black/5 hover:text-[#111111]`

Active: `bg-[#FF6B00] text-white hover:bg-[#FF6B00] hover:text-white`

- [ ] **Step 4: Inspector**

`Panel`: `absolute top-24 right-4 z-30 w-56 ${chromeCard} p-3 text-[#111111]`

Labels: `text-[11px] tracking-wide text-[#8E8E93] uppercase`

Selects: `border border-black/10 bg-[#F5F5F5] text-[#111111]`

Sticky selected swatch ring: `ring-2 ring-[#FF6B00]`

Delete button: replace `variant="destructive"` with `variant="ghost"` and `className="mt-4 w-full text-[#8E8E93] hover:bg-black/5 hover:text-[#111111]"`

- [ ] **Step 5: AvatarStack**

Avatar border: `border-2 border-white`

Self ring: `ring-2 ring-[#FF6B00]`

Overflow chip: `border-2 border-white bg-[#F5F5F5] text-xs font-medium text-[#111111]`

- [ ] **Step 6: Minimap + ViewControls**

`Minimap` container: `${chromeCard} overflow-hidden` with `background: #FFFFFF` (remove cork fill and brown inset). Item marks: if no payload color, use `#8E8E93`. Viewport rect: `border border-[#FF6B00] bg-[#FF6B00]/15`. Local cursor ring: `boxShadow: "0 0 0 2px #FFFFFF"`.

Zoom stack: `${chromeCard} overflow-hidden` (drop dark glass). Buttons: `text-[#111111] hover:bg-black/5`. Percent: `border-y border-black/5 py-1 text-center text-[11px] tabular-nums text-[#111111]`. Recenter button: same white card language, `text-[#111111]`.

- [ ] **Step 7: Timelapse player + URL dialog**

Timelapse overlay: `bg-black/20 backdrop-blur-[2px]` (keep dim, not brown).

Control bar: `${chromePill} px-4 py-2 text-[#111111]`. Ghost buttons `text-[#111111]`. Close: default (orange) `Button`. Empty copy: `text-[#8E8E93]`.

In `BoardApp` URL dialog: title stays “Pin a link”; primary “Add to wall” uses default `Button` (orange). Input: `rounded-[20px] border border-black/10 bg-white px-3 py-2 text-[#111111]`.

- [ ] **Step 8: Typecheck**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 9: Commit**

```bash
git add components/board/chrome.ts components/board/TopBar.tsx components/board/Toolbar.tsx components/board/Inspector.tsx components/board/AvatarStack.tsx components/board/Minimap.tsx components/board/ViewControls.tsx components/board/TimelapsePlayer.tsx components/board/BoardApp.tsx
git commit -m "$(cat <<'EOF'
Restyle board chrome to Life Reset light.

EOF
)"
```

---

### Task 4: Item skins and cursor chips

**Files:**
- Modify: `components/board/BoardItemView.tsx`
- Modify: `components/board/BoardApp.tsx` (named cursor label only)

**Interfaces:**
- Consumes: `chromeShadow` / card radius from Task 3 (`chrome.ts` or duplicate the shadow string)
- Produces: selected ring `2px #FF6B00` with `4px` offset; drawings have no white plate; stickies use pastel fill as the card face

- [ ] **Step 1: Shared selected ring helper in BoardItemView**

At the top of `BoardItemView.tsx`:

```ts
const cardShadow = "shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
const selectedRing = "ring-2 ring-[#FF6B00] ring-offset-4 ring-offset-[#F5F5F5]"
```

- [ ] **Step 2: Restyle each type**

- **text:** wrap `Editable` in `h-full w-full rounded-[20px] bg-white p-3 ${cardShadow}` and apply `selectedRing` on the wrapper when `selected`.
- **sticky:** remove `rotate(-1.2deg)` and the heavy stone shadow. Use `h-full w-full rounded-[20px] p-3 ${cardShadow}` plus `selectedRing` when selected. Keep `background: payload.color`.
- **url:** `rounded-[20px] ${cardShadow}` plus `selectedRing`; keep inner layout; image `object-cover` with no extra radius conflict (`rounded-t-[20px]`).
- **image / video:** wrap in `h-full w-full overflow-hidden rounded-[20px] bg-white p-0.5 ${cardShadow}` and `selectedRing` so the 2px white inset exists; inner media `h-full w-full rounded-[18px] object-cover`.
- **audio:** white card (`bg-white rounded-[20px] ${cardShadow}`) instead of `#2a2420`; `selectedRing` when selected.
- **drawing:** no card, no ring plate. If `selected`, put `selectedRing` on the outer absolute wrapper only (svg stays stroke-only).
- **resize handle:** `bg-[#FF6B00]` rounded-sm, not amber.

- [ ] **Step 3: Named cursors**

In `BoardApp.tsx` cursor label span, replace the colored pill with:

```tsx
<span className="ml-3 rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-[#111111] shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
  {cursor.name}
</span>
```

Cursor glyph stroke: `#FFFFFF` instead of `#1c1814`.

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add components/board/BoardItemView.tsx components/board/BoardApp.tsx
git commit -m "$(cat <<'EOF'
Skin board items as Life Reset cards.

EOF
)"
```

---

### Task 5: Interruptible camera + focus-on-click

**Files:**
- Modify: `components/board/BoardApp.tsx`

**Interfaces:**
- Consumes: `easePalmer`, `lerpView`, `focusViewForItem`, `ViewState`, `VIEW_ANIMATION_MS`, existing `zoomAround` / `centerPan` / `clampPan`
- Produces: `animateToView(next: ViewState)` inside `BoardApp`; zoom buttons, keyboard, recenter, minimap jump, and wheel retarget that animation; pointer-drag / draw / resize call `cancelViewAnim()`; focus camera only on item **click** (pointer up with movement &lt; 4px, mode `item`, not resize)

- [ ] **Step 1: Add animation refs next to `viewportRef`**

```ts
const viewAnimRef = useRef<number | null>(null)
const viewRef = useRef({ pan, zoom })
viewRef.current = { pan, zoom }
const pointerMovedRef = useRef(false)
```

- [ ] **Step 2: Implement cancel + animate**

```ts
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
      setZoom(view.zoom)
      setPan(view.pan)
      if (t < 1) viewAnimRef.current = requestAnimationFrame(tick)
      else viewAnimRef.current = null
    }
    viewAnimRef.current = requestAnimationFrame(tick)
  },
  [cancelViewAnim, viewportSize],
)
```

Cleanup on unmount: `useEffect(() => () => cancelViewAnim(), [cancelViewAnim])`.

- [ ] **Step 3: Route zoom / recenter / jump / wheel through animation**

Replace `applyZoom` body so it computes `zoomAround(...)` then `animateToView(result)` instead of `setZoom`/`setPan`.

`recenter`: `animateToView({ zoom, pan: centerPan(zoom, w, h) })`.

Minimap `onJump`: `animateToView({ zoom, pan: clampPan(w / 2 - x * zoom, h / 2 - y * zoom, zoom, w, h) })`.

`onWheel`: `cancelViewAnim()` then compute the next view from `viewRef.current` (not stale closures) and `animateToView`. For pan-only wheel (no ctrl/meta), target `clampPan(current.pan.x - deltaX, current.pan.y - deltaY, current.zoom, w, h)` with same zoom.

- [ ] **Step 4: Cancel animation when a gesture takes over**

At the start of `onPointerDown`, after the timelapse guard: if the interaction will pan, drag an item, resize, or draw, call `cancelViewAnim()`. Set `pointerMovedRef.current = false`.

In `onPointerMove`, if `dragRef.current` exists and the board delta exceeds 4px (item/resize) or screen delta exceeds 4px (pan), set `pointerMovedRef.current = true`.

- [ ] **Step 5: Focus only on click, never on Escape**

Keep `setSelectedId(id)` on item pointer down (current behavior).

In `onPointerUp`, after handling patch/draw, if `drag?.mode === "item" && drag.id && !pointerMovedRef.current && !readOnly` (and it was not a resize — resize mode is `"resize"`), then:

```ts
const item = itemsRef.current.find((row) => row.id === drag.id)
const { w, h } = viewportSize()
if (item) animateToView(focusViewForItem(item, viewRef.current, { w, h }))
```

Do **not** call `focusViewForItem` from `createItem`, from realtime upserts, or from drawing.

Escape handler stays `setSelectedId(null)` only — no `animateToView`, no zoom change.

Empty-canvas pointer down already `setSelectedId(null)` and starts pan; that pan `cancelViewAnim()` must not zoom.

- [ ] **Step 6: Typecheck and unit tests still pass**

Run: `npx tsc --noEmit && npm test`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add components/board/BoardApp.tsx
git commit -m "$(cat <<'EOF'
Ease the camera and focus on local clicks.

EOF
)"
```

---

### Task 6: Browser verification

**Files:** none (manual)

**Interfaces:** Consumes the running app from Tasks 1–5.

- [ ] **Step 1: Start the app**

Run: `npm run dev`

Open `http://localhost:3000`.

- [ ] **Step 2: Empty today**

Confirm off-white room, no wood frame, no empty-state sentence, tool pill visible at the bottom, `publicpaste.` / `today.` in the top pill, orange Timelapse.

- [ ] **Step 3: Mixed content**

Add text, sticky, link, photo, drawing. Confirm card skins, sticky pastels, drawing has no white plate, orange ring + 4px offset on select, white cursor name chips.

- [ ] **Step 4: Focus camera**

Click a small item near the edge or off-center: 220ms ease, item framed, clamp holds. Click a large already-centered item: no zoom change. Escape / click empty: ring clears, zoom stays.

- [ ] **Step 5: Gestures vs camera**

Draw, drag, and resize: camera does not jump from focus logic. Wheel/trackpad interrupts an in-flight zoom animation.

- [ ] **Step 6: Live + archive**

Second tab: a new remote post does not move this camera. Open an `/archive/YYYY-MM-DD` day: same skin, no tools, still read-only. Open Timelapse, play, close.

- [ ] **Step 7: Widths**

Desktop ~1440px and ~390px: pills do not overflow; minimap + zoom stay usable.

- [ ] **Step 8: Commit only if verification forced a fix**

If you changed files to pass the checklist, commit those fixes with a message that says why (for example `Keep focus camera off while dragging.`). If nothing changed, do not create an empty commit.

---

## Spec coverage

| Spec section | Task |
| --- | --- |
| Visual tokens, drop cork/wood | 2 |
| Chrome layout + Life Reset skin | 3 |
| Empty wall (no illustration/copy) | 2 |
| Dialogs | 3 |
| Item cards, sticky fill, media inset, orange ring | 4 |
| Cursor chips | 4 |
| `focusViewForItem` rules | 1 |
| 220ms interruptible animation | 5 |
| Focus on local select only; not draw/drag/resize/remote | 5 |
| Escape does not zoom out | 5 |
| No new APIs / no GSAP / no grid/FAB | all (omitted) |
| Browser checklist | 6 |
