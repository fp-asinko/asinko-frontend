import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { BackButton } from '@/components/molecules/back-button'
import { env } from '@/env'
import { buildAlternates, OG_LOCALES } from '@/i18n/alternates'
import { permanentRedirect } from '@/i18n/navigation'
import { routing, type Locale } from '@/i18n/routing'
import { getOrThrow } from '@/lib/api'
import { postPath, postSlug } from '@/lib/posts/paths'
import type { PostItem } from '../feed.types'
import { getPost } from '../lib/post-api'
import { postExcerpt } from '../lib/post-excerpt'
import { commentsQuerySchema } from '../schemas/comments-query.schema'
import { CommentThread } from './comment-thread'
import { PostCard } from './post-card'
import { PostComments } from './post-comments'

function safeLocale(locale: string): Locale {
  return routing.locales.find((each) => each === locale) ?? routing.defaultLocale
}

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
    postPath(post.id, post.title),
  )
  if (post.deleted) {
    const t = await getTranslations({ locale, namespace: 'feed.card' })
    return { title: t('deleted'), alternates, robots: { index: false } }
  }
  const description = postExcerpt(post.body) || undefined
  return {
    title: post.title,
    description,
    alternates,
    openGraph: { title: post.title, description, locale: OG_LOCALES[locale], type: 'article' },
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
  if (slug?.length !== 1 || slug[0] !== postSlug(post.title)) {
    permanentRedirect({ href: postPath(post.id, post.title), locale: safeLocale(locale) })
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
