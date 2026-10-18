import { useFormatter, useNow, useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import type { UserReply } from '../feed.types'
import { PostMarkdown } from './post-markdown'

/**
 * A person's comments as a list (specs/backend-adoption BK-03), as X's replies: first where each
 * one is ("in *title* · #group"), the title a link to the comment in its post; then what it says,
 * with its Markdown; then when and its points. Server-rendered: the Markdown never reaches the
 * browser. Each an `article`: "Load more" moves the focus to the first new one.
 */
export function ReplyListItems({ replies }: { replies: readonly UserReply[] }) {
  const t = useTranslations('feed.replies')
  const format = useFormatter()
  const now = useNow()

  return replies.map((reply) => (
    <li key={reply.id}>
      <article aria-labelledby={`reply-${reply.id}`} className="px-4 py-4 wrap-anywhere md:px-0">
        <p id={`reply-${reply.id}`} className="type-meta text-muted-foreground">
          {t.rich('in', {
            title: reply.where.title,
            post: (chunks) =>
              reply.where.path ? (
                <Link
                  href={reply.where.path}
                  className="font-semibold text-foreground outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {chunks}
                </Link>
              ) : (
                <span className="font-semibold text-foreground">{chunks}</span>
              ),
          })}
          {reply.where.community && (
            <>
              {' · '}
              <Link href={reply.where.community.path} className="hover:underline">
                {reply.where.community.handle}
              </Link>
            </>
          )}
        </p>
        <div className="mt-1.5 type-comment">
          <PostMarkdown>{reply.body}</PostMarkdown>
        </div>
        <p className="mt-1.5 type-meta text-muted-foreground">
          <time dateTime={reply.createdAt}>
            {format.relativeTime(new Date(reply.createdAt), now)}
          </time>
          {reply.edited && <> · {t('edited')}</>}
          {' · '}
          {t('points', { count: reply.score })}
        </p>
      </article>
    </li>
  ))
}
