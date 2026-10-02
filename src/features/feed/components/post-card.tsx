import { ArrowUpRightIcon, MessageSquareIcon, Share2Icon } from 'lucide-react'
import Image from 'next/image'
import { useFormatter, useTranslations } from 'next-intl'
import { ComingSoon } from '@/components/molecules/coming-soon'
import type { PostItem } from '../feed.types'
import { CardByline } from './card-byline'
import { PostMarkdown } from './post-markdown'
import { ScorePill } from './score-pill'

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
export function PostCard({ post }: { post: PostItem }) {
  const t = useTranslations('feed.card')
  const format = useFormatter()

  return (
    <article className="px-4 py-4.5 md:px-6 md:py-5.5" aria-labelledby={`post-${post.id}`}>
      <div className="mb-2 flex items-start justify-between gap-3">
        <CardByline
          author={post.author}
          community={post.community}
          publishedAt={post.publishedAt}
          edited={post.edited}
        />
        {post.tag && !post.deleted && (
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 type-meta font-semibold">
            {post.tag}
          </span>
        )}
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
                <summary className="w-fit cursor-pointer list-none rounded-sm type-action text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
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
          <Image
            src={post.media.url}
            alt=""
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
          className="mt-3 flex w-fit max-w-full items-center gap-1.5 rounded-full border px-3 py-1.5 type-action text-muted-foreground hover:bg-surface"
        >
          <span className="truncate">{post.media.domain}</span>
          <ArrowUpRightIcon aria-hidden className="size-3.5 shrink-0" />
        </a>
      )}

      {!post.deleted && (
        <div className="mt-3 flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 type-action text-muted-foreground">
            <MessageSquareIcon aria-hidden className="size-4" />
            <span aria-hidden>{format.number(post.commentCount)}</span>
            <span className="sr-only">{t('comments', { count: post.commentCount })}</span>
          </span>
          <ScorePill score={post.score} viewerVote={post.viewerVote} />
          <span className="ml-auto">
            <ComingSoon
              label={t('share')}
              className="inline-flex h-7 items-center gap-1.5 rounded-sm type-meta text-muted-foreground"
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
