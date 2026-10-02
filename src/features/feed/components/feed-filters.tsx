import { XIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import type { CommunityRef } from '../feed.types'
import { feedHref } from '../lib/feed-href'
import type { FeedParams } from '../schemas/feed-params.schema'

/**
 * New · Polls pills (H-11, Q3) and, with ?community, a chip to remove that filter. Hot and Top
 * arrive when the backend can sort the feed.
 */
export function FeedFilters({
  params,
  community,
}: {
  params: FeedParams
  community: CommunityRef | null
}) {
  const t = useTranslations('feed')
  const filters = [
    { filter: 'new', label: t('filters.new') },
    { filter: 'polls', label: t('filters.polls') },
  ] as const

  return (
    <div className="mb-3 flex flex-wrap items-center gap-1.5">
      <nav aria-label={t('filters.label')} className="flex gap-1.5">
        {filters.map((filter) => {
          const active = params.filter === filter.filter
          return (
            <Link
              key={filter.filter}
              href={feedHref({ ...params, filter: filter.filter })}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'inline-flex h-8 items-center rounded-full px-3.5 type-action font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                active
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:bg-surface hover:text-foreground',
              )}
            >
              {filter.label}
            </Link>
          )
        })}
      </nav>
      {params.community && params.feed === 'for-you' && (
        <Link
          href={feedHref({ ...params, community: undefined })}
          aria-label={t('chip.remove', { handle: community?.handle ?? `#${params.community}` })}
          className="ml-auto inline-flex h-8 max-w-full min-w-0 items-center gap-1.5 rounded-full border px-3 type-action font-semibold outline-none hover:bg-surface focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span className="truncate">{community?.handle ?? `#${params.community}`}</span>
          <XIcon aria-hidden className="size-3.5 shrink-0" />
        </Link>
      )}
    </div>
  )
}
