import { useTranslations } from 'next-intl'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * A person's theses while the first page arrives (specs/profile-track-record PT-06): three cards'
 * shapes and a status that screen readers announce, as the feed's.
 */
export function ThesesListSkeleton() {
  const t = useTranslations('common')

  return (
    <div>
      <p role="status" className="sr-only">
        {t('loading')}
      </p>
      <div aria-hidden data-testid="theses-skeleton" className="divide-y">
        {[0, 1, 2].map((row) => (
          <div key={row} className="flex flex-col gap-2.5 px-4 py-4.5 md:px-0">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4.5 w-4/5" />
            <Skeleton className="h-3.5 w-3/5" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
    </div>
  )
}
