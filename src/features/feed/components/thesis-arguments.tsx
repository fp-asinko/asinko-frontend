import { CloudOffIcon, MessagesSquareIcon } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { Suspense } from 'react'
import { FocusButton } from '@/components/molecules/focus-button'
import { EmptyState } from '@/components/organisms/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import type { CommentTarget, ThesisItem } from '../feed.types'
import { getCommentTree } from '../lib/comments-api'
import type { ThesisArgumentsQuery } from '../schemas/thesis-arguments-query.schema'
import { COMMENT_BOX } from './comment-box'
import { CommentComposer } from './comment-composer'
import { CommentThread } from './comment-thread'
import { CommentTree } from './comment-tree'
import { CommentsSort } from './comments-sort'
import { FeedAd } from './feed-ad'

const SIDES = ['pro', 'contra'] as const

/**
 * A thesis's arguments (specs/thesis-arguments TA-01 to TA-07): For and Against as links in the URL
 * (no JavaScript, as the profile's tabs), and on each the box to argue on that side, the order and
 * its thread, the post's. Publishing refreshes the page: the side's counter comes again, up by one.
 */
export async function ThesisArguments({
  thesis,
  query,
}: {
  thesis: ThesisItem
  query: ThesisArgumentsQuery
}) {
  const t = await getTranslations('feed.thesis.arguments')
  const target: CommentTarget = {
    kind: 'thesis',
    id: thesis.id,
    side: query.side === 'contra' ? 'CONTRA' : 'PRO',
  }
  const counts = { pro: thesis.argumentCount.pro, contra: thesis.argumentCount.contra }

  return (
    <>
      {/* The side's ad above its arguments, under the thesis, as a post's above its comments
          (specs/ads AD-04, PO 2026-11-05). Nothing if it fails. */}
      <Suspense key={`${query.side}:${query.sort}`} fallback={null}>
        <ArgumentsAd target={target} sort={query.sort} />
      </Suspense>
      <section
        id="arguments"
        aria-labelledby="arguments-title"
        className="flex scroll-mt-20 flex-col gap-5 border-t px-4 pt-5 pb-10 md:px-0"
      >
        <h2 id="arguments-title" className="type-ui font-bold">
          {t('title')}
        </h2>
        <nav aria-label={t('sides')} className="flex gap-1.5">
          {SIDES.map((side) => {
            const active = query.side === side
            return (
              <Link
                key={side}
                // For is the page itself, as the default (TA-01).
                href={side === 'pro' ? thesis.path : `${thesis.path}?side=contra`}
                // Switching side keeps the place: the thesis stays where it is.
                scroll={false}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  // 30px tall, 24px+ target (WCAG 2.5.8), as the profile's tabs.
                  'inline-flex h-7.5 tap items-center gap-1.5 rounded-full border px-3.5 type-meta font-semibold tabular-nums outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border-strong bg-background text-muted-foreground hover:border-foreground/40 hover:text-foreground',
                )}
              >
                {t(`tab.${side}`, { count: counts[side] })}
              </Link>
            )
          })}
        </nav>
        {/* A side of its own: what is being sent shows in its thread (PendingComments). */}
        <CommentThread key={query.side}>
          <CommentComposer target={target} label={t(`box.${query.side}`)} />
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <CommentsSort
              current={query.sort}
              keep={query.side === 'contra' ? { side: 'contra' } : undefined}
            />
          </div>
          <Suspense key={`${query.side}:${query.sort}`} fallback={<ArgumentsSkeleton />}>
            <LoadedArguments target={target} side={query.side} sort={query.sort} />
          </Suspense>
        </CommentThread>
      </section>
    </>
  )
}

/** The side's own ad, the width of the column: the same request as its thread (cached). */
async function ArgumentsAd({
  target,
  sort,
}: {
  target: CommentTarget
  sort: ThesisArgumentsQuery['sort']
}) {
  const result = await getCommentTree(target, sort)
  if (!result.ok || !result.data.postAd) return null
  return (
    <div className="border-t">
      <FeedAd ad={result.data.postAd} />
    </div>
  )
}

/**
 * One side's thread, a secondary section: if it fails, the thesis stays and says so here. The ads
 * between its arguments come with it (Q5); the one on top is above the section (ArgumentsAd).
 */
async function LoadedArguments({
  target,
  side,
  sort,
}: {
  target: CommentTarget
  side: ThesisArgumentsQuery['side']
  sort: ThesisArgumentsQuery['sort']
}) {
  const t = await getTranslations('feed.thesis.arguments')
  const result = await getCommentTree(target, sort)
  if (!result.ok) {
    return <EmptyState icon={<CloudOffIcon />} title={t('failed')} description={t('failedBody')} />
  }
  const { comments } = result.data
  return (
    <>
      {comments.length === 0 && (
        <EmptyState
          icon={<MessagesSquareIcon />}
          title={t(`empty.${side}`)}
          description={t('emptyBody')}
          // Into the box, which opens on focus (PD-02).
          action={<FocusButton target={COMMENT_BOX}>{t(`emptyAction.${side}`)}</FocusButton>}
        />
      )}
      <CommentTree target={target} comments={comments} />
    </>
  )
}

function ArgumentsSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden>
      {[0, 1, 2].map((each) => (
        <div key={each} className="flex gap-2">
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}
