import 'server-only'
import type { z } from 'zod'
import { apiRequest, noContentSchema, type ApiResult } from '@/lib/api'
import type { impressionsInputSchema } from '../schemas/impressions.schema'

export type ImpressionsInput = z.infer<typeof impressionsInputSchema>

/**
 * Tells the backend what of a feed page was seen or opened (E4-04, specs/explore-v1). The userId
 * is the session's, or null without one; never the browser's (EX-08). A failure is the caller's to
 * ignore: an unexpected one is already reported by the client, with the endpoint only (EX-10).
 */
export function reportImpressionsAs(
  userId: string | null,
  { requestId, events }: ImpressionsInput,
): Promise<ApiResult<undefined>> {
  return apiRequest({
    method: 'POST',
    path: '/api/v1/feed/impressions',
    body: { userId, requestId, events },
    schema: noContentSchema,
  })
}
