import { ArrowUpRightIcon, MessageSquareIcon, Share2Icon } from 'lucide-react'
import Image from 'next/image'
import { useFormatter, useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { ComingSoon } from '@/components/molecules/coming-soon'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import type { PostItem } from '../feed.types'
import { countFormat } from '../lib/count-format'
import { CardByline } from './card-byline'
import { FadeImage } from '@/components/ui/fade-image'
import { CommentsToggle } from './comments-toggle'
import { PostMarkdown } from './post-markdown'
import { SeeAllComments } from './see-all-comments'
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
 *
 * The `detail` variant is the post's own page (specs/post-create-detail § 4): the title is the h1,
 * the body is whole and the comment count points to the comments below.
 */
export function PostCard({
  post,
  variant = 'card',
  fadeImage = false,
  feedCommunity,
  leading,
}: {
  post: PostItem
  variant?: 'card' | 'detail'
  /** Fade the image in once loaded: only cards loaded later (D-M1, protects LCP). */
  fadeImage?: boolean
  /** The community the feed is filtered by: no join button for it (CP-07). */
  feedCommunity?: string
  /** Before the header, as Reddit's post page: its back button (specs/post-detail-refresh PD-01). */
  leading?: ReactNode
}) {
  const PostImage = fadeImage ? FadeImage : Image
  const t = useTranslations('feed.card')
  const format = useFormatter()
  const detail = variant === 'detail'
  const Title = detail ? 'h1' : 'h2'
  const commentCount = (
    <>
      <MessageSquareIcon aria-hidden className="size-4" />
      <span aria-hidden>{format.number(post.commentCount, countFormat(post.commentCount))}</span>
      <span className="sr-only">{t('comments', { count: post.commentCount })}</span>
    </>
  )

  return (
    // wrap-anywhere: a long word or URL from a user wraps instead of being cut off at 360px.
    <article
      className="px-4 py-4.5 wrap-anywhere md:px-0 md:py-5.5"
      aria-labelledby={`post-${post.id}`}
    >
      {/* The post's own page breathes more than a card, as Reddit's (specs/post-detail-refresh
          PD-17): more room between the header, the title, the paragraphs and the votes. */}
      <div className={cn('flex items-center gap-2.5', detail ? 'mb-3.5' : 'mb-2')}>
        {leading}
        <div className="min-w-0 flex-1">
          <CardByline
            author={post.author}
            community={post.community}
            publishedAt={post.publishedAt}
            edited={post.edited}
            titleId={`post-${post.id}`}
            canJoin={!post.deleted && post.community?.slug !== feedCommunity}
          />
        </div>
      </div>

      <Title
        id={`post-${post.id}`}
        // Focus target when the join button disappears (CF-14); not in the tab order.
        tabIndex={-1}
        className={
          post.deleted
            ? 'type-post-title text-muted-foreground outline-none'
            : 'type-post-title outline-none'
        }
      >
        {post.deleted ? (
          t('deleted')
        ) : detail ? (
          post.title
        ) : (
          // The way into the post's page (PC-17). pb-0.5 -mb-0.5: a 24px target (WCAG 2.5.8) on the
          // 22px line; only downwards, as the author's link above already reaches the title.
          <Link
            href={post.path}
            className="-mb-0.5 inline-block rounded-sm pb-0.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {post.title}
          </Link>
        )}
      </Title>

      {!post.deleted && post.body && (
        <div className={cn('group/body type-post-body', detail ? 'mt-3' : 'mt-1.5')}>
          {!detail && isLong(post.body) ? (
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
            <PostMarkdown className={detail ? 'gap-4' : undefined}>{post.body}</PostMarkdown>
          )}
        </div>
      )}

      {post.media?.type === 'image' && (
        <div
          className={cn(
            'relative aspect-video overflow-hidden rounded-lg border bg-surface',
            detail ? 'mt-4' : 'mt-3',
          )}
        >
          <PostImage
            src={post.media.url}
            alt={t('image')}
            fill
            sizes="(min-width: 1024px) 732px, (min-width: 768px) calc(100vw - 300px), 100vw"
            className="object-cover"
            // The detail's image is its largest paint (seo.md § Performance).
            priority={detail}
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
        <div className={cn('flex flex-wrap items-center gap-3', detail ? 'mt-6' : 'mt-3')}>
          <VoteControl id={post.id} score={post.score} viewerVote={post.viewerVote} />
          {detail ? (
            <a
              href="#comments"
              className="inline-flex h-9.5 tap items-center gap-1.5 rounded-full bg-muted px-3 type-action text-muted-foreground outline-none hover:bg-muted-hover focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {commentCount}
            </a>
          ) : (
            <CommentsToggle kind="post" id={post.id} seeAll={<SeeAllComments href={post.path} />}>
              {commentCount}
            </CommentsToggle>
          )}
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
