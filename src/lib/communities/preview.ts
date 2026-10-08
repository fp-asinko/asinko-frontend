import type { CommunityKind } from './paths'

/** What a link shows a card about (specs/mention-preview § 1): a group, an asset or a person. */
export type PreviewTarget = { kind: CommunityKind; slug: string }

// The same characters as a community slug (community-slug.schema.ts), without zod: this runs in
// the browser on every hover, and zod would weigh on every page (seo.md). The action checks again.
const TARGET = /^(group|asset|user):([A-Za-z0-9_-]{1,64})$/

/**
 * The attribute that gives a link its card: `<Link {...previewProps('group', 'macro')}>`. The
 * server writes it; one listener on the page reads it (MentionPreviews).
 */
export function previewProps(kind: CommunityKind, slug: string) {
  return { 'data-preview': `${kind}:${slug}` }
}

/** Reads the attribute back; anything else (edited by hand, a bad slug) is no card. */
export function readPreviewTarget(value: string | null | undefined): PreviewTarget | null {
  const match = value ? TARGET.exec(value) : null
  if (!match) return null
  return { kind: match[1] as CommunityKind, slug: match[2] as string }
}
