import 'server-only'
import { z } from 'zod'
import { apiRequest } from '@/lib/api'
import { thesisSchema } from '@/lib/api/contract'
import type { CounterThesis } from '../composer.types'

/**
 * The thesis a new one answers, from `?counter=` (specs/thesis-agree AG-11): user input, so an id
 * is checked before the request. Never throws: anything odd, a thesis that is not open or has no
 * target is null, and the form opens as always (with the asset of `?community=`).
 */
export async function getCounterThesis(raw: string | undefined): Promise<CounterThesis | null> {
  const id = z.uuid().safeParse(raw)
  if (!id.success) return null
  const result = await apiRequest({
    method: 'GET',
    path: '/api/v1/theses/:id',
    params: { id: id.data },
    schema: thesisSchema,
  })
  if (!result.ok) return null
  const thesis = result.data
  if (
    thesis.state !== 'OPEN' ||
    !thesis.asset ||
    thesis.targetPrice === null ||
    !thesis.targetDirection
  ) {
    return null
  }
  return {
    id: thesis.id,
    author: thesis.creatorType === 'SYSTEM' ? null : (thesis.creator?.username ?? null),
    symbol: thesis.asset.symbol,
    direction:
      thesis.targetDirection === 'ABOVE'
        ? 'above'
        : thesis.targetDirection === 'BELOW'
          ? 'below'
          : 'equals',
    targetPrice: thesis.targetPrice,
    deadline: thesis.deadline,
  }
}
