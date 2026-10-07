'use server'

import { z } from 'zod'
import type { ActionResult } from '@/lib/result'
import { getViewer } from '@/lib/session'
import { communitySlugSchema } from './community-slug.schema'
import { setFavoriteAs } from './membership'

const inputSchema = z.object({ slug: communitySlugSchema, favorite: z.boolean() })

/** Marks or unmarks a community as a favorite (specs/community-pages CP-06). Members only. */
export async function setFavorite(raw: unknown): Promise<ActionResult<{ favorite: boolean }>> {
  const parsed = inputSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'api.errors.INVALID' }

  const viewer = await getViewer()
  if (!viewer) return { ok: false, error: 'api.errors.UNAUTHENTICATED' }

  const result = await setFavoriteAs(viewer.id, parsed.data.slug, parsed.data.favorite)
  return result.ok ? { ok: true, data: result.data } : { ok: false, error: result.errorKey }
}
