import { ArrowRightIcon } from 'lucide-react'
import { useFormatter, useNow, useTranslations } from 'next-intl'
import { ComingSoon } from '@/components/molecules/coming-soon'
import { UserAvatar } from '@/components/molecules/user-avatar'
import type { CommentPreview } from '../feed.types'
import { PostMarkdown } from './post-markdown'

/**
 * The first comments under a card (H-28), rendered on the server: the Markdown never reaches the
 * browser. Prototype sizes: 20px avatar, name 12/700, time 12px, text 13px, 14px between comments.
 * "See all comments" waits for the post detail spec (H-26).
 */
export function CommentsPreview({ comments }: { comments: CommentPreview[] }) {
  const t = useTranslations('feed.comments')
  const format = useFormatter()
  const now = useNow()

  return (
    <div className="flex flex-col gap-3.5">
      {comments.length === 0 ? (
        <p className="type-meta text-muted-foreground">{t('empty')}</p>
      ) : (
        <ul className="flex flex-col gap-3.5">
          {comments.map((comment) => (
            <li key={comment.id} className="flex gap-2.5">
              <UserAvatar
                name={comment.author.username}
                imageUrl={comment.author.avatarUrl}
                size="xs"
              />
              <div className="min-w-0 flex-1 wrap-anywhere">
                <p className="mb-0.75 flex gap-1.25 type-meta text-muted-foreground">
                  <span className="font-bold">{comment.author.handle}</span>
                  <span aria-hidden>·</span>
                  <time dateTime={comment.createdAt}>
                    {format.relativeTime(new Date(comment.createdAt), now)}
                  </time>
                </p>
                <div className="type-small">
                  <PostMarkdown>{comment.body}</PostMarkdown>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <ComingSoon
        label={t('seeAll')}
        className="inline-flex min-h-6 tap items-center gap-1 type-meta font-semibold"
      >
        {t('seeAll')}
        <ArrowRightIcon aria-hidden className="size-3.5" />
      </ComingSoon>
    </div>
  )
}
