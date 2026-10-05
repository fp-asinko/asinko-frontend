import { useTranslations } from 'next-intl'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * The list while the feed loads (specs/feed-navigation FN-01, FN-03): the cards of loading.tsx
 * (same sizes, no CLS) and a status that screen readers announce.
 */
export function FeedListSkeleton() {
  const t = useTranslations('common')

  return (
    <div className="overflow-hidden bg-card">
      <p role="status" className="sr-only">
        {t('loading')}
      </p>
      <div aria-hidden data-testid="feed-skeleton" className="divide-y">
        {[0, 1, 2].map((item) => (
          <div key={item} className="flex flex-col gap-2.5 px-4 py-4.5 md:px-0 md:py-5.5">
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="mt-1 h-9.5 w-36 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
