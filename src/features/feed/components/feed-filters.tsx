import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import { feedHref } from '../lib/feed-href'
import type { FeedParams } from '../schemas/feed-params.schema'

/**
 * New · Polls pills (H-11, Q3) and, with ?community, the slot of the chip that removes that filter
 * (CommunityChip, streamed on its own: specs/feed-navigation § 2). Hot and Top arrive when the
 * backend can sort the feed.
 */
export function FeedFilters({
  params,
  chip,
  pagePath,
}: {
  params: FeedParams
  chip?: ReactNode
  /** On a community page, the filters stay on it (specs/community-pages CP-07). */
  pagePath?: string
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
              href={feedHref({ ...params, filter: filter.filter }, pagePath)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'inline-flex h-8 tap items-center rounded-full px-3.5 type-action font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
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
      {chip}
    </div>
  )
}
