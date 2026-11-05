import { useTranslations } from 'next-intl'
import { GateButtons } from '@/components/organisms/auth-gate'
import { EmptyState } from '@/components/organisms/empty-state'
import { Link } from '@/i18n/navigation'
import type { ReactNode } from 'react'
import type { FeedItem } from '../feed.types'
import { feedHref } from '../lib/feed-href'
import type { FeedParams } from '../schemas/feed-params.schema'
import { ComposerPlaceholder } from './composer-placeholder'
import { FeedChipRow } from './feed-filters'
import { FeedSort } from './feed-sort'
import { FeedTabs } from './feed-tabs'
import { FeedTypeMenu } from './feed-type-menu'
import { FeedItems } from './feed-items'
import { Impressions } from './impression-tracker'
import { LoadMore } from './load-more'
import {
  ChartBarIcon,
  PenLineIcon,
  SparklesIcon,
  TargetIcon,
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
      /** The page the impressions refer to (specs/explore-v1); none, none reported. */
      requestId?: string | null
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
  viewerAvatarUrl = null,
  chip,
}: {
  params: FeedParams
  viewerName: string | null
  /** The viewer's own photo (specs/auth design.md § 14). */
  viewerAvatarUrl?: string | null
  /** The community chip, streamed on its own (specs/feed-navigation § 2). */
  chip?: ReactNode
}) {
  return (
    <>
      {/* Filtered by a community (the chip): "Create" takes it along (specs/submit-page). */}
      <ComposerPlaceholder
        viewerName={viewerName}
        viewerAvatarUrl={viewerAvatarUrl}
        communitySlug={params.community}
      />
      <div className="px-2 pt-4 sm:px-0">
        {/* One line: the tabs, and at the right the order and the type (specs/feed-type-filter). */}
        <FeedTabs
          params={params}
          trailing={
            <FeedControls>
              <FeedSort params={params} />
              <FeedTypeMenu params={params} />
            </FeedControls>
          }
        />
        <FeedChipRow chip={chip} />
      </div>
    </>
  )
}

/** The feed box (dividers between cards) or its empty state. Pure render: the data comes in. */
export function FeedListView({
  params,
  state,
  communityHandle,
  pagePath,
}: {
  params: FeedParams
  state: FeedState
  /** $BTC or #defi, for the empty state of a community page. */
  communityHandle?: string
  /** A community page: its empty states link back to it (specs/feed-type-filter FT-08). */
  pagePath?: string
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
          <EmptyFeed params={params} communityHandle={communityHandle} pagePath={pagePath} />
        ) : (
          <>
            <Impressions requestId={state.status === 'ok' ? state.requestId : null}>
              <ul className="divide-y">
                <FeedItems
                  items={items}
                  feedCommunity={params.community}
                  menus={Boolean(params.author)}
                />
              </ul>
            </Impressions>
            {state.status === 'ok' && state.nextCursor && (
              <LoadMore params={params} cursor={state.nextCursor} />
            )}
          </>
        )}
      </div>
    </>
  )
}

const ACTION = ACTION_PILL

/** The order and the type beside the tabs, named as a group ("Filters"). */
function FeedControls({ children }: { children: ReactNode }) {
  const t = useTranslations('feed.filters')
  return (
    <div role="group" aria-label={t('label')} className="flex items-center gap-1">
      {children}
    </div>
  )
}

const TYPE_ICONS = {
  posts: <PenLineIcon />,
  theses: <TargetIcon />,
  polls: <ChartBarIcon />,
} as const

function EmptyFeed({
  params,
  communityHandle,
  pagePath,
}: {
  params: FeedParams
  communityHandle?: string
  pagePath?: string
}) {
  const t = useTranslations('feed.empty')

  // Nothing of that type (FT-08): back to all.
  if (params.type !== 'all') {
    return (
      <EmptyState
        icon={TYPE_ICONS[params.type]}
        title={t(params.type)}
        action={
          <Link href={feedHref({ ...params, type: 'all' }, pagePath)} className={ACTION}>
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
      action={<ComposeTrigger className={ACTION}>{t('createPost')}</ComposeTrigger>}
    />
  )
}
