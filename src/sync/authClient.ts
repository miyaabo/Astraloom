import { createClient } from '@supabase/supabase-js'
import type { Session, SupabaseClient } from '@supabase/supabase-js'
import type { AuthenticatedUser } from './authState'

export interface AuthSession {
  user: AuthenticatedUser
}

export interface AuthSessionResult {
  session: AuthSession | null
  error: 'session-expired' | 'auth-failed' | null
}

export interface AuthCommandResult {
  ok: boolean
  error: 'session-expired' | 'auth-failed' | null
}

export interface AuthClient {
  getSession(): Promise<AuthSessionResult>
  signInWithOtp(email: string): Promise<AuthCommandResult>
  signOut(): Promise<AuthCommandResult>
  onAuthStateChange(listener: (session: AuthSession | null) => void): () => void
}

export interface SupabaseAuthClientConfig {
  url: string
  anonKey: string
}

export function readSupabaseAuthClientConfig(
  env: Record<string, string | boolean | undefined>,
): SupabaseAuthClientConfig | null {
  const url = env.VITE_SUPABASE_URL
  const anonKey = env.VITE_SUPABASE_ANON_KEY
  if (typeof url !== 'string' || typeof anonKey !== 'string') {
    return null
  }
  if (url.length === 0 || anonKey.length === 0) {
    return null
  }

  return {
    url,
    anonKey,
  }
}

export function createSupabaseAuthClient(
  config: SupabaseAuthClientConfig,
): AuthClient {
  const client = createClient(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })

  return createSupabaseBrowserAuthClient(client)
}

export function createSupabaseBrowserAuthClient(
  client: SupabaseClient,
): AuthClient {
  return {
    async getSession(): Promise<AuthSessionResult> {
      const { data, error } = await client.auth.getSession()
      if (error) {
        return {
          session: null,
          error: 'auth-failed',
        }
      }

      return {
        session: mapSupabaseSession(data.session),
        error: null,
      }
    },
    async signInWithOtp(email: string): Promise<AuthCommandResult> {
      const { error } = await client.auth.signInWithOtp({
        email,
      })
      return {
        ok: !error,
        error: error ? 'auth-failed' : null,
      }
    },
    async signOut(): Promise<AuthCommandResult> {
      const { error } = await client.auth.signOut()
      return {
        ok: !error,
        error: error ? 'auth-failed' : null,
      }
    },
    onAuthStateChange(listener: (session: AuthSession | null) => void): () => void {
      const { data } = client.auth.onAuthStateChange((_event, session) => {
        listener(mapSupabaseSession(session))
      })

      return () => {
        data.subscription.unsubscribe()
      }
    },
  }
}

function mapSupabaseSession(session: Session | null): AuthSession | null {
  if (!session?.user) {
    return null
  }

  return {
    user: {
      id: session.user.id,
      email: session.user.email ?? null,
    },
  }
}
