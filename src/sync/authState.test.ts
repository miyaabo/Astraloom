import { describe, expect, it } from 'vitest'
import {
  createAuthErrorState,
  createInitialAuthState,
  createSignedInAuthState,
  createSignedOutAuthState,
} from './authState'

describe('authState', () => {
  it('starts in restoring state before session restore resolves', () => {
    expect(createInitialAuthState()).toEqual({
      status: 'restoring',
      user: null,
      error: null,
    })
  })

  it('builds a signed-in state without provider-specific session details', () => {
    expect(
      createSignedInAuthState({
        id: 'user-123',
        email: 'miya@example.com',
      }),
    ).toEqual({
      status: 'signed-in',
      user: {
        id: 'user-123',
        email: 'miya@example.com',
      },
      error: null,
    })
  })

  it('can represent signed-out and failed auth states separately', () => {
    expect(createSignedOutAuthState()).toEqual({
      status: 'signed-out',
      user: null,
      error: null,
    })
    expect(createAuthErrorState('session-expired')).toEqual({
      status: 'error',
      user: null,
      error: 'session-expired',
    })
  })
})
