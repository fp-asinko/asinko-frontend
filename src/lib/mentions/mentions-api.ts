import 'server-only'
import { z } from 'zod'
import { apiRequest, paginatedSchema, type ApiResult } from '@/lib/api'
import { communitySchema, searchResultSchema } from '@/lib/api/contract'
import { allowedImageUrl } from '@/lib/images'
import type { MentionKind } from './active-mention'
import type { MentionOption } from './mentions.types'

/** How many suggestions the list shows (MA-03). */
export const SUGGESTIONS = 6

/**
 * The catalog (E14) as far as mentions need it: only the symbol and the name, so a change in the
 * rest of the asset (prices, sentiment) never breaks the suggestions.
 */
const catalogSchema = z.object({
  items: z.array(z.object({ symbol: z.string(), name: z.string() })),
})

/** The name, only when it says more than the handle (#DeFi under #defi says nothing). */
function labelOf(name: string, handle: string) {
  const bare = (value: string) => value.replace(/^[#$@]/, '').toLowerCase()
  return bare(name) === bare(handle) ? null : name
}

async function assets(q: string): Promise<ApiResult<MentionOption[]>> {
  const result = await apiRequest({
    method: 'GET',
    path: '/api/v1/assets',
    query: { q },
    schema: catalogSchema,
  })
  if (!result.ok) return result
  return {
    ok: true,
    data: result.data.items.map(({ symbol, name }) => {
      const handle = `$${symbol.toUpperCase()}`
      return {
        kind: 'asset',
        handle,
        label: labelOf(name, handle),
        avatarUrl: null,
        colorKey: symbol,
      }
    }),
  }
}

async function communities(q: string): Promise<ApiResult<MentionOption[]>> {
  const result = await apiRequest({
    method: 'GET',
    path: '/api/v1/communities',
    query: { search: q },
    schema: paginatedSchema(communitySchema),
  })
  if (!result.ok) return result
  return {
    ok: true,
    data: result.data.items
      // # mentions groups: assets go with $ and personal channels with @.
      .filter((each) => each.type !== 'SYSTEM_ASSET' && each.type !== 'PERSONAL_CHANNEL')
      .map((each) => {
        const handle = `#${each.slug}`
        return {
          kind: 'community',
          handle,
          label: labelOf(each.name, handle),
          avatarUrl: allowedImageUrl(each.avatarUrl),
          colorKey: each.slug,
        }
      }),
  }
}

async function users(q: string): Promise<ApiResult<MentionOption[]>> {
  const result = await apiRequest({
    method: 'GET',
    path: '/api/v1/search',
    query: { q, type: 'user' },
    schema: searchResultSchema,
  })
  if (!result.ok) return result
  return {
    ok: true,
    data: result.data.users.map((each) => ({
      kind: 'user',
      handle: `@${each.username}`,
      label: null,
      avatarUrl: allowedImageUrl(each.avatarUrl),
      colorKey: each.username,
    })),
  }
}

const SEARCH: Record<MentionKind, (q: string) => Promise<ApiResult<MentionOption[]>>> = {
  asset: assets,
  community: communities,
  user: users,
}

/**
 * Suggestions for a mention being written (specs/mention-autocomplete § 3): assets for $, groups
 * for # and people for @, at most six. Never throws: a failure comes back as a result.
 */
export async function searchMentionOptions(
  kind: MentionKind,
  q: string,
): Promise<ApiResult<MentionOption[]>> {
  const result = await SEARCH[kind](q)
  return result.ok ? { ok: true, data: result.data.slice(0, SUGGESTIONS) } : result
}
