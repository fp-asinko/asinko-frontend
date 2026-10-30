import 'server-only'
import { env } from '@/env'
import { mockGooglePhotoFetch } from '@/mocks/auth'
import { downloadGooglePhoto, type GooglePhoto } from './google-photo'

/**
 * The Google photo of the session's account, downloaded by the server (specs/auth design.md § 15):
 * the simulated one with every route mocked (CI), the real one otherwise.
 */
export function downloadSuggestedPhoto(
  url: string | null | undefined,
): Promise<GooglePhoto | null> {
  return downloadGooglePhoto(
    url,
    env.API_MOCKS === 'all' ? mockGooglePhotoFetch : fetch,
    env.API_TIMEOUT_MS,
  )
}
