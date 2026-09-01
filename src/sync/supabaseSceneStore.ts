import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  createPersistedSceneState,
  parsePersistedSceneState,
  type PersistedSceneStateV1,
  type SavedSceneState,
} from '../save/sceneState'
import type {
  SceneStore,
  SceneStoreReadResult,
  SceneStoreWriteResult,
} from './sceneRepository'

export interface SupabaseSceneStoreConfig {
  url: string
  anonKey: string
  tableName: string
}

interface SupabaseSceneSnapshotRow {
  user_id: string
  scene_version: number
  scene_payload: SavedSceneState
  saved_at_iso: string
  updated_at?: string
}

interface SupabaseSceneStoreClient {
  auth: {
    getUser(): Promise<{
      data: {
        user: {
          id: string
        } | null
      }
      error: unknown
    }>
  }
  from(tableName: string): {
    select(columns: string): {
      eq(column: string, value: string): {
        maybeSingle(): Promise<{
          data: SupabaseSceneSnapshotRow | null
          error: unknown
        }>
      }
    }
    upsert(
      values: SupabaseSceneSnapshotRow,
      options: { onConflict: string },
    ): Promise<{
      error: unknown
    }>
  }
}

export function readSupabaseSceneStoreConfig(
  env: Record<string, string | boolean | undefined>,
): SupabaseSceneStoreConfig | null {
  const url = env.VITE_SUPABASE_URL
  const anonKey = env.VITE_SUPABASE_ANON_KEY
  const tableName = env.VITE_SUPABASE_SCENE_TABLE
  if (
    typeof url !== 'string' ||
    typeof anonKey !== 'string' ||
    url.length === 0 ||
    anonKey.length === 0
  ) {
    return null
  }

  return {
    url,
    anonKey,
    tableName:
      typeof tableName === 'string' && tableName.length > 0
        ? tableName
        : 'scene_snapshots',
  }
}

export function createSupabaseSceneStore(
  config: SupabaseSceneStoreConfig,
): SceneStore {
  const client = createClient(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })

  return createSupabaseSceneStoreFromClient(client, config.tableName)
}

export function createSupabaseSceneStoreFromClient(
  client: SupabaseSceneStoreClient | SupabaseClient,
  tableName: string,
): SceneStore {
  return {
    kind: 'cloud',
    async loadScene(): Promise<SceneStoreReadResult> {
      if (!isNavigatorOnline()) {
        return {
          scene: null,
          error: 'offline',
        }
      }

      const currentUser = await getCurrentUserId(client)
      if (!currentUser.ok) {
        return {
          scene: null,
          error: currentUser.error,
        }
      }

      const { data, error } = await client
        .from(tableName)
        .select('user_id, scene_version, scene_payload, saved_at_iso, updated_at')
        .eq('user_id', currentUser.userId)
        .maybeSingle()

      if (error) {
        return {
          scene: null,
          error: 'read-failed',
        }
      }

      if (!data) {
        return {
          scene: null,
          error: 'not-found',
        }
      }

      const scene = mapSceneRowToPersistedState(data)
      if (!scene) {
        return {
          scene: null,
          error: 'read-failed',
        }
      }

      return {
        scene,
        error: null,
      }
    },
    async saveScene(scene: PersistedSceneStateV1): Promise<SceneStoreWriteResult> {
      if (!isNavigatorOnline()) {
        return {
          ok: false,
          error: 'offline',
        }
      }

      const currentUser = await getCurrentUserId(client)
      if (!currentUser.ok) {
        return {
          ok: false,
          error:
            currentUser.error === 'auth-required'
              ? 'auth-required'
              : 'write-failed',
        }
      }

      const row: SupabaseSceneSnapshotRow = {
        user_id: currentUser.userId,
        scene_version: scene.version,
        scene_payload: scene.scene,
        saved_at_iso: scene.savedAtIso,
      }

      const { error } = await client.from(tableName).upsert(row, {
        onConflict: 'user_id',
      })

      return {
        ok: !error,
        error: error ? 'write-failed' : null,
      }
    },
  }
}

function mapSceneRowToPersistedState(
  row: SupabaseSceneSnapshotRow,
): PersistedSceneStateV1 | null {
  if (
    typeof row.scene_version !== 'number' ||
    typeof row.saved_at_iso !== 'string' ||
    typeof row.user_id !== 'string'
  ) {
    return null
  }

  const persisted = createPersistedSceneState(
    row.scene_payload,
    new Date(row.saved_at_iso),
  )

  return parsePersistedSceneState(JSON.stringify(persisted))
}

async function getCurrentUserId(
  client: SupabaseSceneStoreClient | SupabaseClient,
): Promise<
  | { ok: true; userId: string }
  | { ok: false; error: 'auth-required' | 'read-failed' }
> {
  const { data, error } = await client.auth.getUser()
  if (error) {
    return {
      ok: false,
      error: 'read-failed',
    }
  }
  if (!data.user) {
    return {
      ok: false,
      error: 'auth-required',
    }
  }

  return {
    ok: true,
    userId: data.user.id,
  }
}

function isNavigatorOnline(): boolean {
  if (typeof navigator === 'undefined') {
    return true
  }
  return navigator.onLine
}
