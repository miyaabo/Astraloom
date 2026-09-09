import { overlayColors, overlayPillButtonStyle } from './overlayStyles'

interface DisplaySettingsSectionProps {
  isProjectorMode: boolean
  onToggleProjectorMode: () => void
  isNightModeUi: boolean
  onToggleNightModeUi: () => void
  isFullscreenSupported: boolean
  isFullscreen: boolean
  onToggleFullscreen: () => void
  saveStatus: 'idle' | 'saved' | 'error'
  onSave: () => void
}

interface ToggleRowProps {
  label: string
  isEnabled: boolean
  onToggle: () => void
  enableLabel: string
  disableLabel: string
}

function ToggleRow({
  label,
  isEnabled,
  onToggle,
  enableLabel,
  disableLabel,
}: ToggleRowProps) {
  return (
    <div style={rowStyle}>
      <span>{label}</span>
      <button
        type="button"
        onClick={onToggle}
        aria-label={isEnabled ? disableLabel : enableLabel}
        aria-pressed={isEnabled}
        style={toggleButtonStyle}
      >
        {isEnabled ? 'ON' : 'OFF'}
      </button>
    </div>
  )
}

/** Low-frequency viewing controls and local scene save within the control menu. */
export function DisplaySettingsSection({
  isProjectorMode,
  onToggleProjectorMode,
  isNightModeUi,
  onToggleNightModeUi,
  isFullscreenSupported,
  isFullscreen,
  onToggleFullscreen,
  saveStatus,
  onSave,
}: DisplaySettingsSectionProps) {
  const saveStatusText =
    saveStatus === 'saved'
      ? '保存しました'
      : saveStatus === 'error'
        ? '保存失敗'
        : null

  return (
    <div style={sectionStyle}>
      <ToggleRow
        label="プロジェクター補正"
        isEnabled={isProjectorMode}
        onToggle={onToggleProjectorMode}
        enableLabel="プロジェクター補正を有効化"
        disableLabel="プロジェクター補正を解除"
      />
      <ToggleRow
        label="夜間モード"
        isEnabled={isNightModeUi}
        onToggle={onToggleNightModeUi}
        enableLabel="夜間モードを有効化"
        disableLabel="夜間モードを解除"
      />
      {isFullscreenSupported ? (
        <ToggleRow
          label="フルスクリーン"
          isEnabled={isFullscreen}
          onToggle={onToggleFullscreen}
          enableLabel="フルスクリーン表示にする"
          disableLabel="フルスクリーン表示を終了"
        />
      ) : null}
      <div style={saveRowStyle}>
        <button
          type="button"
          onClick={onSave}
          aria-label="現在のシーンを保存"
          style={overlayPillButtonStyle}
        >
          シーン保存
        </button>
        {saveStatusText ? (
          <span aria-live="polite" style={saveStatusStyle}>
            {saveStatusText}
          </span>
        ) : null}
      </div>
    </div>
  )
}

const sectionStyle = {
  padding: '12px 4px',
  borderBottom: `1px solid ${overlayColors.border}`,
}

const rowStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
  marginBottom: 10,
}

const toggleButtonStyle = {
  ...overlayPillButtonStyle,
  minHeight: 28,
  padding: '0 10px',
  fontSize: 12,
}

const saveRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
}

const saveStatusStyle = {
  color: overlayColors.text,
  fontSize: 12,
  opacity: 0.72,
}
