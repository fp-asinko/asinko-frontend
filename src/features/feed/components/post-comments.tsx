import { getTranslations } from 'next-intl/server'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { getAds } from '../lib/ads-api'
import { getCommentTree, searchComments } from '../lib/comments-api'
import { withAds } from '../lib/with-ads'
import type { CommentsQuery } from '../schemas/comments-query.schema'
import { CommentComposer } from './comment-composer'
import { CommentSearchResults } from './comment-search-results'
import { CommentTree } from './comment-tree'
import { CommentsSearch } from './comments-search'
import { CommentsSort } from './comments-sort'
import { CloudOffIcon, MessageCircleIcon } from 'lucide-react'
import { EmptyState } from '@/components/organisms/empty-state'
import { COMMENT_BOX } from './comment-box'
import { FocusButton } from '@/components/molecules/focus-button'
import { useTranslations } from 'next-intl'

/** The live region of the section: stays while the list changes, so a search is announced. */
const ANNOUNCER = 'comments-announcer'

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
      className="flex flex-col gap-5 border-t px-4 pt-5 pb-10 md:px-0"
    >
      <h2 id="comments-title" className="type-ui font-bold">
        {t('title', { count })}
      </h2>
      {!closed && <CommentComposer postId={postId} />}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {!query.q && <CommentsSort current={query.sort} />}
        <CommentsSearch query={query.q} />
      </div>
      <p id={ANNOUNCER} role="status" className="sr-only" />
      <Suspense key={`${query.sort}:${query.q ?? ''}`} fallback={<CommentsSkeleton />}>
        {query.q ? (
          <SearchedComments postId={postId} q={query.q} allHref={path} />
        ) : (
          <LoadedComments postId={postId} sort={query.sort} closed={closed} />
        )}
      </Suspense>
    </section>
  )
}

/**
 * A secondary section: if the comments fail, the post stays and says so here. The ads come with
 * them, at once; if they fail, the comments show without ads (PD-09).
 */
async function LoadedComments({
  postId,
  sort,
  closed,
}: {
  postId: string
  sort: CommentsQuery['sort']
  /** A deleted post has no comment box: nothing to invite to. */
  closed: boolean
}) {
  const t = await getTranslations('postDetail')
  const [result, ads] = await Promise.all([getCommentTree(postId, sort), getAds('comments')])
  if (!result.ok) return <Failed />
  return (
    <>
      {result.data.length === 0 && (
        <EmptyState
          icon={<MessageCircleIcon />}
          title={t('empty')}
          description={t('emptyBody')}
          // Into the comment box, which opens on focus (PD-02).
          action={
            closed ? undefined : <FocusButton target={COMMENT_BOX}>{t('emptyAction')}</FocusButton>
          }
        />
      )}
      <CommentTree
        postId={postId}
        // The post already shows the first ad (PD-15): the comments start from the second.
        comments={withAds(result.data, ads.ok ? ads.data : [], undefined, 1)}
      />
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
  const result = await searchComments(postId, q)
  if (!result.ok) return <Failed />
  return (
    <CommentSearchResults
      query={q}
      comments={result.data}
      allHref={allHref}
      announcer={ANNOUNCER}
    />
  )
}

function Failed() {
  const t = useTranslations('postDetail')
  return (
    <div role="status">
      <EmptyState
        icon={<CloudOffIcon />}
        title={t('errorTitle')}
        description={t('errorBody')}
        size="section"
      />
    </div>
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
