import 'server-only'
import { z } from 'zod'
import {
  apiRequest,
  invalidInput,
  keepValidItems,
  noContentSchema,
  type ApiResult,
} from '@/lib/api'
import {
  featuredListSchema,
  featuredSchema,
  type RawCommunitySummary,
  type RawFeatured,
} from '@/lib/api/contract'
import { communityPath, kindOf } from '@/lib/communities/paths'
import { postPath } from '@/lib/posts/paths'
import type { FeaturedItem, ThesisItem } from '../communities.types'

// What a person put at the front of their profile (P-025, backend 2026-10-20, specs/profile-showcase,
// specs/backend-answer-1020 BA-04). The userId of a write always comes from the server session.

const ENDPOINT = 'GET /api/v1/users/:userId/featured'

/** Up to three, as the proposal (PS-05). */
export const FEATURED_MAX = 3

/** What is featured: a post, a poll or a thesis, by its id. The backend takes the kind in capitals. */
export const featuredRefSchema = z.object({
  kind: z.enum(['post', 'poll', 'thesis']),
  id: z.uuid(),
})
export type FeaturedRef = z.infer<typeof featuredRefSchema>

/** Its community as a mention: $ for an asset, @ for a personal channel, # for a group. */
function communityOf(summary: RawCommunitySummary) {
  const kind = kindOf(summary.type)
  const handle =
    kind === 'asset'
      ? `$${summary.slug.toUpperCase()}`
      : kind === 'user'
        ? `@${summary.slug}`
        : `#${summary.slug}`
  return { handle, path: communityPath(kind, summary.slug) }
}

export function toFeaturedItem(featured: RawFeatured): FeaturedItem {
  if (featured.kind === 'POST') {
    const post = featured.content
    return {
      kind: 'post',
      id: post.id,
      title: post.title,
      path: postPath(post.id, post.title),
      community: communityOf(post.community),
      score: post.score,
      commentCount: post.commentCount,
    }
  }
  if (featured.kind === 'POLL') {
    const poll = featured.content
    return {
      kind: 'poll',
      id: poll.id,
      title: poll.question,
      community: communityOf(poll.community),
      commentCount: poll.commentCount,
    }
  }
  const thesis = featured.content
  return {
    kind: 'thesis',
    id: thesis.id,
    claim: thesis.claim,
    state: thesis.state.toLowerCase() as ThesisItem['state'],
    community: communityOf(thesis.community),
  }
}

/**
 * A person's featured posts and theses, the last featured first (PS-05). One malformed item is
 * dropped, not the list (keepValidItems). Never throws: the profile shows it as a secondary part.
 */
export async function getFeatured(userId: string): Promise<ApiResult<FeaturedItem[]>> {
  if (!z.uuid().safeParse(userId).success) return invalidInput(ENDPOINT)
  const result = await apiRequest({
    method: 'GET',
    path: '/api/v1/users/:userId/featured',
    params: { userId },
    schema: featuredListSchema,
  })
  if (!result.ok) return result
  const items = keepValidItems(result.data.items, featuredSchema, ENDPOINT)
  return { ok: true, data: items.slice(0, FEATURED_MAX).map(toFeaturedItem) }
}

/** Features one of the viewer's posts or theses (PS-07). */
export async function featureAs(userId: string, ref: FeaturedRef): Promise<ApiResult<null>> {
  const result = await apiRequest({
    method: 'POST',
    path: '/api/v1/users/:userId/featured',
    params: { userId },
    body: { userId, kind: ref.kind.toUpperCase(), id: ref.id },
    schema: featuredListSchema,
  })
  return result.ok ? { ok: true, data: null } : result
}

/** Takes one out of the viewer's featured (PS-07). */
export async function unfeatureAs(userId: string, ref: FeaturedRef): Promise<ApiResult<null>> {
  const result = await apiRequest({
    method: 'DELETE',
    path: '/api/v1/users/:userId/featured/:kind/:id',
    params: { userId, kind: ref.kind.toUpperCase(), id: ref.id },
    query: { userId },
    schema: noContentSchema,
  })
  return result.ok ? { ok: true, data: null } : result
}

/** For the profile page: what is featured, or nothing if it cannot be asked (a secondary part). */
export async function getProfileFeatured(userId: string): Promise<FeaturedItem[]> {
  const result = await getFeatured(userId)
  return result.ok ? result.data : []
}
