import { getTranslations } from 'next-intl/server'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { getCommentTree, searchComments } from '../lib/comments-api'
import type { CommentsQuery } from '../schemas/comments-query.schema'
import { CommentComposer } from './comment-composer'
import { CommentSearchResults } from './comment-search-results'
import { CommentTree } from './comment-tree'
import { CommentsSearch } from './comments-search'
import { CommentsSort } from './comments-sort'

/**
 * The comments section of a post's page (PC-14, PC-15): the heading, the box, the order and the
 * search show at once; the list streams in its own Suspense, a new one for each order or search
 * (specs/post-detail-refresh PD-03 to PD-06). A deleted post keeps its comments but takes no new
 * ones.
 */
export async function PostComments({
  postId,
  path,
  count,
  closed,
  query,
}: {
  postId: string
  /** The post's page, without order nor search. */
  path: string
  count: number
  closed: boolean
  query: CommentsQuery
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
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {!query.q && <CommentsSort current={query.sort} />}
        <CommentsSearch query={query.q} />
      </div>
      <Suspense key={`${query.sort}:${query.q ?? ''}`} fallback={<CommentsSkeleton />}>
        {query.q ? (
          <SearchedComments postId={postId} q={query.q} allHref={path} />
        ) : (
          <LoadedComments postId={postId} sort={query.sort} />
        )}
      </Suspense>
    </section>
  )
}

/** A secondary section: if the comments fail, the post stays and says so here. */
async function LoadedComments({ postId, sort }: { postId: string; sort: CommentsQuery['sort'] }) {
  const t = await getTranslations('postDetail')
  const result = await getCommentTree(postId, sort)
  if (!result.ok) return <Failed message={t('error')} />
  return (
    <>
      {result.data.length === 0 && <p className="type-small text-muted-foreground">{t('empty')}</p>}
      <CommentTree postId={postId} comments={result.data} />
    </>
  )
}

async function SearchedComments({
  postId,
  q,
  allHref,
}: {
  postId: string
  q: string
  allHref: string
}) {
  const t = await getTranslations('postDetail')
  const result = await searchComments(postId, q)
  if (!result.ok) return <Failed message={t('error')} />
  return <CommentSearchResults query={q} comments={result.data} allHref={allHref} />
}

function Failed({ message }: { message: string }) {
  return (
    <p role="status" className="type-small text-muted-foreground">
      {message}
    </p>
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
