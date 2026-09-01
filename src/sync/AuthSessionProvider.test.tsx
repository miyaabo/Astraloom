import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  AuthSessionProvider,
  useAuthSession,
} from './AuthSessionProvider'
import type { AuthClient } from './authClient'

function TestProbe() {
  const { authState, isConfigured } = useAuthSession()
  return (
    <div>
      <span data-testid="status">{authState.status}</span>
      <span data-testid="email">{authState.user?.email ?? 'none'}</span>
      <span data-testid="configured">{String(isConfigured)}</span>
      <span data-testid="error">{authState.error ?? 'none'}</span>
    </div>
  )
}

function createAuthClient(overrides?: Partial<AuthClient>): AuthClient {
  return {
    getSession: async () => ({ session: null, error: null }),
    signInWithOtp: async () => ({ ok: true, error: null }),
    signOut: async () => ({ ok: true, error: null }),
    onAuthStateChange: () => () => {},
    ...overrides,
  }
}

describe('AuthSessionProvider', () => {
  it('falls back to signed-out when Supabase config is not present', async () => {
    render(
      <AuthSessionProvider client={null}>
        <TestProbe />
      </AuthSessionProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('signed-out')
    })
    expect(screen.getByTestId('configured').textContent).toBe('false')
  })

  it('restores an existing session and exposes configured auth state', async () => {
    render(
      <AuthSessionProvider
        client={createAuthClient({
          getSession: async () => ({
            session: {
              user: {
                id: 'user-123',
                email: 'miya@example.com',
              },
            },
            error: null,
          }),
        })}
      >
        <TestProbe />
      </AuthSessionProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('signed-in')
    })
    expect(screen.getByTestId('email').textContent).toBe('miya@example.com')
    expect(screen.getByTestId('configured').textContent).toBe('true')
  })

  it('subscribes to auth changes and falls back to error state on restore failure', async () => {
    const unsubscribe = vi.fn()
    const callbackRef: {
      emit:
        | ((session: { user: { id: string; email: string | null } } | null) => void)
        | null
    } = {
      emit: null,
    }

    render(
      <AuthSessionProvider
        client={createAuthClient({
          getSession: async () => ({
            session: null,
            error: 'session-expired',
          }),
          onAuthStateChange: (listener) => {
            callbackRef.emit = listener
            return unsubscribe
          },
        })}
      >
        <TestProbe />
      </AuthSessionProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('error')
    })
    expect(screen.getByTestId('error').textContent).toBe('session-expired')

    if (callbackRef.emit) {
      callbackRef.emit({
        user: {
          id: 'user-456',
          email: 'restored@example.com',
        },
      })
    }

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('signed-in')
    })
    expect(screen.getByTestId('email').textContent).toBe('restored@example.com')
  })
})
