'use server'

import type { ActionResult } from '@/lib/result'
import { getViewer } from '@/lib/session'
import { communitySlugSchema } from './community-slug.schema'
import { joinCommunityAs } from './membership'

/**
 * Joins a community from a card or the interests column (specs/community-first CF-07). A public
 * endpoint: validates the slug and checks the session itself. It does not revalidate: the client
 * refreshes afterwards, so the answer does not wait for the whole feed to render again.
 */
export async function joinCommunity(raw: unknown): Promise<ActionResult<{ memberCount: number }>> {
  const parsed = communitySlugSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'api.errors.INVALID' }

  const viewer = await getViewer()
  if (!viewer) return { ok: false, error: 'api.errors.UNAUTHENTICATED' }

  const result = await joinCommunityAs(viewer.id, parsed.data)
  return result.ok ? { ok: true, data: result.data } : { ok: false, error: result.errorKey }
}
