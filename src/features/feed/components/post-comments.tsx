import { getTranslations } from 'next-intl/server'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { getCommentTree } from '../lib/comments-api'
import { CommentComposer } from './comment-composer'
import { CommentTree } from './comment-tree'

/**
 * The comments section of a post's page (PC-14, PC-15): the heading and the box show at once;
 * the tree streams in its own Suspense. A deleted post keeps its comments but takes no new ones.
 */
export async function PostComments({
  postId,
  count,
  closed,
}: {
  postId: string
  count: number
  closed: boolean
}) {
  const t = await getTranslations('postDetail')
  return (
    <section
      id="comments"
      aria-labelledby="comments-title"
      className="flex flex-col gap-4 border-t px-4 pt-4 pb-10 md:px-0"
    >
      <h2 id="comments-title" className="type-ui font-bold">
        {t('title', { count })}
      </h2>
      {!closed && <CommentComposer postId={postId} />}
      <Suspense fallback={<CommentsSkeleton />}>
        <LoadedComments postId={postId} />
      </Suspense>
    </section>
  )
}

/** A secondary section: if the comments fail, the post stays and says so here. */
async function LoadedComments({ postId }: { postId: string }) {
  const t = await getTranslations('postDetail')
  const result = await getCommentTree(postId)
  if (!result.ok) {
    return (
      <p role="status" className="type-small text-muted-foreground">
        {t('error')}
      </p>
    )
  }
  return (
    <>
      {result.data.length === 0 && <p className="type-small text-muted-foreground">{t('empty')}</p>}
      <CommentTree postId={postId} comments={result.data} />
    </>
  )
}

function CommentsSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden>
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex gap-2.5">
          <Skeleton className="size-5 rounded-full" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3.5 w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}
