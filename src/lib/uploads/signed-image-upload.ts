import 'server-only'
import * as Sentry from '@sentry/nextjs'
import { env } from '@/env'
import { apiRequest } from '@/lib/api'
import { postImageUploadSchema } from '@/lib/api/contract'
import { MOCK_STORAGE_HOST } from './mock-storage'

const TIMEOUT_MS = 10_000

/**
 * Where the backend signs an image upload: a post's (P-013), a profile's (P-021, proposal) or a
 * group's widget (P-029, proposal).
 */
export type SignedImagePath =
  | '/api/v1/uploads/post-image'
  | '/api/v1/uploads/avatar'
  | '/api/v1/uploads/profile-banner'
  | '/api/v1/uploads/community-image'

export type UploadDeps = {
  fetch: typeof fetch
  /** Supabase's origin: the only place this server sends image bytes to. */
  storageOrigin?: string
  /** Mocks on (API_MOCKS true or missing): a mocked route's placeholder URL is not PUT to. */
  mocked: boolean
}

const defaults = (): UploadDeps => ({
  fetch: globalThis.fetch,
  storageOrigin: env.SUPABASE_URL ? new URL(env.SUPABASE_URL).origin : undefined,
  mocked: env.API_MOCKS !== 'off',
})

export type UploadResult =
  | { ok: true; data: { imageUrl: string } }
  | { ok: false; error: 'type' | 'unauthenticated' | 'upload' }

/**
 * Uploads an image the backend's way (P-013, specs/backend-answer-1013 BA-01; P-021 for a profile's
 * photo and banner): this server asks for a signed URL (with the user from the session) and PUTs
 * the bytes there itself, so the browser never talks to another domain. The URL comes from the
 * backend: the bytes only go to our own Storage, over https. Never throws; a failure is reported
 * without personal data.
 */
export async function uploadSignedImage(
  path: SignedImagePath,
  input: {
    userId: string
    body: Blob
    contentType: string
    /** What else the path asks (a group's image: its communityId). */
    extra?: Record<string, string>
  },
  deps: UploadDeps = defaults(),
): Promise<UploadResult> {
  const asked = await apiRequest({
    method: 'POST',
    path,
    body: {
      ...input.extra,
      userId: input.userId,
      contentType: input.contentType,
      size: input.body.size,
    },
    schema: postImageUploadSchema,
  })
  if (!asked.ok) {
    if (asked.code === 'UNAUTHENTICATED') return { ok: false, error: 'unauthenticated' }
    // 422: the type or the size (the client already reported anything unexpected).
    return { ok: false, error: asked.kind === 'expected' ? 'type' : 'upload' }
  }
  const { uploadUrl, imageUrl } = asked.data
  if (deps.mocked && hostOf(uploadUrl) === MOCK_STORAGE_HOST)
    return { ok: true, data: { imageUrl } }
  if (!isOurStorage(uploadUrl, deps.storageOrigin)) return failed(path, 'foreign-url')

  try {
    const response = await deps.fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': input.contentType },
      body: input.body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (!response.ok) return failed(path, `status ${response.status}`)
  } catch (error) {
    return failed(path, error instanceof Error ? error.name : 'network')
  }
  return { ok: true, data: { imageUrl } }
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname
  } catch {
    return null
  }
}

function isOurStorage(url: string, origin: string | undefined): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && origin !== undefined && parsed.origin === origin
  } catch {
    return false
  }
}

function failed(path: SignedImagePath, reason: string): { ok: false; error: 'upload' } {
  Sentry.captureMessage('Image upload failed', {
    level: 'warning',
    tags: { endpoint: `PUT signed ${path.replace('/api/v1/uploads/', '')} upload`, reason },
  })
  return { ok: false, error: 'upload' }
}
