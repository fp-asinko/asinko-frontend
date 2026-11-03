import 'server-only'
import { apiRequest, type ApiResult } from '@/lib/api'
import { thesisUpdateListSchema, thesisUpdateSchema } from '@/lib/api/contract'
import type { ThesisUpdate } from '../feed.types'
import type { ThesisUpdateInput } from '../schemas/thesis-update.schema'

/**
 * A thesis's updates by its author, the newest first (specs/thesis-arguments TA-09, Q4). The
 * backend answers them as written; the order is the page's. Never throws.
 */
export async function getThesisUpdates(thesisId: string): Promise<ApiResult<ThesisUpdate[]>> {
  const result = await apiRequest({
    method: 'GET',
    path: '/api/v1/theses/:id/updates',
    params: { id: thesisId },
    schema: thesisUpdateListSchema,
  })
  if (!result.ok) return result
  const updates = result.data.items
    .map(({ id, body, createdAt }) => ({ id, body, createdAt }))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
  return { ok: true, data: updates }
}

/**
 * Publishes an update (E11 POST /theses/{id}/updates, TA-10). The userId always comes from the
 * server session. 409 THESIS_NOT_OPEN when it is no longer open.
 */
export async function createThesisUpdateAs(
  userId: string,
  { thesisId, body }: ThesisUpdateInput,
): Promise<ApiResult<{ id: string }>> {
  const result = await apiRequest({
    method: 'POST',
    path: '/api/v1/theses/:id/updates',
    params: { id: thesisId },
    body: { userId, body },
    schema: thesisUpdateSchema,
  })
  return result.ok ? { ok: true, data: { id: result.data.id } } : result
}
