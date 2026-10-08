'use server'

import { z } from 'zod'
import type { ActionResult } from '@/lib/result'
import type { MentionOption } from './mentions.types'
import { searchMentionOptions } from './mentions-api'

const inputSchema = z.object({
  kind: z.enum(['asset', 'community', 'user']),
  q: z.string().trim().min(1).max(32),
})

/**
 * Suggestions for a mention ($, # or @) while writing a post or a comment
 * (specs/mention-autocomplete MA-02, MA-10). The browser never calls the API: it asks through this
 * action. A public read: no session needed.
 */
export async function searchMentions(raw: unknown): Promise<ActionResult<MentionOption[]>> {
  const parsed = inputSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'api.errors.INVALID' }
  const result = await searchMentionOptions(parsed.data.kind, parsed.data.q)
  return result.ok ? result : { ok: false, error: result.errorKey }
}
