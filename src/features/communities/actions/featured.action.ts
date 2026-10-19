'use server'

import { z } from 'zod'
import type { ActionResult } from '@/lib/result'
import { getViewer } from '@/lib/session'
import { featureAs, featuredRefSchema, unfeatureAs } from '../lib/featured-api'

const inputSchema = featuredRefSchema.extend({ featured: z.boolean() })

/** Backend codes with a message of their own; the rest say what the API client says. */
const ERRORS: Record<string, string> = {
  FEATURED_LIMIT: 'featured.errors.limit',
  NOT_OWNER: 'featured.errors.notOwner',
  NOT_FOUND: 'featured.errors.gone',
}

/**
 * Features one of your posts or theses on your profile, or takes it out (specs/profile-showcase
 * PS-07, P-025). A public endpoint: checks its input and the session itself, and takes the userId
 * from it; whose content it is, the backend decides. The page shows the change once refreshed.
 */
export async function setFeatured(raw: unknown): Promise<ActionResult<null>> {
  const parsed = inputSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'featured.errors.general' }
  const viewer = await getViewer()
  if (!viewer) return { ok: false, error: 'api.errors.UNAUTHENTICATED' }

  const { featured, ...ref } = parsed.data
  const result = featured ? await featureAs(viewer.id, ref) : await unfeatureAs(viewer.id, ref)
  if (result.ok) return result
  return { ok: false, error: ERRORS[result.code] ?? result.errorKey }
}
