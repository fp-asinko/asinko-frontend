import { getTranslations } from 'next-intl/server'
import { PageColumns } from '@/components/organisms/app-shell'
import { Skeleton } from '@/components/ui/skeleton'

// Skeleton of the Home with the feed's real proportions (composer, tabs, filters and cards): no CLS.
// Lives in the (main) group, not in [locale]: a loading boundary above [...rest] would stream a 200
// before notFound() runs, turning unknown URLs into soft 404s.
export default async function Loading() {
  const t = await getTranslations('common')

  return (
    <PageColumns>
      {/* The skeleton is decorative; screen readers get this status instead. */}
      <p role="status" className="sr-only">
        {t('loading')}
      </p>
      <div aria-hidden>
        {/* Same boxes as ComposerPlaceholder, so the feed does not move when it arrives. */}
        <div className="border-b bg-card px-4 py-3.5">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-full" />
            <Skeleton className="h-10.75 flex-1 rounded-full" />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-1 border-t pt-3">
            {[0, 1, 2].map((action) => (
              <Skeleton key={action} className="h-9 rounded-lg" />
            ))}
          </div>
        </div>
        <div className="px-2 pt-4 sm:px-0">
          <div className="mb-4 flex gap-6 border-b px-4 py-3">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
          <div className="mb-3 flex gap-2">
            <Skeleton className="h-8 w-14 rounded-full" />
            <Skeleton className="h-8 w-14 rounded-full" />
          </div>
        </div>
        <div className="divide-y overflow-hidden">
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
    </PageColumns>
  )
}
