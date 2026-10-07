'use server'

import { z } from 'zod'
import { getViewer } from '@/lib/session'
import type { ActionResult } from '@/lib/result'
import type { CommunityOption } from '../composer.types'
import { listCommunityOptions } from '../lib/composer-api'

const searchSchema = z.string().trim().max(64)

/**
 * The editor's community picker (PC-06): the viewer's communities, or the ones matching a search.
 * The browser never calls the API (api-integration.md): it asks through this action.
 */
export async function searchCommunities(raw: unknown): Promise<ActionResult<CommunityOption[]>> {
  const parsed = searchSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'api.errors.INVALID' }

  const viewer = await getViewer()
  if (!viewer) return { ok: false, error: 'api.errors.UNAUTHENTICATED' }

  const result = await listCommunityOptions(viewer.username, parsed.data)
  return result.ok ? result : { ok: false, error: result.errorKey }
}
