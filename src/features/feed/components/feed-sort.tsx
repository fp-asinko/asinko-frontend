import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { feedHref } from '../lib/feed-href'
import type { FeedParams } from '../schemas/feed-params.schema'

/**
 * The feed's order (specs/feed-type-filter FT-09): New, the only one until the backend sorts the
 * feed (Hot and Top then). A link, active.
 */
export function FeedSort({ params, pagePath }: { params: FeedParams; pagePath?: string }) {
  const t = useTranslations('feed.filters')
  return (
    <Link
      href={feedHref({ ...params, filter: 'new' }, pagePath)}
      aria-current="page"
      // In a phone it hides: the only order, always on, and the row keeps one line (FT-02).
      className="hidden h-8 shrink-0 tap items-center rounded-full bg-muted px-3.5 type-action font-medium text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:inline-flex"
    >
      {t('new')}
    </Link>
  )
}
