import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { BackButton } from '@/components/molecules/back-button'
import { env } from '@/env'
import { buildAlternates, OG_LOCALES } from '@/i18n/alternates'
import { permanentRedirect } from '@/i18n/navigation'
import { safeLocale } from '@/i18n/safe-locale'
import { postImagePath, shareImage } from '@/lib/share-image/share-metadata'
import { getOrThrow } from '@/lib/api'
import { postSlug } from '@/lib/posts/paths'
import type { PostItem } from '../feed.types'
import { getPost } from '../lib/post-api'
import { postExcerpt } from '../lib/post-excerpt'
import { commentsQuerySchema } from '../schemas/comments-query.schema'
import { CommentThread } from './comment-thread'
import { PostCard } from './post-card'
import { PostComments } from './post-comments'
import { RecordView } from './record-view'

/**
 * Title, description, canonical and hreflang of a post's page (PC-12). A deleted post keeps its
 * page but is not indexed. A post that does not resolve gets no metadata: the page is a 404.
 */
export async function postMetadata(id: string, rawLocale: string): Promise<Metadata> {
  const locale = safeLocale(rawLocale)
  const result = await getPost(id)
  if (!result.ok) return {}
  const post = result.data
  const alternates = buildAlternates(
    env.NEXT_PUBLIC_SITE_URL,
    locale,
    // A thought's path comes from its text (specs/thoughts TH-08): the mapper already built it.
    post.path,
  )
  if (post.deleted) {
    const deleted = await getTranslations({ locale, namespace: 'feed.card' })
    return { title: deleted('deleted'), alternates, robots: { index: false } }
  }
  // Without a body, its title says it (TH-02); a thought, its own text (TH-08).
  const description = postExcerpt(post.body) || post.title || undefined
  const t = await getTranslations({ locale, namespace: 'feed.card' })
  const title = post.thought
    ? post.author
      ? t('thoughtBy', { author: post.author.username })
      : t('thought')
    : post.title
  // The page's openGraph replaces the layout's: the site's name goes again (specs/share-preview).
  const site = await getTranslations({ locale, namespace: 'metadata' })
  // Its own image, named here: the page's openGraph would drop one from the parent segment.
  const image = shareImage(postImagePath(locale, post.id), title)
  return {
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      siteName: site('title'),
      locale: OG_LOCALES[locale],
      type: 'article',
      ...image.openGraph,
    },
    twitter: image.twitter,
  }
}

/**
 * The post of a /post/{id}/{slug} page, or the way out (PC-12): a post that does not exist (or an
 * invalid id) is the not-found page, and a missing or outdated slug redirects to the canonical
 * URL, 308. Any other failure throws: the post is the page's main content (error.tsx).
 */
export async function resolvePostRoute(
  id: string,
  slug: readonly string[] | undefined,
  locale: string,
): Promise<PostItem> {
  const result = await getPost(id)
  if (!result.ok && (result.code === 'NOT_FOUND' || result.code === 'INVALID')) notFound()
  const post = getOrThrow(result)
  // Its canonical path, the mapper's: from the title, or a thought's text (specs/thoughts TH-08).
  const canonical = postSlug(post.thought ? post.body : post.title)
  if (slug?.length !== 1 || slug[0] !== canonical) {
    permanentRedirect({ href: post.path, locale: safeLocale(locale) })
  }
  return post
}

/**
 * The post of its own page, whole (PC-13), and its comments (PC-14 to PC-16), in the order and
 * with the search of the URL: user input, validated here (specs/post-detail-refresh PD-04, PD-06).
 */
export function PostDetail({
  post,
  searchParams,
}: {
  post: PostItem
  searchParams: Record<string, string | string[] | undefined>
}) {
  return (
    <CommentThread>
      <PostCard post={post} variant="detail" leading={<BackButton variant="plain" />} />
      {/* Into the right column's "Recently viewed" (specs/recently-viewed); a deleted post, no. */}
      {!post.deleted && <RecordView item={recentItem(post)} />}
      <PostComments
        postId={post.id}
        path={post.path}
        count={post.commentCount}
        closed={post.deleted}
        query={commentsQuerySchema.parse(searchParams)}
      />
    </CommentThread>
  )
}

/** What "Recently viewed" keeps of a post: where it was published (or its author), title, numbers. */
function recentItem(post: PostItem) {
  const community = post.community
  const label =
    community && !community.personal
      ? community.handle
      : (post.author?.handle ?? community?.handle ?? '')
  return {
    id: post.id,
    href: post.path,
    label,
    // A thought has no title: its text, as its page's description (specs/thoughts, PO 2026-10-26).
    title: post.thought ? postExcerpt(post.body) : post.title,
    kind: post.thought ? ('thought' as const) : ('post' as const),
    score: post.score,
    comments: post.commentCount,
  }
}
