'use server'

import { z } from 'zod'
import { getViewer } from '@/lib/session'
import type { ActionResult } from '@/lib/result'
import { createThesisAs } from '../lib/theses-api'
import { isDeadlineInRange } from '../lib/thesis-deadline'
import { createThesisSchema } from '../schemas/create-thesis.schema'

/** The backend codes that belong to a field (specs/thesis-create § 7): the error goes there. */
const FIELD_ERRORS: Record<string, [field: string, key: string]> = {
  CLAIM_TOO_LONG: ['claim', 'composer.thesis.errors.claimTooLong'],
  DEADLINE_OUT_OF_RANGE: ['deadline', 'composer.thesis.errors.deadline'],
  ASSET_NOT_FOUND: ['assetSymbol', 'composer.thesis.errors.asset'],
  AMBIGUOUS_SYMBOL: ['assetSymbol', 'composer.thesis.errors.asset'],
  INVALID_COMMUNITY: ['communityId', 'composer.errors.invalidCommunity'],
  PERSONAL_CHANNEL_OWNER_ONLY: ['communityId', 'composer.errors.ownProfileOnly'],
  DISCLAIMER_NOT_ACCEPTED: ['disclaimerAccepted', 'composer.thesis.errors.disclaimer'],
}

/** The rest with a message of their own; anything else says what the API client says. */
const ERRORS: Record<string, string> = {
  VALIDATION_ERROR: 'composer.errors.invalid',
  INVALID: 'composer.errors.invalid',
}

const fieldError = (field: string, key: string) => ({
  ok: false as const,
  error: key,
  fieldErrors: { [field]: [key] },
})

/**
 * Publishes a thesis (specs/thesis-create TC-13 to TC-15). A public endpoint: validates with the
 * editor's schema and the backend's deadline rule, checks the session itself and takes the userId
 * from it, never from the form. Answers the author's username, for their theses tab (TC-14).
 */
export async function createThesis(raw: unknown): Promise<ActionResult<{ username: string }>> {
  const parsed = createThesisSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      ok: false,
      error: 'composer.errors.invalid',
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    }
  }
  // A page left open overnight may send a day that is no longer far enough.
  if (!isDeadlineInRange(parsed.data.deadline, new Date())) {
    return fieldError('deadline', 'composer.thesis.errors.deadline')
  }

  const viewer = await getViewer()
  if (!viewer) return { ok: false, error: 'api.errors.UNAUTHENTICATED' }

  const result = await createThesisAs(viewer.id, parsed.data)
  if (result.ok) return { ok: true, data: { username: viewer.username } }
  const field = FIELD_ERRORS[result.code]
  if (field) return fieldError(...field)
  return { ok: false, error: ERRORS[result.code] ?? result.errorKey }
}
