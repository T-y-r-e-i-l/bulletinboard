# Publicpaste visual restyle: Life Reset UI, Palmer motion

Date: 2026-08-27

## Goal

Keep today’s freeform public wall (pan, zoom, pin, move, live presence). Restyle the room and chrome to match Life Reset’s light UI. Add Palmer Dinnerware’s calm canvas motion (eased pan/zoom, focus-on-select). Do not add grid view, filters, or a FAB.

## References

- UX: [Palmer Dinnerware](https://www.palmer-dinnerware.com/) — one canvas, scroll/drag, tactile easing, selected piece comes into focus without leaving the canvas.
- UI: [Life Reset iOS screens](https://mobbin.com/apps/life-reset-ios-856f826b-a989-4b5e-ac4e-b1f056631914/76b067ae-4799-41e4-ae00-e9a3148004a2/screens) — off-white field, white rounded cards, black type, one orange primary.

## Locked decisions

1. Keep the existing freeform board and chrome layout.
2. Light off-white wall, black type, orange primary actions.
3. Drop cork grain, wood frame, and brown room vignette. The whole viewport is the Life Reset room.
4. Approach: restyle existing chrome and items; add motion in `lib/viewport.ts` + `BoardApp`. No GSAP. No new APIs.

## Visual system

| Token | Value | Use |
| --- | --- | --- |
| Room | `#F5F5F5` | Full viewport background |
| Surface | `#FFFFFF` | Chrome pills, inspector, minimap, zoom stack, item cards |
| Ink | `#111111` | Titles, active labels, icons on white |
| Mute | `#8E8E93` | Secondary copy, inactive tools, captions |
| Accent | `#FF6B00` | Active tool fill, Timelapse, confirm, focus ring, minimap viewport |
| Radius | `20px` cards / `9999px` pills | Cards vs chrome bars |
| Shadow | `0 8px 24px rgba(0,0,0,0.06)` | Floating chrome and items |

Remove `.room-bg`, `.board-frame`, and cork `.wall-surface`. The board surface is the same `#F5F5F5` as the room (no inner frame). Canvas size stays `8000×5000`; pan still clamps so the wall cannot be dragged into empty void.

Type: Geist remains. Chrome titles are lowercase with a trailing period (`publicpaste.`, `today.`). Archive dates stay human-readable (`August 26, 2026`) under `publicpaste.`. User-generated text, stickies, and drawings keep their own fonts and casing.

## Chrome (layout unchanged)

**Top left pill:** prev/next day, wordmark `publicpaste.` (11px, tracked, mute) over `today.` or the archive date (bold ink). **Timelapse** is an orange filled button with white label.

**Top right:** midnight/archive caption in mute. Avatar stack in a white pill. Animal avatars unchanged; chip chrome matches the new pills.

**Bottom tool pill:** the same eight tools. Inactive: mute line icons on white. Active: orange circle, white icon. Tooltips unchanged.

**Inspector:** white card, top-right under avatars. Same fields as today. Delete is mute text, not orange.

**Minimap + zoom:** bottom-right, minimap to the left of zoom. White cards. Map marks in mute; viewport rect and local cursor in accent. Zoom controls: white buttons, ink icons, current percent in ink.

**Empty wall:** off-white field plus the tool pill. No illustration, no empty-state card.

**Dialogs** (URL paste, timelapse player): white cards, ink type, orange primary, mute cancel.

## Items

Every item sits in a white rounded card (`20px`, soft shadow) except drawings, which stay stroke-only on the field (no white plate under ink).

- **Sticky:** pastel fill is the card face (not a white card with a sticky inside). Same radius and shadow as other cards.
- **Text:** white card, existing font/weight/size/color controls.
- **URL / image / video / audio:** media or preview full-bleed inside the radius; a thin white inset so the orange focus ring has a gap.
- **Selected:** 2px orange ring, 4px offset. No extra drop shadow beyond the standard card shadow.

## Palmer motion

Duration: `220ms`. Easing: `cubic-bezier(0.22, 1, 0.36, 1)`. Interruptible: a new pointer/wheel gesture cancels the in-flight view animation and takes over.

**Pan / zoom / recenter:** animate `pan` and `zoom` toward the clamped target. Keyboard `+` / `-` / `0` use the same animation.

**Focus on select:** on local pointer-select of an item (not while the gesture is a drag, resize, or draw):

1. If the item is fully visible with ≥ `64px` padding on all sides, do not change zoom. Pan only if the item is closer than `64px` to an edge, enough to restore that padding (then clamp).
2. Otherwise set zoom to the value that fits the item plus `64px` padding in the viewport, clamped to `[currentZoom, MAX_ZOOM]` (never zoom out to focus). Then pan to center the item, then clamp.

Click empty canvas or Escape: clear selection and the orange ring. Do not animate zoom out.

**Do not run focus camera** when: drawing, dragging an item, resizing, applying remote item changes, another user inserting a post.

## Architecture

No new routes, tables, or realtime events. Identity, CRUD, presence, archive, and cron are unchanged.

| Unit | Responsibility |
| --- | --- |
| `app/globals.css` | Tokens; delete cork/wood helpers; map `--primary` to accent |
| `app/layout.tsx` | Body uses room background; no brown overflow |
| `TopBar`, `Toolbar`, `Inspector`, `Minimap`, `ViewControls`, `AvatarStack`, `TimelapsePlayer` | Life Reset chrome classes |
| `BoardItemView` | Card skins and focus ring |
| `lib/viewport.ts` | `animateView` helper inputs (from/to pan+zoom) stay pure; animation loop lives in `BoardApp` |
| `BoardApp` | Interruptible view animation; `focusOnItem` only on local select |

`lib/viewport.ts` stays pure functions (clamp, center, zoomAround, plus `focusViewForItem(item, zoom, viewport)` returning `{ pan, zoom }`). `BoardApp` owns rAF/CSS interpolation so React state stays the source of truth.

## Out of scope

Canvas ↔ grid toggle, type filters, lookbook archives, center FAB, dark mode, GSAP, changing edit permissions, changing board size or zoom limits.

## Test plan

1. Empty today: off-white room, no frame, tool pill visible.
2. Mixed wall: text, sticky, URL, image, drawing — skins match the item rules.
3. Select a small off-screen-ish item: camera eases to frame it; orange ring; clamp still holds.
4. Select an already-centered large item: no zoom change.
5. Escape or click empty: selection clears, zoom stays.
6. Draw, drag, resize: camera does not move from focus logic.
7. Second tab posts an item: local camera does not move.
8. Archive day: read-only, same skin, no tools.
9. Timelapse opens, plays, closes.
10. Desktop (~1440) and narrow (~390) chrome: pills do not overflow; minimap/zoom remain usable.

Verify in the browser, not only by screenshot.
