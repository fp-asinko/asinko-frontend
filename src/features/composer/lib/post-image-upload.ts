import 'server-only'
import * as Sentry from '@sentry/nextjs'
import { env } from '@/env'
import { apiRequest } from '@/lib/api'
import { postImageUploadSchema } from '@/lib/api/contract'

const TIMEOUT_MS = 10_000

type Deps = {
  fetch: typeof fetch
  /** Supabase's origin: the only place this server sends image bytes to. */
  storageOrigin?: string
  /** Every route mocked: the upload URL is the mocks', nothing is sent. */
  mocked: boolean
}

const defaults = (): Deps => ({
  fetch: globalThis.fetch,
  storageOrigin: env.SUPABASE_URL ? new URL(env.SUPABASE_URL).origin : undefined,
  mocked: env.API_MOCKS === 'all',
})

export type UploadResult =
  | { ok: true; data: { imageUrl: string } }
  | { ok: false; error: 'type' | 'unauthenticated' | 'upload' }

/**
 * Uploads a post image the backend's way (P-013, specs/backend-answer-1013 BA-01, Q1): this server
 * asks for a signed URL (POST /uploads/post-image, with the user from the session) and PUTs the
 * bytes there itself, so the browser never talks to another domain. The URL comes from the
 * backend: the bytes only go to our own Storage, over https. Never throws; a failure is reported
 * without personal data.
 */
export async function uploadPostImage(
  input: { userId: string; body: Blob; contentType: string },
  deps: Deps = defaults(),
): Promise<UploadResult> {
  const asked = await apiRequest({
    method: 'POST',
    path: '/api/v1/uploads/post-image',
    body: { userId: input.userId, contentType: input.contentType, size: input.body.size },
    schema: postImageUploadSchema,
  })
  if (!asked.ok) {
    if (asked.code === 'UNAUTHENTICATED') return { ok: false, error: 'unauthenticated' }
    // 422: the type or the size (the client already reported anything unexpected).
    return { ok: false, error: asked.kind === 'expected' ? 'type' : 'upload' }
  }
  const { uploadUrl, imageUrl } = asked.data
  if (deps.mocked) return { ok: true, data: { imageUrl } }
  if (!isOurStorage(uploadUrl, deps.storageOrigin)) return failed('foreign-url')

  try {
    const response = await deps.fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': input.contentType },
      body: input.body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (!response.ok) return failed(`status ${response.status}`)
  } catch (error) {
    return failed(error instanceof Error ? error.name : 'network')
  }
  return { ok: true, data: { imageUrl } }
}

function isOurStorage(url: string, origin: string | undefined): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && origin !== undefined && parsed.origin === origin
  } catch {
    return false
  }
}

function failed(reason: string): { ok: false; error: 'upload' } {
  Sentry.captureMessage('Post image upload failed', {
    level: 'warning',
    tags: { endpoint: 'PUT signed post-image upload', reason },
  })
  return { ok: false, error: 'upload' }
}
