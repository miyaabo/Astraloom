import { describe, expect, it, vi } from 'vitest'
import {
  createSupabaseBrowserAuthClient,
  readSupabaseAuthClientConfig,
} from './authClient'

describe('authClient', () => {
  it('reads Supabase config only when both public env vars are present', () => {
    expect(
      readSupabaseAuthClientConfig({
        VITE_SUPABASE_URL: 'https://example.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'anon-key',
      }),
    ).toEqual({
      url: 'https://example.supabase.co',
      anonKey: 'anon-key',
    })

    expect(
      readSupabaseAuthClientConfig({
        VITE_SUPABASE_URL: 'https://example.supabase.co',
      }),
    ).toBeNull()
  })

  it('maps Supabase session and auth change callbacks into provider-neutral shapes', async () => {
    const unsubscribe = vi.fn()
    const callbackRef: {
      listener:
        | ((
            event: string,
            session: { user: { id: string; email?: string } } | null,
          ) => void)
        | null
    } = {
      listener: null,
    }
    const client = createSupabaseBrowserAuthClient({
      auth: {
        getSession: vi.fn(async () => ({
          data: {
            session: {
              user: {
                id: 'user-123',
                email: 'miya@example.com',
              },
            },
          },
          error: null,
        })),
        signInWithOtp: vi.fn(async () => ({ error: null })),
        signOut: vi.fn(async () => ({ error: null })),
        onAuthStateChange: vi.fn((callback) => {
          callbackRef.listener = callback
          return {
            data: {
              subscription: {
                unsubscribe,
              },
            },
          }
        }),
      },
    } as never)

    expect(await client.getSession()).toEqual({
      session: {
        user: {
          id: 'user-123',
          email: 'miya@example.com',
        },
      },
      error: null,
    })

    const handleSession = vi.fn()
    const dispose = client.onAuthStateChange(handleSession)
    if (callbackRef.listener) {
      callbackRef.listener('SIGNED_IN', {
        user: {
          id: 'user-456',
        },
      })
      callbackRef.listener('SIGNED_OUT', null)
    }

    expect(handleSession).toHaveBeenNthCalledWith(1, {
      user: {
        id: 'user-456',
        email: null,
      },
    })
    expect(handleSession).toHaveBeenNthCalledWith(2, null)

    dispose()
    expect(unsubscribe).toHaveBeenCalledOnce()
  })
})
