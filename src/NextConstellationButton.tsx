/**
 * A single always-visible button that jumps to the next currently-visible
 * constellation each press — a revival of the dev-only test button from
 * Task 3/4 (`debugSetLookDirection`, removed once Task 5 shipped real
 * tap/click selection), brought back as an intentional feature at the
 * user's request rather than dev-only scaffolding. No open/close panel
 * (unlike SearchOverlay), so this stays a standalone component instead of a
 * second responsibility bolted onto search — sits right next to it in the
 * same top-left row (D009).
 */

import {
  overlayButtonGapPx,
  overlayButtonSizePx,
  overlayButtonStyle,
  overlayCornerMarginPx,
} from './overlayStyles'

const leftOffsetPx =
  overlayCornerMarginPx + overlayButtonSizePx + overlayButtonGapPx

interface NextConstellationButtonProps {
  onClick: () => void
}

export function NextConstellationButton({
  onClick,
}: NextConstellationButtonProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: overlayCornerMarginPx,
        left: leftOffsetPx,
        zIndex: 1,
      }}
    >
      <button
        type="button"
        onClick={onClick}
        aria-label="次の星座を表示"
        style={overlayButtonStyle}
      >
        ⏭️
      </button>
    </div>
  )
}
