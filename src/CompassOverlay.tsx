import { forwardRef, useImperativeHandle, useRef } from 'react'
import { computeLeftPercent } from './compassBearing'
import {
  overlayButtonGapPx,
  overlayButtonSizePx,
  overlayColors,
  overlayCornerMarginPx,
} from './overlayStyles'

/**
 * Screen-edge compass strip (Task 6, revised): shows which way N/E/S/W are
 * relative to the current view. Earlier this was implemented as labels fixed
 * to the sky sphere (like stars), but that made them scroll out of view
 * whenever the camera turned away — the opposite of a usable reference.
 * Instead each label's horizontal position is derived every frame from its
 * bearing relative to the camera's current heading, and clamped to the
 * screen edges when that bearing is out of view, so a label is always
 * visible somewhere along this strip no matter which way the camera looks.
 *
 * Positions are pushed imperatively via the exposed `update` handle (driven
 * by StarfieldRenderer's per-frame onHeadingChange callback, see
 * Starfield.tsx) rather than React state, so a heading change every
 * animation frame doesn't trigger a React re-render.
 */

const CARDINAL_LABELS: readonly { label: string; azimuthDegrees: number }[] = [
  { label: 'N', azimuthDegrees: 0 },
  { label: 'E', azimuthDegrees: 90 },
  { label: 'S', azimuthDegrees: 180 },
  { label: 'W', azimuthDegrees: 270 },
]

/** Top offset: sits just below the date/time + location buttons' row. */
const stripTopPx =
  overlayCornerMarginPx + overlayButtonSizePx + overlayButtonGapPx

export interface CompassHandle {
  update(headingDegrees: number): void
}

export const CompassOverlay = forwardRef<CompassHandle>(
  function CompassOverlay(_props, ref) {
    const labelRefs = useRef<(HTMLSpanElement | null)[]>([])

    useImperativeHandle(ref, () => ({
      update(headingDegrees: number) {
        CARDINAL_LABELS.forEach((marker, index) => {
          const el = labelRefs.current[index]
          if (!el) return
          el.style.left = `${computeLeftPercent(marker.azimuthDegrees, headingDegrees)}%`
        })
      },
    }))

    return (
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: stripTopPx,
          // Inset from the viewport edges so a clamped label (translateX'd to
          // center on its computed position) never gets visually clipped.
          left: overlayCornerMarginPx,
          right: overlayCornerMarginPx,
          height: 20,
          zIndex: 1,
          pointerEvents: 'none',
        }}
      >
        {CARDINAL_LABELS.map((marker, index) => (
          <span
            key={marker.label}
            ref={(el) => {
              labelRefs.current[index] = el
            }}
            style={{
              position: 'absolute',
              top: 0,
              // Initial heading is always 0 (Starfield mounts looking north);
              // update() takes over once the renderer's frame loop starts.
              left: `${computeLeftPercent(marker.azimuthDegrees, 0)}%`,
              transform: 'translateX(-50%)',
              color: overlayColors.text,
              opacity: 0.4,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {marker.label}
          </span>
        ))}
      </div>
    )
  },
)
