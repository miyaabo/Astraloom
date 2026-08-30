import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import type { LabelScreenPosition } from './render/StarfieldRenderer'
import { overlayColors } from './overlayStyles'

export interface ConstellationLabelEntry {
  key: string
  text: string
  variant: 'constellation' | 'star'
}

export interface ConstellationLabelsHandle {
  update(positions: LabelScreenPosition[]): void
  /**
   * Forces the next update() call to re-run the vertical-shift declutter
   * pass from scratch (Design Backlog: 見た目改善). Offsets computed at one
   * zoom level don't necessarily still separate labels correctly at another
   * — a label pair's on-screen distance changes as the camera's field of
   * view changes — so Starfield.tsx calls this whenever the view is zoomed.
   */
  resetDeclutter(): void
}

/** Minimum gap (px) the decluttering pass below enforces between two labels' bounding boxes. */
const LABEL_GAP_PX = 4

interface Rect {
  left: number
  right: number
  top: number
  bottom: number
}

function toRect(domRect: DOMRect): Rect {
  return {
    left: domRect.left,
    right: domRect.right,
    top: domRect.top,
    bottom: domRect.bottom,
  }
}

function shiftRectDown(rect: Rect, offsetY: number): Rect {
  return { ...rect, top: rect.top + offsetY, bottom: rect.bottom + offsetY }
}

function rectsOverlap(a: Rect, b: Rect): boolean {
  return (
    a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
  )
}

/**
 * Nudges labels straight down, one at a time in top-to-bottom order, just
 * enough to clear every label already placed above it. Stars that happen to
 * project close together on screen (common in a compact constellation) would
 * otherwise render with overlapping text; this keeps every label readable
 * without moving anything sideways (which would drift it away from the star
 * it names) or hiding any of them. Returns each shifted label's extra
 * vertical offset in px, keyed the same as the input.
 */
function declutter(
  entries: { key: string; rect: Rect }[],
): Map<string, number> {
  const offsets = new Map<string, number>()
  const placed: Rect[] = []
  const sorted = [...entries].sort((a, b) => a.rect.top - b.rect.top)

  for (const { key, rect } of sorted) {
    let offsetY = 0
    let stillOverlapping = true
    while (stillOverlapping) {
      stillOverlapping = false
      const shifted = shiftRectDown(rect, offsetY)
      for (const other of placed) {
        if (rectsOverlap(shifted, other)) {
          offsetY += other.bottom - shifted.top + LABEL_GAP_PX
          stillOverlapping = true
        }
      }
    }
    placed.push(shiftRectDown(rect, offsetY))
    if (offsetY !== 0) offsets.set(key, offsetY)
  }

  return offsets
}

/**
 * Renders constellation/star name labels at their on-screen projected
 * position (Task 4, D009). Which labels exist changes only when the selected
 * constellation changes (the `labels` prop, a normal re-render); their
 * per-frame screen position is pushed imperatively through `update` (driven
 * by StarfieldRenderer's onLabelPositionsChange callback, see Starfield.tsx)
 * so camera drift doesn't trigger a React re-render every frame — same
 * pattern as CompassOverlay.
 *
 * `update` also runs a decluttering pass (declutter above) so labels that
 * land close together on screen don't render on top of each other — but only
 * once, the first time real positions arrive after `labels` changes (see the
 * effect below), not every frame. Recomputing it every frame would need a
 * fresh getBoundingClientRect() read each time, which forces a synchronous
 * layout pass; sub-pixel differences between consecutive reads (from
 * antialiasing/font hinting, not any real movement) made the computed offset
 * flicker by a px or two, which read as the label visibly wobbling up/down
 * even while the view was still. A constellation's labels barely change
 * relative position under the app's gentle ambient drift, so one decluttering
 * pass per selection is enough — dragging the view far enough to change which
 * labels overlap is an acceptable edge case for now (Task 5 will revisit
 * label layout alongside real selection).
 */
export const ConstellationLabelsOverlay = forwardRef<
  ConstellationLabelsHandle,
  { labels: ConstellationLabelEntry[] }
>(function ConstellationLabelsOverlay({ labels }, ref) {
  const elementRefs = useRef<Record<string, HTMLSpanElement | null>>({})
  const declutterOffsetsRef = useRef<Map<string, number>>(new Map())
  // Set whenever `labels` changes; cleared once update() has measured real
  // positions and run declutter for the new set.
  const needsDeclutterRef = useRef(true)

  function resetDeclutterState(): void {
    needsDeclutterRef.current = true
    declutterOffsetsRef.current = new Map()
  }

  // Depend on the label set's *contents*, not the `labels` array's identity:
  // refreshConstellationDisplay (Starfield.tsx) rebuilds a fresh array every
  // recompute, including on every throttled playback tick while a
  // constellation stays selected, even though the same stars/constellation
  // are still shown. Depending on the array reference would re-arm
  // needsDeclutterRef on every tick and reintroduce the sub-pixel
  // getBoundingClientRect() jitter this file was written to avoid (see the
  // class doc comment above) — this time during playback specifically, which
  // is exactly when a selected constellation's labels are expected to track
  // the stars smoothly.
  const labelsSignature = labels
    .map((label) => `${label.key}:${label.text}:${label.variant}`)
    .join('|')
  useEffect(resetDeclutterState, [labelsSignature])

  useImperativeHandle(ref, () => ({
    resetDeclutter: resetDeclutterState,
    update(positions) {
      // Cheap every frame: no layout read, so the browser can batch this
      // with the canvas's own paint instead of blocking on it.
      for (const position of positions) {
        const el = elementRefs.current[position.key]
        if (!el) continue
        el.style.left = `${position.xPercent}%`
        el.style.top = `${position.yPercent}%`
        el.style.opacity = position.visible ? '1' : '0'
      }

      if (needsDeclutterRef.current) {
        const visibleRects: { key: string; rect: Rect }[] = []
        for (const position of positions) {
          if (!position.visible) continue
          const el = elementRefs.current[position.key]
          if (!el) continue
          el.style.transform = 'translate(-50%, -50%)'
          visibleRects.push({
            key: position.key,
            rect: toRect(el.getBoundingClientRect()),
          })
        }
        // Wait for at least one visible label before declaring this pass
        // done — right after a selection change, positions may still all be
        // reporting `visible: false` for a frame or two.
        if (visibleRects.length > 0) {
          declutterOffsetsRef.current = declutter(visibleRects)
          needsDeclutterRef.current = false
        }
      }

      for (const [key, offsetY] of declutterOffsetsRef.current) {
        const el = elementRefs.current[key]
        if (el) {
          el.style.transform = `translate(-50%, calc(-50% + ${offsetY}px))`
        }
      }
    },
  }))

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1,
        pointerEvents: 'none',
      }}
    >
      {labels.map((label) => (
        <span
          key={label.key}
          ref={(el) => {
            elementRefs.current[label.key] = el
          }}
          style={{
            position: 'absolute',
            // Position is set imperatively via `update` above; starts
            // invisible so a label never flashes at (0, 0) before the first
            // frame reports its real position.
            opacity: 0,
            transform: 'translate(-50%, -50%)',
            color: overlayColors.text,
            fontSize: label.variant === 'constellation' ? 15 : 12,
            fontWeight: label.variant === 'constellation' ? 700 : 400,
            textShadow: '0 0 4px rgba(0, 0, 0, 0.8)',
            whiteSpace: 'nowrap',
          }}
        >
          {label.text}
        </span>
      ))}
    </div>
  )
})
