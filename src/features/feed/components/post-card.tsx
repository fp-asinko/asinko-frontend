import { ArrowUpRightIcon, MessageSquareIcon, Share2Icon } from 'lucide-react'
import Image from 'next/image'
import { useFormatter, useTranslations } from 'next-intl'
import { ComingSoon } from '@/components/molecules/coming-soon'
import type { PostItem } from '../feed.types'
import { countFormat } from '../lib/count-format'
import { CardByline } from './card-byline'
import { FadeImage } from '@/components/ui/fade-image'
import { CommentsToggle } from './comments-toggle'
import { PostMarkdown } from './post-markdown'
import { VoteControl } from './vote-control'

/** Bodies longer than this get "See more" (6 lines at 15px in the 748px column, roughly). */
const LONG_BODY = 420

function isLong(body: string) {
  return body.length > LONG_BODY || body.split('\n').length > 6
}

/**
 * Post card of the prototype (H-12), a Server Component: byline, title (17/700), body (15px,
 * Markdown), image or link, and the actions row. A long body is clamped with CSS and expands with a
 * native <details>: no JavaScript.
 */
export function PostCard({
  post,
  fadeImage = false,
}: {
  post: PostItem
  /** Fade the image in once loaded: only cards loaded later (D-M1, protects LCP). */
  fadeImage?: boolean
}) {
  const PostImage = fadeImage ? FadeImage : Image
  const t = useTranslations('feed.card')
  const format = useFormatter()

  return (
    // wrap-anywhere: a long word or URL from a user wraps instead of being cut off at 360px.
    <article
      className="px-4 py-4.5 wrap-anywhere md:px-0 md:py-5.5"
      aria-labelledby={`post-${post.id}`}
    >
      <div className="mb-2">
        <CardByline
          author={post.author}
          community={post.community}
          publishedAt={post.publishedAt}
          edited={post.edited}
        />
      </div>

      <h2
        id={`post-${post.id}`}
        className={post.deleted ? 'type-post-title text-muted-foreground' : 'type-post-title'}
      >
        {post.deleted ? t('deleted') : post.title}
      </h2>

      {!post.deleted && post.body && (
        <div className="group/body mt-1.5 type-post-body">
          {isLong(post.body) ? (
            <>
              <div className="line-clamp-6 group-has-[details[open]]/body:line-clamp-none">
                <PostMarkdown>{post.body}</PostMarkdown>
              </div>
              <details className="group/more mt-1">
                <summary className="inline-flex min-h-6 w-fit cursor-pointer list-none items-center rounded-sm type-action text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
                  <span className="group-open/more:hidden">{t('seeMore')}</span>
                  <span className="hidden group-open/more:inline">{t('seeLess')}</span>
                </summary>
              </details>
            </>
          ) : (
            <PostMarkdown>{post.body}</PostMarkdown>
          )}
        </div>
      )}

      {post.media?.type === 'image' && (
        <div className="relative mt-3 aspect-video overflow-hidden rounded-lg border bg-surface">
          <PostImage
            src={post.media.url}
            alt={t('image')}
            fill
            sizes="(min-width: 1024px) 732px, (min-width: 768px) calc(100vw - 300px), 100vw"
            className="object-cover"
            // Local SVG mocks skip the optimizer; backend images get remotePatterns when they exist.
            unoptimized={post.media.url.endsWith('.svg')}
          />
        </div>
      )}
      {post.media?.type === 'link' && (
        <a
          href={post.media.url}
          target="_blank"
          rel="noopener noreferrer nofollow ugc"
          className="mt-3 flex w-fit max-w-full tap items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 type-action text-muted-foreground hover:bg-muted-hover"
        >
          <span className="truncate">{post.media.domain}</span>
          <ArrowUpRightIcon aria-hidden className="size-3.5 shrink-0" />
          <span className="sr-only">{t('newTab')}</span>
        </a>
      )}

      {!post.deleted && (
        // Votes first, then comments, as Reddit (specs/feed-cards § 14). Share stays on the right in
        // mobile and joins the group from md.
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <VoteControl postId={post.id} score={post.score} viewerVote={post.viewerVote} />
          <CommentsToggle kind="post" id={post.id}>
            <MessageSquareIcon aria-hidden className="size-4" />
            <span aria-hidden>
              {format.number(post.commentCount, countFormat(post.commentCount))}
            </span>
            <span className="sr-only">{t('comments', { count: post.commentCount })}</span>
          </CommentsToggle>
          <span className="ml-auto md:ml-0">
            <ComingSoon
              label={t('share')}
              placement="below-end"
              className="inline-flex h-9.5 min-w-9.5 tap items-center justify-center gap-1.5 rounded-full bg-muted px-3 type-action text-muted-foreground hover:bg-muted-hover"
            >
              <Share2Icon aria-hidden className="size-3.5" />
              <span className="hidden sm:inline">{t('share')}</span>
            </ComingSoon>
          </span>
        </div>
      )}
    </article>
  )
}
