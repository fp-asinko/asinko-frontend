'use server'

import type { GooglePhoto } from '@/lib/auth/google-photo'
import { readSession } from '@/lib/auth/session'
import { downloadSuggestedPhoto } from '@/lib/auth/suggested-photo'

/**
 * The Google photo the welcome screen offers (specs/auth AU-22, design.md § 15), as bytes: the
 * browser prepares it like a photo from the device, and the CSP stays closed to Google. Only for
 * the session's own account while it has no profile; null otherwise, or when it cannot be had.
 */
export async function getSuggestedPhoto(): Promise<GooglePhoto | null> {
  const session = await readSession()
  if (!session || session.username || !session.photoSuggestion) return null
  return downloadSuggestedPhoto(session.photoSuggestion)
}
