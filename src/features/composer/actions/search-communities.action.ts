'use server'

import { z } from 'zod'
import { getViewer } from '@/lib/session'
import type { ActionResult } from '@/lib/result'
import type { CommunityKind, CommunityOption } from '../composer.types'
import { listCommunityOptions } from '../lib/composer-api'

const searchSchema = z.string().trim().max(64)
const kindSchema = z.enum(['all', 'groups', 'assets']) satisfies z.ZodType<CommunityKind>

/**
 * The editor's community picker (PC-06): the viewer's communities, or the ones matching a search;
 * all of them, only groups or only assets (specs/picker-filters PF-02).
 * The browser never calls the API (api-integration.md): it asks through this action.
 */
export async function searchCommunities(
  raw: unknown,
  rawKind: unknown = 'all',
): Promise<ActionResult<CommunityOption[]>> {
  const parsed = searchSchema.safeParse(raw)
  const kind = kindSchema.safeParse(rawKind)
  if (!parsed.success || !kind.success) return { ok: false, error: 'api.errors.INVALID' }

  const viewer = await getViewer()
  if (!viewer) return { ok: false, error: 'api.errors.UNAUTHENTICATED' }

  const result = await listCommunityOptions(viewer.username, parsed.data, kind.data)
  return result.ok ? result : { ok: false, error: result.errorKey }
}
