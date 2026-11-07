'use server'

import { z } from 'zod'
import { getViewer } from '@/lib/session'
import { searchSimilarGroups, type SimilarGroup } from '../lib/similar-groups'
import { NAME_MAX, NAME_MIN } from '../schemas/create-group.schema'

const nameSchema = z.string().trim().min(NAME_MIN).max(NAME_MAX)

/**
 * The groups that look like the name being typed (specs/community-create CG-22). A public
 * endpoint: only with a session (who can create) and a name of the form's length. Only a hint: a
 * failure shows nothing.
 */
export async function findSimilarGroups(raw: unknown): Promise<SimilarGroup[]> {
  const name = nameSchema.safeParse(raw)
  if (!name.success || !(await getViewer())) return []
  const result = await searchSimilarGroups(name.data)
  return result.ok ? result.data : []
}
