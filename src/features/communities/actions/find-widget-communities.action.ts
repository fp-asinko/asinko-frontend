'use server'

import { z } from 'zod'
import type { ActionResult } from '@/lib/result'
import { getViewer } from '@/lib/session'
import { searchWidgetCommunities } from '../lib/community-search'
import type { DraftCommunity } from '../lib/widget-drafts'

const searchSchema = z.string().trim().min(1).max(50)

/**
 * Finds groups and assets to recommend in a "Communities" widget (specs/community-widgets CW-10).
 * A public endpoint: checks the search and that there is a session (only a moderator edits).
 */
export async function findWidgetCommunities(raw: unknown): Promise<ActionResult<DraftCommunity[]>> {
  const search = searchSchema.safeParse(raw)
  if (!search.success) return { ok: true, data: [] }
  if (!(await getViewer())) return { ok: false, error: 'api.errors.UNAUTHENTICATED' }
  const result = await searchWidgetCommunities(search.data)
  return result.ok ? result : { ok: false, error: result.errorKey }
}
