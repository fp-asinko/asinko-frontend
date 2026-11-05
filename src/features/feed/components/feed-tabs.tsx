import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { ComingSoon } from '@/components/molecules/coming-soon'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import { feedHref } from '../lib/feed-href'
import type { FeedParams } from '../schemas/feed-params.schema'

/**
 * For you · Following · Live (H-10), underlined like the prototype. Links, not an ARIA tab widget:
 * they navigate, can be shared and need no JavaScript. Live (phase 3) is coming soon. On the same
 * line, at the right, `trailing`: the order and the type (specs/feed-type-filter FT-01).
 */
export function FeedTabs({ params, trailing }: { params: FeedParams; trailing?: ReactNode }) {
  const t = useTranslations('feed.tabs')
  const tabs = [
    { feed: 'for-you', label: t('forYou') },
    { feed: 'following', label: t('following') },
  ] as const

  return (
    <div className="mb-4 flex items-center gap-2">
      <nav aria-label={t('label')} className="flex min-w-0 gap-1">
        {tabs.map((tab) => {
          const active = params.feed === tab.feed
          return (
            <Link
              key={tab.feed}
              href={feedHref({ ...params, feed: tab.feed })}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative px-3 py-3 type-ui font-semibold whitespace-nowrap transition-colors duration-150 ease-out outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:px-4',
                active
                  ? "text-foreground after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:animate-underline-in after:bg-foreground after:content-['']"
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
            </Link>
          )
        })}
        <ComingSoon
          label={t('live')}
          className="inline-flex items-center gap-1.5 px-3 py-3 type-ui font-semibold whitespace-nowrap text-muted-foreground sm:px-4"
        >
          <span aria-hidden className="relative size-1.5">
            <span className="absolute inset-0 animate-live-pulse rounded-full bg-bearish" />
            <span className="relative block size-1.5 rounded-full bg-bearish" />
          </span>
          {t('live')}
        </ComingSoon>
      </nav>
      {trailing && <div className="ml-auto flex shrink-0 items-center gap-1">{trailing}</div>}
    </div>
  )
}
