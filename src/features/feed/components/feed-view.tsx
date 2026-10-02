import { useTranslations } from 'next-intl'
import { EmptyState } from '@/components/organisms/empty-state'
import { Link } from '@/i18n/navigation'
import type { CommunityRef, FeedItem } from '../feed.types'
import { feedHref } from '../lib/feed-href'
import type { FeedParams } from '../schemas/feed-params.schema'
import { ComposerPlaceholder } from './composer-placeholder'
import { FeedFilters } from './feed-filters'
import { FeedTabs } from './feed-tabs'
import { PollCard } from './poll-card'
import { PostCard } from './post-card'

export type FeedState =
  { status: 'ok'; items: FeedItem[]; community: CommunityRef | null } | { status: 'needs-account' }

/**
 * The center column as in the prototype (specs/home/design.md § 5): composer, tabs, filters and
 * the feed box (16px radius, dividers between cards). Pure render: the data comes in.
 */
export function FeedView({
  params,
  state,
  viewerName,
}: {
  params: FeedParams
  state: FeedState
  viewerName: string | null
}) {
  const t = useTranslations('feed.empty')
  const items = state.status === 'ok' ? state.items : []
  const community = state.status === 'ok' ? state.community : null

  return (
    <>
      <ComposerPlaceholder viewerName={viewerName} />
      <div className="px-2 pt-4 sm:px-0">
        <FeedTabs params={params} />
        <FeedFilters params={params} community={community} />
      </div>
      <div className="overflow-hidden border-y bg-card sm:rounded-2xl sm:border">
        {state.status === 'needs-account' ? (
          <EmptyState message={t('needAccount')} />
        ) : items.length === 0 ? (
          <EmptyFeed params={params} />
        ) : (
          <ul className="divide-y">
            {items.map((item) => (
              <li key={`${item.kind}-${item.id}`}>
                {item.kind === 'post' ? <PostCard post={item} /> : <PollCard poll={item} />}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}

function EmptyFeed({ params }: { params: FeedParams }) {
  const t = useTranslations('feed.empty')

  if (params.filter === 'polls') return <EmptyState message={t('polls')} />
  if (params.feed === 'following') {
    return (
      <EmptyState
        message={t('following')}
        action={
          <Link
            href={feedHref({ ...params, feed: 'for-you' })}
            className="rounded-full bg-primary px-4 py-2 type-action text-primary-foreground hover:bg-primary-hover"
          >
            {t('goForYou')}
          </Link>
        }
      />
    )
  }
  if (params.community) {
    return <EmptyState message={t('community', { handle: `#${params.community}` })} />
  }
  return <EmptyState message={t('forYou')} />
}
