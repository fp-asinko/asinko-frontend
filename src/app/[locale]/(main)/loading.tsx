import { getTranslations } from 'next-intl/server'
import { PageColumns } from '@/components/organisms/app-shell'
import { Skeleton } from '@/components/ui/skeleton'

// Skeleton of the center column with the final proportions (no CLS). The shell stays rendered.
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
      <div aria-hidden className="flex flex-col gap-4">
        <Skeleton className="h-9 w-40" />
        {[0, 1, 2].map((item) => (
          <Skeleton key={item} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    </PageColumns>
  )
}
