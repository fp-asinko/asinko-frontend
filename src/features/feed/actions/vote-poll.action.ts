'use server'

import { getViewer } from '@/lib/session'
import type { ActionResult } from '@/lib/result'
import type { PollResults } from '../feed.types'
import { votePollAs } from '../lib/votes-api'
import { votePollSchema } from '../schemas/vote.schema'

/** Votes an option of a poll (H-15). Answers the poll's results, now visible to the voter. */
export async function votePoll(raw: unknown): Promise<ActionResult<PollResults>> {
  const parsed = votePollSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'api.errors.INVALID' }

  const viewer = await getViewer()
  if (!viewer) return { ok: false, error: 'api.errors.UNAUTHENTICATED' }

  const result = await votePollAs(viewer.id, parsed.data)
  return result.ok ? { ok: true, data: result.data } : { ok: false, error: result.errorKey }
}
