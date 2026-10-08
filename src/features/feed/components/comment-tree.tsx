import { ForwardIcon } from 'lucide-react'
import { useFormatter, useNow, useTranslations } from 'next-intl'
import { ShareButton } from '@/components/molecules/share-button'
import { UserAvatar } from '@/components/molecules/user-avatar'
import { Link } from '@/i18n/navigation'
import { previewProps } from '@/lib/communities/preview'
import { cn } from '@/lib/utils'
import type { CommentNode } from '../feed.types'
import { FOLD_DEPTH } from '../lib/comment-fold'
import { CommentAd } from './comment-ad'
import { CommentAnchor } from './comment-anchor'
import { CollapseButton, CommentFold, RepliesFold } from './comment-fold'
import { COMMENT_ACTION, CommentReply } from './comment-reply'
import { PendingComments } from './comment-thread'
import { PostMarkdown } from './post-markdown'
import { VoteControl } from './vote-control'

/** A comment's element id: its link's fragment (#comment-1, specs/comment-threads CT-12). */
const elementId = (id: string) => `comment-${id}`

function countReplies(comment: CommentNode): number {
  return comment.replies.reduce((total, reply) => total + 1 + countReplies(reply), 0)
}

/** The element ids of the replies, depth first, the first one first. */
function replyIds(comment: CommentNode): string[] {
  return comment.replies.flatMap((reply) => [elementId(reply.id), ...replyIds(reply)])
}

/** A reply hangs from its parent's line, with an elbow into its avatar (CT-05). */
const REPLY = 'thread-item thread-child thread-elbow'

/**
 * The comments of a post's page, wired as Reddit's (specs/comment-threads): each reply joins its
 * parent's line with an elbow, and each thread closes from its line (CommentFold). A Server
 * Component: the Markdown never reaches the browser. Comments being sent show at the end of their
 * level (PendingComments). --av is the avatar column: 24px, 32px from sm (Q3).
 */
export function CommentTree({ postId, comments }: { postId: string; comments: CommentNode[] }) {
  return (
    <>
      <ul className="flex flex-col gap-4 [--av:1.5rem] empty:hidden sm:[--av:2rem]">
        {comments.map((comment) => (
          <CommentItem key={comment.id} postId={postId} comment={comment} depth={0} />
        ))}
        <PendingComments parentId={null} itemClassName="thread-item" />
      </ul>
      <CommentAnchor />
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
  const tcomments = useTranslations('comments')
  const format = useFormatter()
  const now = useNow()
  const id = elementId(comment.id)
  const handle = comment.author?.handle ?? tc('deleted')
  const replies = comment.replies.map((reply) => (
    <CommentItem key={reply.id} postId={postId} comment={reply} depth={depth + 1} />
  ))
  const fold = depth + 1 === FOLD_DEPTH && comment.replies.length > 0
  // The ad read next (withAds, PD-07): first in the thread when the replies show, else after it.
  const adFirstInThread = comment.ad && replies.length > 0 && !fold ? comment.ad : undefined
  const adAfter = comment.ad && !adFirstInThread ? comment.ad : undefined

  const avatar = comment.author ? (
    <UserAvatar
      name={comment.author.username}
      imageUrl={comment.author.avatarUrl}
      size="sm"
      className="size-(--av)"
    />
  ) : (
    <span aria-hidden className="size-(--av) rounded-full bg-muted" />
  )

  const meta = (
    <p className="flex min-w-0 flex-wrap items-center gap-x-1 type-meta text-muted-foreground">
      {comment.author && (
        <>
          {/* py-1 -my-1: a 24px target (WCAG 2.5.8) on the 18px line, without moving it. */}
          <Link
            href={comment.author.path}
            // Its hover card (specs/mention-preview MP-01).
            {...previewProps('user', comment.author.username)}
            className="-my-1 inline-block max-w-full min-w-0 truncate py-1 font-bold text-foreground hover:underline"
          >
            {comment.author.handle}
          </Link>
          <span aria-hidden>•</span>
        </>
      )}
      <time dateTime={comment.createdAt}>
        {format.relativeTime(new Date(comment.createdAt), now)}
      </time>
      {comment.edited && (
        <>
          <span aria-hidden>•</span>
          <span>{tc('edited')}</span>
        </>
      )}
    </p>
  )

  const body = comment.deleted ? (
    <div className="relative mt-1 flex min-h-8 items-center pl-2">
      <CollapseButton />
      <p className="type-comment text-muted-foreground">{tc('deleted')}</p>
    </div>
  ) : (
    <>
      <div className="mt-1 pb-1 pl-2 type-comment wrap-anywhere">
        <PostMarkdown>{comment.body}</PostMarkdown>
      </div>
      <CommentReply
        postId={postId}
        commentId={comment.id}
        lead={<CollapseButton />}
        actions={
          <ShareButton href={`#${id}`} className={COMMENT_ACTION}>
            <ForwardIcon aria-hidden />
            {tcomments('share')}
          </ShareButton>
        }
      >
        <VoteControl
          kind="comment"
          id={comment.id}
          size="plain"
          score={comment.score}
          viewerVote={comment.viewerVote}
        />
      </CommentReply>
    </>
  )

  return (
    <>
      <li
        id={id}
        // Focused when opened from its link (CommentAnchor), not in the tab order.
        tabIndex={-1}
        className={cn(
          depth === 0 ? 'thread-item' : REPLY,
          // Focused from the keyboard (opening "N more replies", a shared link): a visible ring.
          'rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50 data-flash:animate-comment-flash',
        )}
      >
        <CommentFold
          handle={handle}
          avatar={avatar}
          meta={meta}
          body={body}
          replies={
            <>
              {adFirstInThread && (
                <li className="thread-child pb-2 pl-2">
                  <CommentAd ad={adFirstInThread} />
                </li>
              )}
              {fold ? (
                <RepliesFold
                  label={t('moreReplies', { count: countReplies(comment) })}
                  ids={replyIds(comment)}
                >
                  {replies}
                </RepliesFold>
              ) : (
                replies
              )}
              <PendingComments parentId={comment.id} itemClassName={REPLY} />
            </>
          }
        />
      </li>
      {adAfter && (
        <li className={depth === 0 ? 'py-1' : 'thread-child py-1 pl-2'}>
          <CommentAd ad={adAfter} />
        </li>
      )}
    </>
  )
}
