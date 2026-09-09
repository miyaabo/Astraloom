import type { ControlMenuSection } from './displayState'
import {
  overlayButtonStyle,
  overlayColors,
  overlayCornerMarginPx,
} from './overlayStyles'

interface ControlMenuOverlayProps {
  isOpen: boolean
  activeSection: ControlMenuSection | null
  locationLabel: string | null
  date: Date
  timeZoneId: string
  onToggleMenu: () => void
  onCloseMenu: () => void
  onToggleSection: (section: ControlMenuSection) => void
}

const sectionLabels: Record<ControlMenuSection, string> = {
  sky: '空を選ぶ',
  time: '時間を動かす',
  search: '空を探す',
  display: '表示・投影',
}

function formatCurrentSky(date: Date, timeZoneId: string): string {
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: timeZoneId,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/**
 * Navigation shell for the unified controls. Section contents move here in
 * Tasks 3–6; this task establishes the shared entry point and interaction.
 */
export function ControlMenuOverlay({
  isOpen,
  activeSection,
  locationLabel,
  date,
  timeZoneId,
  onToggleMenu,
  onCloseMenu,
  onToggleSection,
}: ControlMenuOverlayProps) {
  const summary = `${locationLabel ?? '現在地'} · ${formatCurrentSky(date, timeZoneId)}`

  return (
    <>
      {isOpen && (
        <div
          aria-hidden="true"
          onClick={onCloseMenu}
          style={{ position: 'fixed', inset: 0, zIndex: 3 }}
        />
      )}
      <div
        style={{
          position: 'fixed',
          top: `calc(${overlayCornerMarginPx}px + env(safe-area-inset-top, 0px))`,
          left: `calc(${overlayCornerMarginPx}px + env(safe-area-inset-left, 0px))`,
          zIndex: 4,
        }}
      >
        <button
          type="button"
          onClick={onToggleMenu}
          aria-label={isOpen ? '操作メニューを閉じる' : '操作メニューを開く'}
          aria-expanded={isOpen}
          aria-controls="control-menu"
          style={overlayButtonStyle}
        >
          ☰
        </button>

        {isOpen && (
          <aside
            id="control-menu"
            aria-label="操作メニュー"
            onClick={(event) => event.stopPropagation()}
            style={{
              position: 'absolute',
              top: `calc(100% + 8px)`,
              left: 0,
              width: 'min(360px, calc(100vw - 24px - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px)))',
              maxHeight: 'calc(100dvh - 72px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))',
              overflowY: 'auto',
              boxSizing: 'border-box',
              padding: 12,
              border: `1px solid ${overlayColors.border}`,
              borderRadius: 12,
              background: overlayColors.panelBackground,
              color: overlayColors.text,
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.32)',
            }}
          >
            <button
              type="button"
              onClick={() => onToggleSection('sky')}
              aria-expanded={activeSection === 'sky'}
              style={summaryStyle}
            >
              <span style={{ opacity: 0.68, fontSize: 12 }}>現在の空</span>
              <span style={{ marginTop: 3, fontSize: 14 }}>{summary}</span>
            </button>
            {(Object.keys(sectionLabels) as ControlMenuSection[]).map(
              (section) => (
                <button
                  key={section}
                  type="button"
                  onClick={() => onToggleSection(section)}
                  aria-expanded={activeSection === section}
                  style={sectionStyle}
                >
                  {sectionLabels[section]}
                  <span aria-hidden="true">
                    {activeSection === section ? '−' : '+'}
                  </span>
                </button>
              ),
            )}
          </aside>
        )}
      </div>
    </>
  )
}

const summaryStyle = {
  display: 'flex',
  width: '100%',
  flexDirection: 'column' as const,
  alignItems: 'flex-start',
  padding: '8px 4px 12px',
  border: 'none',
  borderBottom: `1px solid ${overlayColors.border}`,
  background: 'transparent',
  color: overlayColors.text,
  textAlign: 'left' as const,
  cursor: 'pointer',
}

const sectionStyle = {
  display: 'flex',
  width: '100%',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 4px',
  border: 'none',
  borderBottom: `1px solid ${overlayColors.border}`,
  background: 'transparent',
  color: overlayColors.text,
  fontSize: 14,
  textAlign: 'left' as const,
  cursor: 'pointer',
}
