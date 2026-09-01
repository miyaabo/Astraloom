export type AuthStatus = 'restoring' | 'signed-out' | 'signed-in' | 'error'

export interface AuthenticatedUser {
  id: string
  email: string | null
}

export interface AuthState {
  status: AuthStatus
  user: AuthenticatedUser | null
  error: 'session-expired' | 'auth-failed' | null
}

export function createInitialAuthState(): AuthState {
  return {
    status: 'restoring',
    user: null,
    error: null,
  }
}

export function createSignedOutAuthState(): AuthState {
  return {
    status: 'signed-out',
    user: null,
    error: null,
  }
}

export function createSignedInAuthState(user: AuthenticatedUser): AuthState {
  return {
    status: 'signed-in',
    user,
    error: null,
  }
}

export function createAuthErrorState(
  error: NonNullable<AuthState['error']>,
): AuthState {
  return {
    status: 'error',
    user: null,
    error,
  }
}
