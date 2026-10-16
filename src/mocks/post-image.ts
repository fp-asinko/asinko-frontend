import { MOCK_STORAGE_HOST } from '@/lib/uploads/mock-storage'
import { DEMO_USER } from './demo-user'
import type { MockResponse } from './types'

/**
 * The image a mocked upload answers (specs/post-image), with every route mocked: a fixture, so
 * nothing leaves the server. POST /posts in the mocks takes only this one for an Image post.
 */
export const MOCK_POST_IMAGE = '/mocks/chart-btc.svg'

const TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const MAX_BYTES = 5 * 1024 * 1024

/**
 * POST /uploads/post-image as the backend (P-013, 2026-10-13): the demo user, JPEG, PNG, WebP or
 * GIF (never SVG), up to 5 MB; else 422. The upload URL is a placeholder nobody PUTs to.
 */
export function signPostImageUpload(body: unknown): MockResponse {
  const input = (body ?? {}) as Record<string, unknown>
  const invalid = { status: 422, body: { error: { code: 'VALIDATION_ERROR', message: 'mock' } } }
  if (input.userId !== DEMO_USER.id) {
    return { status: 403, body: { error: { code: 'USER_MISMATCH', message: 'mock' } } }
  }
  if (typeof input.contentType !== 'string' || !TYPES.has(input.contentType)) return invalid
  if (typeof input.size !== 'number' || input.size <= 0 || input.size > MAX_BYTES) return invalid
  const path = `${DEMO_USER.id}/mock.webp`
  return {
    status: 200,
    body: {
      uploadUrl: `https://${MOCK_STORAGE_HOST}/upload/${path}`,
      imageUrl: MOCK_POST_IMAGE,
      path,
    },
  }
}
