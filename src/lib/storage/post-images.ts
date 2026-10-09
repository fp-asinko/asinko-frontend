import 'server-only'
import * as Sentry from '@sentry/nextjs'
import { env } from '@/env'
import { MOCK_POST_IMAGE } from '@/mocks/post-image'

/** The backend's bucket for post images (asinko-app lib/api/storage.ts, POST_IMAGE_BUCKET). */
export const POST_IMAGE_BUCKET = 'post-images'

const TIMEOUT_MS = 10_000

type Deps = {
  baseUrl?: string
  anonKey?: string
  fetch: typeof fetch
  mocked: boolean
}

const defaults = (): Deps => ({
  baseUrl: env.SUPABASE_URL,
  anonKey: env.SUPABASE_ANON_KEY,
  fetch: globalThis.fetch,
  mocked: env.API_MOCKS === 'all',
})

export type StorageResult<T> = { ok: true; data: T } | { ok: false }

/**
 * Uploads a post image into the user's folder of the bucket (specs/post-image PI-07):
 * `{userId}/{uuid}.webp`, with the user's own token, so the bucket's policy ("only your folder")
 * applies and the backend's POST /posts takes the public URL. The server does it: the token lives
 * in an HttpOnly cookie and never reaches the browser. Never throws; a failure is reported without
 * personal data.
 */
export async function uploadPostImage(
  input: { userId: string; token: string; body: Blob; contentType: string },
  deps: Deps = defaults(),
): Promise<StorageResult<{ imageUrl: string }>> {
  if (deps.mocked) return { ok: true, data: { imageUrl: MOCK_POST_IMAGE } }
  if (!deps.baseUrl || !deps.anonKey) return failed('not-configured')

  const extension = input.contentType.split('/')[1] === 'jpeg' ? 'jpg' : 'webp'
  const path = `${input.userId}/${crypto.randomUUID()}.${extension}`
  try {
    const response = await deps.fetch(
      `${deps.baseUrl}/storage/v1/object/${POST_IMAGE_BUCKET}/${path}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${input.token}`,
          apikey: deps.anonKey,
          'Content-Type': input.contentType,
          'x-upsert': 'false',
        },
        body: input.body,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    )
    if (!response.ok) return failed(`status ${response.status}`)
  } catch (error) {
    return failed(error instanceof Error ? error.name : 'network')
  }
  return {
    ok: true,
    data: {
      imageUrl: `${deps.baseUrl}/storage/v1/object/public/${POST_IMAGE_BUCKET}/${path}`,
    },
  }
}

/**
 * Deletes a post image the user removed or left (Q1): only a file of their own folder, from its
 * public URL. Best effort: nothing to say if it fails.
 */
export async function removePostImage(
  input: { userId: string; token: string; imageUrl: string },
  deps: Deps = defaults(),
): Promise<StorageResult<null>> {
  if (deps.mocked) return { ok: true, data: null }
  if (!deps.baseUrl || !deps.anonKey) return { ok: false }
  const prefix = `${deps.baseUrl}/storage/v1/object/public/${POST_IMAGE_BUCKET}/${input.userId}/`
  const name = input.imageUrl.startsWith(prefix) ? input.imageUrl.slice(prefix.length) : ''
  // One file name of the user's folder: never another folder, never a path.
  if (!/^[\w-]+\.(webp|jpg)$/.test(name)) return { ok: false }
  try {
    const response = await deps.fetch(
      `${deps.baseUrl}/storage/v1/object/${POST_IMAGE_BUCKET}/${input.userId}/${name}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${input.token}`, apikey: deps.anonKey },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    )
    return response.ok ? { ok: true, data: null } : { ok: false }
  } catch {
    return { ok: false }
  }
}

function failed(reason: string): { ok: false } {
  Sentry.captureMessage('Post image upload failed', {
    level: 'warning',
    tags: { storage: POST_IMAGE_BUCKET, reason },
  })
  return { ok: false }
}
