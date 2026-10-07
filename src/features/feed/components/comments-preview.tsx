import { useFormatter, useNow, useTranslations } from 'next-intl'
import { UserAvatar } from '@/components/molecules/user-avatar'
import type { CommentPreview } from '../feed.types'
import { PostMarkdown } from './post-markdown'

/**
 * The first comments under a card (H-28), rendered on the server: the Markdown never reaches the
 * browser. Prototype sizes: 20px avatar, name 12/700, time 12px, text 13px, 14px between comments.
 * "See all comments" is the toggle's (CommentsToggle). Color and motion (FC-07, FC-08, FC-10):
 * identity avatars, bold authors in the main color, rows that fade up one after the other.
 */
export function CommentsPreview({ comments }: { comments: CommentPreview[] }) {
  const t = useTranslations('feed.comments')
  const format = useFormatter()
  const now = useNow()

  return comments.length === 0 ? (
    <p className="type-meta text-muted-foreground">{t('empty')}</p>
  ) : (
    <ul className="flex stagger flex-col gap-3.5">
      {comments.map((comment) => (
        <li key={comment.id} className="group flex gap-2.5">
          <UserAvatar
            name={comment.author.username}
            imageUrl={comment.author.avatarUrl}
            size="xs"
            className="transition-[scale] duration-150 ease-out motion-safe:group-hover:scale-105"
          />
          <div className="min-w-0 flex-1 wrap-anywhere">
            <p className="mb-0.75 flex gap-1.25 type-meta text-muted-foreground">
              <span className="font-bold text-foreground">{comment.author.handle}</span>
              <span aria-hidden>·</span>
              <time dateTime={comment.createdAt}>
                {format.relativeTime(new Date(comment.createdAt), now)}
              </time>
            </p>
            <div className="type-small text-foreground">
              <PostMarkdown>{comment.body}</PostMarkdown>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
