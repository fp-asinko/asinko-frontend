import { PageColumns } from '@/components/organisms/app-shell'
import { Skeleton } from '@/components/ui/skeleton'
// By its path, not the feature's index: the index also brings the post page's client parts (seo.md).
import { FeedListSkeleton } from '@/features/feed/components/feed-list-skeleton'

// Skeleton of the Home with the feed's real proportions (composer, tabs, filters and cards): no CLS.
// Lives in the (main) group, not in [locale]: a loading boundary above [...rest] would stream a 200
// before notFound() runs, turning unknown URLs into soft 404s.
export default function Loading() {
  return (
    <PageColumns>
      <div aria-hidden>
        {/* Same boxes as ComposerPlaceholder, so the feed does not move when it arrives. */}
        <div className="border-b bg-card px-4 py-3.5 md:px-0">
          <div className="flex h-10.75 items-center gap-3">
            <Skeleton className="size-10 rounded-full" />
            <Skeleton className="h-5 w-48 rounded-md" />
          </div>
          <div className="mt-3 flex items-center gap-0.5 border-t pt-2.5">
            {[0, 1, 2, 3].map((action) => (
              <Skeleton key={action} className="size-9 rounded-full" />
            ))}
            <Skeleton className="ml-auto h-9 w-20 rounded-full" />
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
      </div>
      {/* The same list skeleton as a tab switch (specs/feed-navigation): one source, no drift.
          It carries the status screen readers announce. */}
      <FeedListSkeleton />
    </PageColumns>
  )
}
