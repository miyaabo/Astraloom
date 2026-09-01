import { useEffect, useState } from 'react'
import type { AuthState } from './sync/authState'
import type { AuthCommandResult } from './sync/authClient'
import {
  overlayButtonGapPx,
  overlayButtonSizePx,
  overlayButtonStyle,
  overlayColors,
  overlayCornerMarginPx,
  overlayPanelStyle,
} from './overlayStyles'

const rightOffsetPx =
  overlayCornerMarginPx + (overlayButtonSizePx + overlayButtonGapPx) * 2

interface AccountSyncOverlayProps {
  authState: AuthState
  isConfigured: boolean
  isOpen: boolean
  onToggleOpen: () => void
  onSignInWithOtp: (email: string) => Promise<AuthCommandResult>
  onSignOut: () => Promise<AuthCommandResult>
}

interface AccountSyncSurfaceState {
  collapsedLabel: string
  detail: string
}

export function AccountSyncOverlay({
  authState,
  isConfigured,
  isOpen,
  onToggleOpen,
  onSignInWithOtp,
  onSignOut,
}: AccountSyncOverlayProps) {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [commandMessage, setCommandMessage] = useState<string | null>(null)
  const surfaceState = resolveAccountSyncSurfaceState(authState, isConfigured)

  useEffect(() => {
    if (authState.status === 'signed-in') {
      setCommandMessage(null)
    }
  }, [authState.status])

  async function handleSubmit(): Promise<void> {
    const normalizedEmail = email.trim()
    if (!normalizedEmail) return

    setIsSubmitting(true)
    const result = await onSignInWithOtp(normalizedEmail)
    setIsSubmitting(false)
    setCommandMessage(
      result.ok
        ? '確認メールを送信しました'
        : 'サインインメールを送信できませんでした',
    )
  }

  async function handleSignOut(): Promise<void> {
    setIsSubmitting(true)
    const result = await onSignOut()
    setIsSubmitting(false)
    setCommandMessage(result.ok ? null : 'サインアウトに失敗しました')
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: overlayCornerMarginPx,
        right: rightOffsetPx,
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 4,
      }}
    >
      <button
        type="button"
        onClick={onToggleOpen}
        aria-label="アカウント・同期"
        aria-expanded={isOpen}
        style={overlayButtonStyle}
      >
        ☁
      </button>
      <span
        aria-live="polite"
        style={{
          maxWidth: 88,
          color: overlayColors.text,
          fontSize: 11,
          lineHeight: 1.2,
          textAlign: 'right',
          opacity: 0.68,
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.35)',
        }}
      >
        {surfaceState.collapsedLabel}
      </span>

      {isOpen && (
        <div style={{ ...overlayPanelStyle('right'), width: 248 }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <strong style={{ fontSize: 14 }}>アカウント・同期</strong>
            <span style={{ fontSize: 12, opacity: 0.78 }}>{surfaceState.detail}</span>

            {authState.status === 'signed-in' ? (
              <>
                <span style={{ fontSize: 13 }}>
                  {authState.user?.email ?? 'メールアドレス未取得'}
                </span>
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  disabled={isSubmitting}
                  aria-label="サインアウト"
                  style={{
                    ...overlayButtonStyle,
                    width: '100%',
                    borderRadius: 999,
                  }}
                >
                  サインアウト
                </button>
              </>
            ) : null}

            {authState.status !== 'signed-in' ? (
              <>
                <label style={{ display: 'block', fontSize: 13 }}>
                  メールアドレス
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@example.com"
                    disabled={!isConfigured || isSubmitting}
                    style={{
                      display: 'block',
                      width: '100%',
                      boxSizing: 'border-box',
                      marginTop: 4,
                      padding: '6px 8px',
                      borderRadius: 6,
                      border: `1px solid ${overlayColors.border}`,
                      background: overlayColors.controlBackground,
                      color: overlayColors.text,
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => void handleSubmit()}
                  disabled={!isConfigured || isSubmitting || email.trim().length === 0}
                  style={{
                    ...overlayButtonStyle,
                    width: '100%',
                    borderRadius: 999,
                  }}
                >
                  サインインメール送信
                </button>
              </>
            ) : null}

            {commandMessage ? (
              <span aria-live="polite" style={{ fontSize: 12, opacity: 0.78 }}>
                {commandMessage}
              </span>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}

function resolveAccountSyncSurfaceState(
  authState: AuthState,
  isConfigured: boolean,
): AccountSyncSurfaceState {
  if (!isConfigured) {
    return {
      collapsedLabel: 'ローカル保存',
      detail: '同期設定が未投入のため、この端末ではローカル保存のみ使えます。',
    }
  }

  if (authState.status === 'restoring') {
    return {
      collapsedLabel: '認証確認中',
      detail: '前回のセッションを確認しています。',
    }
  }

  if (authState.status === 'signed-in') {
    return {
      collapsedLabel: '同期準備OK',
      detail: 'サインイン済みです。保存先の DB 接続は今後の要件整理後に接続します。',
    }
  }

  if (authState.status === 'error') {
    return {
      collapsedLabel: 'ローカル退避',
      detail:
        authState.error === 'session-expired'
          ? 'セッションが切れたため、いまはローカル保存へ戻しています。'
          : '認証に失敗したため、いまはローカル保存へ戻しています。',
    }
  }

  return {
    collapsedLabel: 'ローカル保存',
    detail: '未サインインです。認証導線のみ先にあり、保存は現在ローカルのみです。',
  }
}
