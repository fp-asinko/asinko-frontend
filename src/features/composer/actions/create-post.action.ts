'use server'

import { z } from 'zod'
import { getViewer } from '@/lib/session'
import type { ActionResult } from '@/lib/result'
import { createPostAs } from '../lib/composer-api'
import { createPostSchema } from '../schemas/create-post.schema'

/** Backend codes with a message of their own; the rest say what the API client says. */
const ERRORS: Record<string, string> = {
  PERSONAL_CHANNEL_OWNER_ONLY: 'composer.errors.ownProfileOnly',
  INVALID_COMMUNITY: 'composer.errors.invalidCommunity',
  INVALID_TAG: 'composer.errors.invalidTag',
  INVALID_RELATED_COMMUNITY: 'composer.errors.invalidRelated',
  VALIDATION_ERROR: 'composer.errors.invalid',
  INVALID: 'composer.errors.invalid',
}

/**
 * Publishes a post (specs/post-create-detail PC-10, PC-11). A public endpoint: validates with the
 * editor's schema, checks the session itself and takes the userId from it, never from the form.
 * Answers the new post's id and title, for its page. Published from a draft of the account, the
 * backend deletes it in the same operation (draftId, specs/backend-answer-1020 BA-05); a draft that
 * no longer exists (deleted from another device) does not stop the post: it goes without it.
 */
export async function createPost(
  raw: unknown,
  rawDraftId?: unknown,
): Promise<ActionResult<{ id: string; title: string }>> {
  const parsed = createPostSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      ok: false,
      error: 'composer.errors.invalid',
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    }
  }

  const viewer = await getViewer()
  if (!viewer) return { ok: false, error: 'api.errors.UNAUTHENTICATED' }

  const draftId = z.uuid().safeParse(rawDraftId)
  let result = await createPostAs(viewer.id, parsed.data, draftId.data)
  if (!result.ok && result.code === 'NOT_FOUND' && draftId.success) {
    result = await createPostAs(viewer.id, parsed.data)
  }
  if (result.ok) return result
  return { ok: false, error: ERRORS[result.code] ?? result.errorKey }
}
