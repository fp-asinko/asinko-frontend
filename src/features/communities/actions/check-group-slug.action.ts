'use server'

import { getViewer } from '@/lib/session'
import { groupSlugAvailability, type SlugAvailability } from '../lib/group-slug'
import { groupSlugSchema } from '../schemas/create-group.schema'

/**
 * Whether a group's handle is free, while the form is typed (specs/community-create CG-06). A
 * public endpoint: only with a session (who can create), and only a valid handle goes to the
 * backend (api-integration.md § Validar antes de la red).
 */
export async function checkGroupSlug(raw: unknown): Promise<SlugAvailability> {
  const parsed = groupSlugSchema.safeParse(raw)
  if (!parsed.success) return 'unknown'
  if (!(await getViewer())) return 'unknown'
  return groupSlugAvailability(parsed.data)
}
