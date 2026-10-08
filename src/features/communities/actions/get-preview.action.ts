'use server'

import { z } from 'zod'
import { communitySlugSchema } from '@/lib/communities/community-slug.schema'
import type { ActionResult } from '@/lib/result'
import type { Preview } from '../communities.types'
import { getPreviewData } from '../lib/preview-api'

const previewInputSchema = z.object({
  kind: z.enum(['group', 'asset', 'user']),
  slug: communitySlugSchema,
})

/**
 * The data of a hover card (specs/mention-preview MP-12). A public endpoint: the input comes from
 * an attribute of the page, so it is validated here again. Reading needs no session (the pages
 * are public); with one, the membership comes along.
 */
export async function getPreview(raw: unknown): Promise<ActionResult<Preview>> {
  const parsed = previewInputSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'api.errors.INVALID' }
  const result = await getPreviewData(parsed.data)
  return result.ok ? { ok: true, data: result.data } : { ok: false, error: result.errorKey }
}
