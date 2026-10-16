import 'server-only'
import { apiRequest, paginatedSchema, type ApiResult } from '@/lib/api'
import { communitySchema, postSchema, type RawCommunity } from '@/lib/api/contract'
import type { CommunityKind, CommunityOption } from '../composer.types'
import type { CreatePostInput } from '../schemas/create-post.schema'

/** Publishes a post (E03). The userId always comes from the server session (api-integration.md). */
export async function createPostAs(
  userId: string,
  input: CreatePostInput,
): Promise<ApiResult<{ id: string; title: string }>> {
  const result = await apiRequest({
    method: 'POST',
    path: '/api/v1/posts',
    body: { userId, ...input },
    schema: postSchema,
  })
  return result.ok ? { ok: true, data: { id: result.data.id, title: result.data.title } } : result
}

function handleOf(community: Pick<RawCommunity, 'type' | 'slug'>) {
  if (community.type === 'SYSTEM_ASSET') return `$${community.slug.toUpperCase()}`
  if (community.type === 'PERSONAL_CHANNEL') return `@${community.slug}`
  return `#${community.slug}`
}

export function toOption(community: RawCommunity, own: boolean): CommunityOption {
  return {
    id: community.id,
    slug: community.slug,
    handle: handleOf(community),
    name: community.name,
    own,
  }
}

/**
 * The communities the viewer can post to (PC-06): theirs (?mine=true) or the ones that match a
 * search, with their own channel first as "Your profile". With a kind (specs/picker-filters PF-02),
 * only assets (the backend filters by type) or only groups: the contract filters by one type and
 * groups are three, so assets are dropped here. Neither shows "Your profile" (PF-04). Other people's channels never show:
 * only their owner posts there (403 PERSONAL_CHANNEL_OWNER_ONLY). The own channel is asked by
 * its slug, the username, so it is there whatever the list brings.
 */
export async function listCommunityOptions(
  username: string,
  search: string,
  kind: CommunityKind = 'all',
): Promise<ApiResult<CommunityOption[]>> {
  const [list, channel] = await Promise.all([
    apiRequest({
      method: 'GET',
      path: '/api/v1/communities',
      query: {
        ...(search ? { search } : { mine: 'true' }),
        ...(kind === 'assets' && { type: 'SYSTEM_ASSET' }),
      },
      schema: paginatedSchema(communitySchema),
    }),
    kind === 'all'
      ? apiRequest({
          method: 'GET',
          path: '/api/v1/communities/:slug',
          params: { slug: username },
          schema: communitySchema,
        })
      : null,
  ])
  if (!list.ok) return list

  const own =
    channel?.ok &&
    channel.data.type === 'PERSONAL_CHANNEL' &&
    (!search ||
      `${channel.data.slug} ${channel.data.name}`.toLowerCase().includes(search.toLowerCase()))
      ? [toOption(channel.data, true)]
      : []
  const others = list.data.items
    .filter((each) => each.type !== 'PERSONAL_CHANNEL')
    .filter((each) => kind !== 'groups' || each.type !== 'SYSTEM_ASSET')
    .map((each) => toOption(each, false))
  return { ok: true, data: [...own, ...others] }
}
