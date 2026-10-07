import { useTranslations } from 'next-intl'
import { GateButtons } from '@/components/organisms/auth-gate'
import { EmptyState } from '@/components/organisms/empty-state'
import { Link } from '@/i18n/navigation'
import type { ReactNode } from 'react'
import type { FeedItem } from '../feed.types'
import { feedHref } from '../lib/feed-href'
import type { FeedParams } from '../schemas/feed-params.schema'
import { ComposerPlaceholder } from './composer-placeholder'
import { FeedFilters } from './feed-filters'
import { FeedTabs } from './feed-tabs'
import { FeedItems } from './feed-items'
import { LoadMore } from './load-more'

export type FeedState =
  { status: 'ok'; items: FeedItem[]; nextCursor: string | null } | { status: 'needs-account' }

/**
 * The top of the center column as in the prototype (specs/home/design.md § 5): composer, tabs and
 * filters. Rendered right away, outside the list's Suspense, so a tab switch shows at once while
 * the feed loads (specs/feed-navigation FN-02). Pure render.
 */
export function FeedTop({
  params,
  viewerName,
  chip,
}: {
  params: FeedParams
  viewerName: string | null
  /** The community chip, streamed on its own (specs/feed-navigation § 2). */
  chip?: ReactNode
}) {
  return (
    <>
      <ComposerPlaceholder viewerName={viewerName} />
      <div className="px-2 pt-4 sm:px-0">
        <FeedTabs params={params} />
        <FeedFilters params={params} chip={chip} />
      </div>
    </>
  )
}

/** The feed box (dividers between cards) or its empty state. Pure render: the data comes in. */
export function FeedListView({
  params,
  state,
  communityHandle,
}: {
  params: FeedParams
  state: FeedState
  /** $BTC or #defi, for the empty state of a community page. */
  communityHandle?: string
}) {
  const t = useTranslations('feed.empty')
  const items = state.status === 'ok' ? state.items : []

  return (
    <>
      <div className="overflow-hidden bg-card">
        {state.status === 'needs-account' ? (
          // A whole private page: it stays, with the ways in (specs/guest-experience Q2).
          <EmptyState
            message={t('needAccount')}
            action={<GateButtons className="justify-center" />}
          />
        ) : items.length === 0 ? (
          <EmptyFeed params={params} communityHandle={communityHandle} />
        ) : (
          <>
            <ul className="divide-y">
              <FeedItems items={items} feedCommunity={params.community} />
            </ul>
            {state.status === 'ok' && state.nextCursor && (
              <LoadMore params={params} cursor={state.nextCursor} />
            )}
          </>
        )}
      </div>
    </>
  )
}

function EmptyFeed({ params, communityHandle }: { params: FeedParams; communityHandle?: string }) {
  const t = useTranslations('feed.empty')

  if (params.filter === 'polls') return <EmptyState message={t('polls')} />
  if (params.feed === 'following') {
    return (
      <EmptyState
        message={t('following')}
        action={
          <Link
            href={feedHref({ ...params, feed: 'for-you' })}
            className="tap rounded-full bg-primary px-4 py-2 type-action text-primary-foreground hover:bg-primary-hover"
          >
            {t('goForYou')}
          </Link>
        }
      />
    )
  }
  if (params.community) {
    return (
      <EmptyState message={t('community', { handle: communityHandle ?? `#${params.community}` })} />
    )
  }
  return <EmptyState message={t('forYou')} />
}
