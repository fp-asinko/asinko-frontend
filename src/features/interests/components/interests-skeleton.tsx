import { Skeleton } from '@/components/ui/skeleton'

/**
 * The left column while its data loads (specs/feed-navigation FN-08): rows the size of the
 * community suggestions, so the page, the bar and a language switch never wait for the column.
 * Decorative: the feed's own status announces the loading.
 */
export function InterestsSkeleton() {
  return (
    <div aria-hidden data-testid="interests-skeleton" className="flex flex-col">
      <Skeleton className="mx-1 mt-1 mb-3 h-3 w-24" />
      {[0, 1, 2, 3, 4, 5].map((row) => (
        <div key={row} className="flex items-center gap-2 px-0.5 py-1.5">
          <Skeleton className="size-8 shrink-0 rounded-md" />
          <div className="flex flex-1 flex-col gap-1">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  )
}
