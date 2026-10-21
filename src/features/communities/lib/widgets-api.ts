import 'server-only'
import { cache } from 'react'
import { apiRequest, keepValidItems, type ApiResult } from '@/lib/api'
import { communitySlugSchema } from '@/lib/communities/community-slug.schema'
import { widgetListSchema, widgetSchema, type RawWidget } from '@/lib/api/contract'
import { kindOf, mentionOf } from '@/lib/communities/paths'
import { allowedImageUrl } from '@/lib/images'
import { getViewer } from '@/lib/session'
import { toWidgetLink } from '@/lib/widget-link'
import type { CommunityWidget, WidgetCommunity } from '../communities.types'

// A group's widgets (P-028, proposal, specs/community-widgets). The userId of a write always comes
// from the server session (api-integration.md).

const GET = 'GET /api/v1/communities/:slug/widgets'
const PUT = 'PUT /api/v1/communities/:slug/widgets'

type RawCommunity = Extract<RawWidget, { type: 'COMMUNITIES' }>['communities'][number]

function toCommunity(community: RawCommunity, signedIn: boolean): WidgetCommunity {
  const kind = kindOf(community.type)
  const { handle, path } = mentionOf(community)
  return {
    id: community.id,
    slug: community.slug,
    handle,
    name: community.name,
    path,
    kind,
    avatarUrl: allowedImageUrl(community.avatarUrl),
    memberCount: community.memberCount,
    viewerIsMember: signedIn ? community.viewerMembership !== null : null,
  }
}

/**
 * A widget as the UI shows it: every link checked (CW-07) and every image allowed (security.md
 * § 6). A button or an image that is not allowed is dropped; an event's bad link just goes.
 */
export function toWidget(raw: RawWidget, signedIn: boolean): CommunityWidget {
  const { id, title } = raw
  switch (raw.type) {
    case 'TEXT':
      return { id, title, type: 'TEXT', body: raw.body }
    case 'RULES':
      return { id, title, type: 'RULES', rules: raw.rules }
    case 'BUTTONS':
      return {
        id,
        title,
        type: 'BUTTONS',
        buttons: raw.buttons.flatMap(({ label, url }) => {
          const link = toWidgetLink(url)
          return link ? [{ label, link }] : []
        }),
      }
    case 'COMMUNITIES':
      return {
        id,
        title,
        type: 'COMMUNITIES',
        communities: raw.communities.map((each) => toCommunity(each, signedIn)),
      }
    case 'IMAGES':
      return {
        id,
        title,
        type: 'IMAGES',
        images: raw.images.flatMap(({ imageUrl, alt, linkUrl }) => {
          const src = allowedImageUrl(imageUrl)
          return src ? [{ src, alt, link: toWidgetLink(linkUrl) }] : []
        }),
      }
    case 'CALENDAR':
      return {
        id,
        title,
        type: 'CALENDAR',
        events: raw.events.map(({ url, ...event }) => ({ ...event, link: toWidgetLink(url) })),
      }
  }
}

/**
 * A group's widgets, in their order (CW-06). A secondary part of the page: null if they cannot be
 * asked, so the column says so and a moderator is not offered an empty list to save over them.
 * Cached per request: the right column, the phone's "About" and the header's editor ask the same.
 */
export const getWidgets = cache(async function getWidgets(
  slug: string,
): Promise<CommunityWidget[] | null> {
  // Checked before the network (api-integration.md): one that cannot be a slug is not asked.
  if (!communitySlugSchema.safeParse(slug).success) return null
  const [result, viewer] = await Promise.all([
    apiRequest({
      method: 'GET',
      path: '/api/v1/communities/:slug/widgets',
      params: { slug },
      schema: widgetListSchema,
    }),
    getViewer(),
  ])
  if (!result.ok) return null
  return keepValidItems(result.data.items, widgetSchema, GET).map((raw) =>
    toWidget(raw, viewer !== null),
  )
})

/** One widget as P-028's PUT takes it. */
export type WidgetInput = { id?: string; type: string } & Record<string, unknown>

/** Saves a group's widgets, the whole list (CW-12). Answers the saved list, mapped. */
export async function saveWidgetsAs(
  userId: string,
  slug: string,
  items: WidgetInput[],
): Promise<ApiResult<CommunityWidget[]>> {
  const result = await apiRequest({
    method: 'PUT',
    path: '/api/v1/communities/:slug/widgets',
    params: { slug },
    body: { userId, items },
    schema: widgetListSchema,
  })
  if (!result.ok) return result
  return {
    ok: true,
    data: keepValidItems(result.data.items, widgetSchema, PUT).map((raw) => toWidget(raw, true)),
  }
}
