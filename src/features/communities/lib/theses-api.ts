import 'server-only'
import { z } from 'zod'
import { apiRequest, invalidInput, keepValidItems, type ApiResult } from '@/lib/api'
import { thesisSchema, type RawThesis } from '@/lib/api/contract'
import { toThesisTicket } from '@/lib/theses/ticket'
import type { ThesesPage, ThesisItem } from '../communities.types'

const ENDPOINT = 'GET /api/v1/users/:userId/theses'

/** Items are validated one by one (keepValidItems): a broken thesis does not take the list down. */
const looseListSchema = z.object({ items: z.array(z.unknown()), nextCursor: z.string().nullable() })

/** Opaque cursor from a previous page: checked before the request, as the feed's. */
const cursorSchema = z.string().regex(/^[A-Za-z0-9_\-=.:]{1,512}$/)

export function toThesisItem(thesis: RawThesis): ThesisItem {
  return { ...toThesisTicket(thesis), claim: thesis.claim, publishedAt: thesis.publishedAt }
}

/**
 * A person's theses, the newest first, a page at a time (specs/profile-track-record PT-05). The
 * id and the cursor are checked before the network. Never throws.
 */
export async function getUserTheses(
  userId: string,
  cursor?: string,
): Promise<ApiResult<ThesesPage>> {
  if (!z.uuid().safeParse(userId).success) return invalidInput(ENDPOINT)
  if (cursor !== undefined && !cursorSchema.safeParse(cursor).success) {
    return invalidInput(ENDPOINT)
  }
  const result = await apiRequest({
    method: 'GET',
    path: '/api/v1/users/:userId/theses',
    params: { userId },
    query: cursor ? { cursor } : undefined,
    schema: looseListSchema,
  })
  if (!result.ok) return result
  return {
    ok: true,
    data: {
      items: keepValidItems(result.data.items, thesisSchema, ENDPOINT).map(toThesisItem),
      nextCursor: result.data.nextCursor,
    },
  }
}
