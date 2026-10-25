'use server'

import type { ReactNode } from 'react'
import { setRequestLocale } from 'next-intl/server'
import { z } from 'zod'
import { routing } from '@/i18n/routing'
import { assetSymbolSchema } from '@/lib/communities/asset-symbol.schema'
import { communitySlugSchema } from '@/lib/communities/community-slug.schema'
import { communityPath, type CommunityKind } from '@/lib/communities/paths'
import { allowedImageUrl } from '@/lib/images'
import { isHttpUrl } from '@/lib/profile-links'
import type { ActionResult } from '@/lib/result'
import { getViewer } from '@/lib/session'
import { PostCard } from '../components/post-card'
import type { PostItem } from '../feed.types'
import { markDraftMentions } from '../lib/mentions'

/**
 * The post being written, as the editor has it (specs/submit-tools ST-01): a post needs its title
 * and may have no body; a thought, only its text (specs/thoughts TH-01, TH-03).
 */
const previewSchema = z
  .object({
    title: z.string().trim().max(300),
    body: z.string().trim().max(40_000),
    type: z.enum(['TEXT', 'LINK', 'IMAGE', 'THOUGHT']),
    url: z.string().trim().max(2048).optional(),
    imageUrl: z.string().max(2048).optional(),
    tag: z.string().trim().max(24).optional(),
    imageAlt: z.string().trim().max(300).optional(),
    community: z
      .object({
        // A group's slug or an asset's symbol (BRK.B, XAU/USD): only for its path, encoded.
        slug: z.union([communitySlugSchema, assetSymbolSchema]),
        handle: z
          .string()
          .regex(/^[$#@]/)
          .max(65),
        name: z.string().max(100),
        own: z.boolean(),
      })
      .nullable(),
    locale: z.enum(routing.locales),
  })
  .refine((post) => (post.type === 'THOUGHT' ? post.body !== '' : post.title !== ''))

const KIND: Record<string, CommunityKind> = { $: 'asset', '#': 'group', '@': 'user' }

/** The domain a link card shows: the real one (security.md § 1). */
function domainOf(url: string) {
  return new URL(url).hostname.replace(/^www\./, '')
}

/**
 * The preview of a post being written (specs/submit-tools ST-01 to ST-03): the feed's card, with
 * the viewer as its author and nothing to press, already rendered on the server, as the feed's
 * "Load more": react-markdown never reaches the browser (ST-11). Mentions in bold without links
 * (D-1): the backend resolves them on publishing. A public endpoint: checks its input and the
 * session; it saves nothing.
 */
export async function previewPost(raw: unknown): Promise<ActionResult<{ card: ReactNode }>> {
  const parsed = previewSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'api.errors.INVALID' }
  const viewer = await getViewer()
  if (!viewer) return { ok: false, error: 'api.errors.UNAUTHENTICATED' }

  const { title, body, type, url, imageUrl, imageAlt, tag, community, locale } = parsed.data
  setRequestLocale(locale)
  const kind = community ? (KIND[community.handle[0]!] ?? 'group') : null
  const image = type === 'IMAGE' && imageUrl ? allowedImageUrl(imageUrl) : null
  const link = type === 'LINK' && url && isHttpUrl(url) ? url : null

  const post: PostItem = {
    kind: 'post',
    id: 'preview',
    thought: type === 'THOUGHT',
    title: type === 'THOUGHT' ? '' : title,
    path: '',
    body: markDraftMentions(body),
    author: {
      username: viewer.username,
      path: communityPath('user', viewer.username),
      handle: `@${viewer.username}`,
      avatarUrl: null,
      accuracyRate: null,
    },
    community:
      community && kind
        ? {
            slug: community.slug,
            name: community.name,
            handle: community.handle,
            path: communityPath(kind, community.slug),
            avatarUrl: null,
            kind,
            personal: community.own,
            viewerIsMember: null,
          }
        : null,
    media: image
      ? { type: 'image', url: image, alt: imageAlt || null }
      : link
        ? { type: 'link', url: link, domain: domainOf(link) }
        : null,
    score: 0,
    viewerVote: null,
    commentCount: 0,
    publishedAt: new Date().toISOString(),
    edited: false,
    deleted: false,
    tag: tag || null,
    related: [],
  }
  return { ok: true, data: { card: <PostCard post={post} variant="preview" /> } }
}
