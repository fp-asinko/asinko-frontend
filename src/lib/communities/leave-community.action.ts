'use server'

import type { ActionResult } from '@/lib/result'
import { getViewer } from '@/lib/session'
import { communitySlugSchema } from './community-slug.schema'
import { leaveCommunityAs } from './membership'

/**
 * Leaves a community from its page (specs/community-pages CP-05). The page asks for confirmation
 * first; this is a public endpoint, so it validates the slug and checks the session itself.
 */
export async function leaveCommunity(raw: unknown): Promise<ActionResult<null>> {
  const parsed = communitySlugSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'api.errors.INVALID' }

  const viewer = await getViewer()
  if (!viewer) return { ok: false, error: 'api.errors.UNAUTHENTICATED' }

  const result = await leaveCommunityAs(viewer.id, parsed.data)
  return result.ok ? { ok: true, data: null } : { ok: false, error: result.errorKey }
}
