import { PageColumns } from '@/components/organisms/app-shell'
import { Skeleton } from '@/components/ui/skeleton'

// Skeleton of the center column with the final proportions (no CLS). The shell stays rendered.
// Lives in the (main) group, not in [locale]: a loading boundary above [...rest] would stream a 200
// before notFound() runs, turning unknown URLs into soft 404s.
export default function Loading() {
  return (
    <PageColumns>
      <div aria-hidden className="flex flex-col gap-4">
        <Skeleton className="h-9 w-40" />
        {[0, 1, 2].map((item) => (
          <Skeleton key={item} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    </PageColumns>
  )
}
