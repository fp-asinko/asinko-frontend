import 'server-only'
import { cache } from 'react'
import { z } from 'zod'
import { apiRequest, invalidInput, type ApiResult } from '@/lib/api'
import { thesisSchema } from '@/lib/api/contract'
import { getViewer } from '@/lib/session'
import type { ThesisItem } from '../feed.types'
import { toThesisItem } from './mappers'

const ENDPOINT = 'GET /api/v1/theses/:id'

/** Thesis ids are uuids: anything else is not found without asking the backend. */
const thesisIdSchema = z.uuid()

/**
 * The thesis of its page (specs/thesis-detail § 4). The id is checked before the request. Never
 * throws: the page turns NOT_FOUND into notFound() and anything else into error.tsx. Cached per
 * request: the metadata, the page and its right column ask for the same thesis.
 */
export const getThesis = cache(async function getThesis(
  id: string,
): Promise<ApiResult<ThesisItem>> {
  if (!thesisIdSchema.safeParse(id).success) return invalidInput(ENDPOINT)
  const [result, viewer] = await Promise.all([
    apiRequest({ method: 'GET', path: '/api/v1/theses/:id', params: { id }, schema: thesisSchema }),
    getViewer(),
  ])
  return result.ok ? { ok: true, data: toThesisItem(result.data, viewer !== null) } : result
})
