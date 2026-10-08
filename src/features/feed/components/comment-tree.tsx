import { ChevronDownIcon } from 'lucide-react'
import { useFormatter, useNow, useTranslations } from 'next-intl'
import { UserAvatar } from '@/components/molecules/user-avatar'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Link } from '@/i18n/navigation'
import { previewProps } from '@/lib/communities/preview'
import type { CommentNode } from '../feed.types'
import { FOLD_DEPTH } from '../lib/comment-fold'
import { CommentAd } from './comment-ad'
import { CommentReply } from './comment-reply'
import { PendingComments } from './comment-thread'
import { PostMarkdown } from './post-markdown'
import { VoteControl } from './vote-control'

function countReplies(comment: CommentNode): number {
  return comment.replies.reduce((total, reply) => total + 1 + countReplies(reply), 0)
}

/**
 * The comments of a post's page, nested as Reddit: each level hangs from a line under its
 * parent's avatar (specs/post-create-detail § 4). A Server Component: the Markdown never reaches
 * the browser. Comments being sent show at the end of their level (PendingComments).
 */
export function CommentTree({ postId, comments }: { postId: string; comments: CommentNode[] }) {
  return (
    <>
      {comments.length > 0 && (
        <ul className="flex flex-col gap-4">
          {comments.map((comment) => (
            <CommentItem key={comment.id} postId={postId} comment={comment} depth={0} />
          ))}
        </ul>
      )}
      <PendingComments parentId={null} />
    </>
  )
}

function CommentItem({
  postId,
  comment,
  depth,
}: {
  postId: string
  comment: CommentNode
  depth: number
}) {
  const t = useTranslations('postDetail')
  const tc = useTranslations('feed.card')
  const format = useFormatter()
  const now = useNow()
  const replies = comment.replies.length > 0 && (
    <ul className="flex flex-col gap-4">
      {comment.replies.map((reply) => (
        <CommentItem key={reply.id} postId={postId} comment={reply} depth={depth + 1} />
      ))}
    </ul>
  )
  const fold = depth + 1 === FOLD_DEPTH && comment.replies.length > 0
  // The ad read next (withAds, PD-07): before the replies when they show, else after the comment.
  const adFirstInThread = comment.ad && replies && !fold ? comment.ad : undefined
  const adAfter = comment.ad && !adFirstInThread ? comment.ad : undefined

  return (
    <>
      <li className="flex flex-col">
        <div className="flex gap-2.5">
          {comment.author ? (
            <UserAvatar
              name={comment.author.username}
              imageUrl={comment.author.avatarUrl}
              size="xs"
            />
          ) : (
            <span aria-hidden className="size-5 shrink-0 rounded-full bg-muted" />
          )}
          <div className="min-w-0 flex-1 wrap-anywhere">
            <p className="mb-0.75 flex flex-wrap items-center gap-x-1.25 type-meta text-muted-foreground">
              {comment.author && (
                <>
                  {/* py-1 -my-1: a 24px target (WCAG 2.5.8) on the 16px line, without moving it. */}
                  <Link
                    href={comment.author.path}
                    // Its hover card (specs/mention-preview MP-01).
                    {...previewProps('user', comment.author.username)}
                    className="-my-1 inline-block py-1 font-bold text-foreground hover:underline"
                  >
                    {comment.author.handle}
                  </Link>
                  <span aria-hidden>·</span>
                </>
              )}
              <time dateTime={comment.createdAt}>
                {format.relativeTime(new Date(comment.createdAt), now)}
              </time>
              {comment.edited && (
                <>
                  <span aria-hidden>·</span>
                  <span>{tc('edited')}</span>
                </>
              )}
            </p>
            {comment.deleted ? (
              <p className="type-small text-muted-foreground">{tc('deleted')}</p>
            ) : (
              <>
                <div className="type-small">
                  <PostMarkdown>{comment.body}</PostMarkdown>
                </div>
                <CommentReply postId={postId} commentId={comment.id}>
                  <VoteControl
                    kind="comment"
                    id={comment.id}
                    size="sm"
                    score={comment.score}
                    viewerVote={comment.viewerVote}
                  />
                </CommentReply>
              </>
            )}
          </div>
        </div>
        {/* The thread line, under the avatar's center (20px avatar: 10px in). */}
        <div className="mt-3 ml-2.5 flex flex-col gap-4 border-l pl-4.5 empty:hidden">
          {adFirstInThread && <CommentAd ad={adFirstInThread} />}
          {fold ? (
            <Collapsible className="flex flex-col gap-4">
              <CollapsibleTrigger className="group inline-flex min-h-6 cursor-pointer items-center gap-1 rounded-sm type-meta font-bold text-foreground outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50">
                <span className="group-data-panel-open:hidden">
                  {t('seeReplies', { count: countReplies(comment) })}
                </span>
                <span className="hidden group-data-panel-open:inline">{t('hideReplies')}</span>
                <ChevronDownIcon
                  aria-hidden
                  className="size-3.5 transition-transform duration-200 ease-out group-data-panel-open:rotate-180"
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-200 ease-out data-ending-style:h-0 data-ending-style:duration-150 data-starting-style:h-0">
                {replies}
              </CollapsibleContent>
            </Collapsible>
          ) : (
            replies
          )}
          <PendingComments parentId={comment.id} />
        </div>
      </li>
      {adAfter && (
        <li>
          <CommentAd ad={adAfter} />
        </li>
      )}
    </>
  )
}
