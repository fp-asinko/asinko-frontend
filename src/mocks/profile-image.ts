import { MOCK_STORAGE_HOST } from '@/lib/uploads/mock-storage'
import { DEMO_USER } from './demo-user'
import { signPostImageUpload } from './post-image'
import type { MockResponse } from './types'

/** What a mocked photo or banner upload answers (specs/profile-presentation): fixtures. */
export const MOCK_PROFILE_IMAGES = {
  avatar: '/mocks/avatar-demo.svg',
  banner: '/mocks/banner-demo.svg',
} as const

/**
 * POST /uploads/avatar and /uploads/profile-banner as P-021 proposes: the same rules as a post
 * image (the demo user; JPEG, PNG, WebP or GIF, never SVG; up to 5 MB). The upload URL is a
 * placeholder nobody PUTs to; the image, a fixture.
 */
export function signProfileImageUpload(
  kind: keyof typeof MOCK_PROFILE_IMAGES,
  body: unknown,
): MockResponse {
  const signed = signPostImageUpload(body)
  if (signed.status !== 200) return signed
  const path = `${DEMO_USER.id}/${kind}.webp`
  return {
    status: 200,
    body: {
      uploadUrl: `https://${MOCK_STORAGE_HOST}/upload/${path}`,
      imageUrl: MOCK_PROFILE_IMAGES[kind],
      path,
    },
  }
}
