import type { PlaybackDirection } from './playback/playbackTime'
import { PlaybackControls } from './PlaybackOverlay'
import { overlayColors } from './overlayStyles'

interface TimeControlsSectionProps {
  isPlaying: boolean
  onTogglePlaying: () => void
  speedMagnitude: number
  onSpeedChange: (speedMagnitude: number) => void
  direction: PlaybackDirection
  onToggleDirection: () => void
  onReturnToCurrentTime: () => void
}

/** Playback controls inside the unified "時間を動かす" section. */
export function TimeControlsSection(props: TimeControlsSectionProps) {
  return (
    <div
      style={{
        padding: '12px 4px',
        borderBottom: `1px solid ${overlayColors.border}`,
      }}
    >
      <PlaybackControls {...props} />
    </div>
  )
}
