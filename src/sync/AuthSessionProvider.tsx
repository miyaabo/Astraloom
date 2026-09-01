import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import {
  createAuthErrorState,
  createInitialAuthState,
  createSignedInAuthState,
  createSignedOutAuthState,
  type AuthState,
} from './authState'
import {
  createSupabaseAuthClient,
  readSupabaseAuthClientConfig,
  type AuthClient,
  type AuthCommandResult,
  type AuthSession,
} from './authClient'

export interface AuthSessionContextValue {
  authState: AuthState
  isConfigured: boolean
  signInWithOtp(email: string): Promise<AuthCommandResult>
  signOut(): Promise<AuthCommandResult>
}

const defaultContextValue: AuthSessionContextValue = {
  authState: createInitialAuthState(),
  isConfigured: false,
  async signInWithOtp() {
    return {
      ok: false,
      error: 'auth-failed',
    }
  },
  async signOut() {
    return {
      ok: false,
      error: 'auth-failed',
    }
  },
}

const AuthSessionContext =
  createContext<AuthSessionContextValue>(defaultContextValue)

export interface AuthSessionProviderProps extends PropsWithChildren {
  client?: AuthClient | null
}

export function AuthSessionProvider({
  children,
  client,
}: AuthSessionProviderProps) {
  const [authState, setAuthState] = useState(() => createInitialAuthState())

  const resolvedClient = useMemo(() => {
    if (client !== undefined) {
      return client
    }

    const config = readSupabaseAuthClientConfig(
      import.meta.env as Record<string, string | boolean | undefined>,
    )
    return config ? createSupabaseAuthClient(config) : null
  }, [client])

  useEffect(() => {
    if (!resolvedClient) {
      setAuthState(createSignedOutAuthState())
      return
    }

    const clientInstance = resolvedClient
    let isDisposed = false

    async function restoreSession(): Promise<void> {
      const result = await clientInstance.getSession()
      if (isDisposed) return

      if (result.error) {
        setAuthState(createAuthErrorState(result.error))
        return
      }

      setAuthState(createAuthStateFromSession(result.session))
    }

    void restoreSession()

    const unsubscribe = clientInstance.onAuthStateChange((session) => {
      if (isDisposed) return
      setAuthState(createAuthStateFromSession(session))
    })

    return () => {
      isDisposed = true
      unsubscribe()
    }
  }, [resolvedClient])

  const contextValue = useMemo<AuthSessionContextValue>(
    () => ({
      authState,
      isConfigured: resolvedClient !== null,
      async signInWithOtp(email: string): Promise<AuthCommandResult> {
        if (!resolvedClient) {
          const errorResult = { ok: false, error: 'auth-failed' as const }
          setAuthState(createSignedOutAuthState())
          return errorResult
        }

        const result = await resolvedClient.signInWithOtp(email)
        if (result.error === 'session-expired') {
          setAuthState(createAuthErrorState('session-expired'))
        }
        return result
      },
      async signOut(): Promise<AuthCommandResult> {
        if (!resolvedClient) {
          setAuthState(createSignedOutAuthState())
          return { ok: true, error: null }
        }

        const result = await resolvedClient.signOut()
        if (!result.ok && result.error) {
          setAuthState(createAuthErrorState(result.error))
          return result
        }

        setAuthState(createSignedOutAuthState())
        return result
      },
    }),
    [authState, resolvedClient],
  )

  return (
    <AuthSessionContext.Provider value={contextValue}>
      {children}
    </AuthSessionContext.Provider>
  )
}

export function useAuthSession(): AuthSessionContextValue {
  return useContext(AuthSessionContext)
}

function createAuthStateFromSession(session: AuthSession | null): AuthState {
  if (!session) {
    return createSignedOutAuthState()
  }

  return createSignedInAuthState(session.user)
}
