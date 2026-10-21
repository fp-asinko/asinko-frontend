import 'server-only'
import { apiRequest, noContentSchema, paginatedSchema, type ApiResult } from '@/lib/api'
import { communitySchema, draftSchema, type RawDraft } from '@/lib/api/contract'
import { mentionOf } from '@/lib/communities/paths'
import { allowedImageUrl } from '@/lib/images'
import type { CommunityOption, SavedDraft } from '../composer.types'
import type { DraftFields } from '../schemas/save-draft.schema'
import { toOption } from './composer-api'
import { relatedCommunityIds } from './related-communities'

// The drafts of the account (P-022, backend 2026-10-20, specs/drafts-tags). The userId always comes
// from the server session (api-integration.md).

/**
 * Each draft's community as the picker's option, with its tags (P-023): the draft brings the
 * summary of a card, without them. One request per community, in parallel; one that fails keeps
 * the summary, without tags.
 */
async function optionsOf(drafts: RawDraft[], viewerName: string) {
  const slugs = [...new Set(drafts.flatMap((draft) => draft.community?.slug ?? []))]
  const found = await Promise.all(
    slugs.map((slug) =>
      apiRequest({
        method: 'GET',
        path: '/api/v1/communities/:slug',
        params: { slug },
        schema: communitySchema,
      }),
    ),
  )
  const options = new Map<string, CommunityOption>()
  for (const result of found) {
    if (!result.ok) continue
    const own = result.data.type === 'PERSONAL_CHANNEL' && result.data.slug === viewerName
    options.set(result.data.slug, toOption(result.data, own))
  }
  return (community: NonNullable<RawDraft['community']>) =>
    options.get(community.slug) ??
    toOption(community, community.type === 'PERSONAL_CHANNEL' && community.slug === viewerName)
}

/** The viewer's drafts, newest first (DT-02): only what the list and the editor need. */
export async function listDraftsOf(
  userId: string,
  viewerName: string,
): Promise<ApiResult<SavedDraft[]>> {
  const result = await apiRequest({
    method: 'GET',
    path: '/api/v1/users/:userId/drafts',
    params: { userId },
    schema: paginatedSchema(draftSchema),
  })
  if (!result.ok) return result
  const optionOf = await optionsOf(result.data.items, viewerName)
  return {
    ok: true,
    data: result.data.items.map((draft) => ({
      id: draft.id,
      type: draft.type,
      title: draft.title,
      body: draft.body,
      url: draft.url,
      // Only from the backend's Storage (security.md § 6): the editor shows it with next/image.
      imageUrl: allowedImageUrl(draft.imageUrl),
      imageAlt: draft.imageAlt,
      tag: draft.tag ?? '',
      community: draft.community && optionOf(draft.community),
      related: (draft.related ?? []).map((each) => mentionOf(each).handle),
      updatedAt: draft.updatedAt,
    })),
  }
}

/**
 * Saves a new draft, or updates the one given (DT-01, DT-03), with its related ones as ids (BA-05).
 * Answers its id.
 */
export async function saveDraftAs(
  userId: string,
  draftId: string | undefined,
  { related, ...fields }: DraftFields,
): Promise<ApiResult<{ id: string }>> {
  const ids = await relatedCommunityIds(related)
  if (!ids.ok) return ids
  const body = { userId, ...fields, relatedCommunityIds: ids.data }
  const result = draftId
    ? await apiRequest({
        method: 'PATCH',
        path: '/api/v1/drafts/:draftId',
        params: { draftId },
        body,
        schema: draftSchema,
      })
    : await apiRequest({ method: 'POST', path: '/api/v1/drafts', body, schema: draftSchema })
  return result.ok ? { ok: true, data: { id: result.data.id } } : result
}

/** Deletes a draft (DT-04), and the one just published (DT-03). */
export async function deleteDraftAs(userId: string, draftId: string): Promise<ApiResult<null>> {
  const result = await apiRequest({
    method: 'DELETE',
    path: '/api/v1/drafts/:draftId',
    params: { draftId },
    query: { userId },
    schema: noContentSchema,
  })
  return result.ok ? { ok: true, data: null } : result
}
