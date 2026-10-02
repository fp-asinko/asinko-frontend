import type { RawEntity } from '@/lib/api/contract'
import { SLUG_PATTERN } from '../schemas/feed-params.schema'

/**
 * Mentions (H-14, specs/home/design.md § Markdown y menciones). The backend resolves them into
 * `entities` with offsets in the body (proposal P-001). Before the Markdown is parsed, each one
 * becomes a link with our own scheme; the Markdown renderer turns those into elements. Never HTML.
 */
export const MENTION_SCHEME = 'asinko:'

export type MentionLookup = {
  /** Slug of the community of an asset, if it has one. */
  communityOfAsset: (assetId: string) => string | undefined
  communitySlug: (communityId: string) => string | undefined
}

export type Mention =
  /** $BTC with a community and #defi: link to the Home filtered by that community. */
  | { type: 'community'; slug: string }
  /** $XYZ without a community: highlighted, no link. */
  | { type: 'ticker' }
  /** @maria: highlighted, no link until profiles exist (phase 2). */
  | { type: 'user' }

function hrefFor(entity: RawEntity, lookup: MentionLookup): string | null {
  switch (entity.type) {
    case 'TICKER': {
      const slug = lookup.communityOfAsset(entity.resolvedId)
      return slug ? `${MENTION_SCHEME}community/${slug}` : `${MENTION_SCHEME}ticker`
    }
    case 'COMMUNITY': {
      const slug = lookup.communitySlug(entity.resolvedId)
      return slug ? `${MENTION_SCHEME}community/${slug}` : null
    }
    case 'MENTION':
      return `${MENTION_SCHEME}user`
  }
}

/** Markdown-escapes the visible text of a mention. */
function escapeLinkText(text: string) {
  return text.replace(/[\\[\]]/g, '\\$&')
}

/**
 * Replaces each valid entity with a Markdown link, from the end backwards so earlier offsets stay
 * right. An entity whose offsets do not match its text, or that overlaps another, is left as plain
 * text: the backend is not trusted (api-integration.md).
 */
export function markMentions(
  body: string,
  entities: readonly RawEntity[] | undefined,
  lookup: MentionLookup,
): string {
  if (!entities?.length) return body
  const sorted = [...entities].sort((a, b) => b.position[0] - a.position[0])

  let result = body
  let nextStart = body.length
  for (const entity of sorted) {
    const [start, end] = entity.position
    const valid =
      start >= 0 && end <= nextStart && start < end && body.slice(start, end) === entity.raw
    if (!valid) continue
    const href = hrefFor(entity, lookup)
    if (!href) continue
    result = `${result.slice(0, start)}[${escapeLinkText(entity.raw)}](${href})${result.slice(end)}`
    nextStart = start
  }
  return result
}

/** Reads back a link made by markMentions; null for any other link. */
export function parseMention(href: string | undefined): Mention | null {
  if (!href?.startsWith(MENTION_SCHEME)) return null
  const [type, slug] = href.slice(MENTION_SCHEME.length).split('/')
  if (type === 'community' && slug && SLUG_PATTERN.test(slug)) return { type: 'community', slug }
  if (type === 'ticker') return { type: 'ticker' }
  if (type === 'user') return { type: 'user' }
  return null
}
