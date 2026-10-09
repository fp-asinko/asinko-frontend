import { useTranslations } from 'next-intl'
import { GateButtons } from '@/components/organisms/auth-gate'
import { EmptyState } from '@/components/organisms/empty-state'
import { Link } from '@/i18n/navigation'
import type { ReactNode } from 'react'
import type { FeedItem, HouseAd } from '../feed.types'
import { feedHref } from '../lib/feed-href'
import type { FeedParams } from '../schemas/feed-params.schema'
import { ComposerPlaceholder } from './composer-placeholder'
import { FeedFilters } from './feed-filters'
import { FeedTabs } from './feed-tabs'
import { FeedItems } from './feed-items'
import { LoadMore } from './load-more'
import {
  ChartBarIcon,
  PenLineIcon,
  SparklesIcon,
  UserPlusIcon,
  UserRoundPlusIcon,
} from 'lucide-react'
import { ComposeTrigger } from '@/components/organisms/compose'
import { ACTION_PILL } from '@/components/molecules/focus-button'

export type FeedState =
  | {
      status: 'ok'
      items: FeedItem[]
      nextCursor: string | null
      /** The house ads, one every 10 cards (specs/post-detail-refresh PD-16). */
      ads?: readonly HouseAd[]
    }
  | { status: 'needs-account' }

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
            icon={<UserRoundPlusIcon />}
            title={t('needAccountTitle')}
            description={t('needAccount')}
            action={<GateButtons className="justify-center" />}
          />
        ) : items.length === 0 ? (
          <EmptyFeed params={params} communityHandle={communityHandle} />
        ) : (
          <>
            <ul className="divide-y">
              <FeedItems
                items={items}
                feedCommunity={params.community}
                ads={state.status === 'ok' ? state.ads : undefined}
              />
            </ul>
            {state.status === 'ok' && state.nextCursor && (
              <LoadMore params={params} cursor={state.nextCursor} offset={items.length} />
            )}
          </>
        )}
      </div>
    </>
  )
}

const ACTION = ACTION_PILL

function EmptyFeed({ params, communityHandle }: { params: FeedParams; communityHandle?: string }) {
  const t = useTranslations('feed.empty')

  if (params.filter === 'polls') {
    return (
      <EmptyState
        icon={<ChartBarIcon />}
        title={t('polls')}
        action={
          <Link href={feedHref({ ...params, filter: 'new' })} className={ACTION}>
            {t('seeAll')}
          </Link>
        }
      />
    )
  }
  if (params.feed === 'following') {
    return (
      <EmptyState
        icon={<UserPlusIcon />}
        title={t('following')}
        description={t('followingBody')}
        action={
          <Link href={feedHref({ ...params, feed: 'for-you' })} className={ACTION}>
            {t('goForYou')}
          </Link>
        }
      />
    )
  }
  if (params.community) {
    // No action here: the page's header has "Create post" where one can post (PC-03).
    return (
      <EmptyState
        icon={<PenLineIcon />}
        title={t('community', { handle: communityHandle ?? `#${params.community}` })}
        description={t('communityBody')}
      />
    )
  }
  return (
    <EmptyState
      icon={<SparklesIcon />}
      title={t('forYou')}
      description={t('forYouBody')}
      action={
        <ComposeTrigger view="modal" className={ACTION}>
          {t('createPost')}
        </ComposeTrigger>
      }
    />
  )
}
