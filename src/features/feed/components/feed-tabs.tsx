import { useTranslations } from 'next-intl'
import { ComingSoon } from '@/components/molecules/coming-soon'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import { feedHref } from '../lib/feed-href'
import type { FeedParams } from '../schemas/feed-params.schema'

/**
 * For you · Following · Live (H-10), underlined like the prototype. Links, not an ARIA tab widget:
 * they navigate, can be shared and need no JavaScript. Live (phase 3) is coming soon.
 */
export function FeedTabs({ params }: { params: FeedParams }) {
  const t = useTranslations('feed.tabs')
  const tabs = [
    { feed: 'para-ti', label: t('forYou') },
    { feed: 'siguiendo', label: t('following') },
  ] as const

  return (
    <nav aria-label={t('label')} className="mb-4 flex gap-1 border-b">
      {tabs.map((tab) => {
        const active = params.feed === tab.feed
        return (
          <Link
            key={tab.feed}
            href={feedHref({ ...params, feed: tab.feed })}
            aria-current={active ? 'page' : undefined}
            className={cn(
              '-mb-px border-b-2 px-4 py-3 type-ui font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
              active
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </Link>
        )
      })}
      <ComingSoon
        label={t('live')}
        className="inline-flex items-center gap-1.5 px-4 py-3 type-ui font-semibold text-muted-foreground"
      >
        <span aria-hidden className="size-1.5 rounded-full bg-bearish" />
        {t('live')}
      </ComingSoon>
    </nav>
  )
}
