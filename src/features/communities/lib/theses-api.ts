import 'server-only'
import { z } from 'zod'
import { apiRequest, invalidInput, keepValidItems, type ApiResult } from '@/lib/api'
import { thesisSchema, type RawThesis } from '@/lib/api/contract'
import { communityPath } from '@/lib/communities/paths'
import type { ThesesPage, ThesisItem } from '../communities.types'

const ENDPOINT = 'GET /api/v1/users/:userId/theses'

/** Items are validated one by one (keepValidItems): a broken thesis does not take the list down. */
const looseListSchema = z.object({ items: z.array(z.unknown()), nextCursor: z.string().nullable() })

/** Opaque cursor from a previous page: checked before the request, as the feed's. */
const cursorSchema = z.string().regex(/^[A-Za-z0-9_\-=.:]{1,512}$/)

const CONVICTION = { LOW: 1, MEDIUM: 2, HIGH: 3, EXTREME: 4 } as const

export function toThesisItem(thesis: RawThesis): ThesisItem {
  return {
    id: thesis.id,
    asset: thesis.asset
      ? { symbol: thesis.asset.symbol, path: communityPath('asset', thesis.asset.symbol) }
      : null,
    claim: thesis.claim,
    state: thesis.state.toLowerCase() as ThesisItem['state'],
    target:
      thesis.targetDirection && thesis.targetPrice !== null
        ? {
            direction: thesis.targetDirection.toLowerCase() as 'above' | 'below' | 'equals',
            price: thesis.targetPrice,
          }
        : null,
    deadline: thesis.deadline,
    conviction: CONVICTION[thesis.conviction],
    resolutionPrice: thesis.resolutionPrice,
    cancellationReason: thesis.cancellationReason?.trim() || null,
    publishedAt: thesis.publishedAt,
  }
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
