import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/** A section's title and its chevron, the size of SidebarSection's trigger. */
function Head() {
  return (
    <div className="flex min-h-6 items-center justify-between px-1 py-1">
      <Skeleton className="h-2.5 w-14" />
      <Skeleton className="size-3 rounded-sm" />
    </div>
  )
}

/** A community's row: its square avatar, its name and a line under it (groups, suggested). */
function CommunityRow({ name = 'w-24', line = 'w-32' }: { name?: string; line?: string }) {
  return (
    <div className="flex items-center gap-2 px-1 py-1.5">
      <Skeleton className="size-8 shrink-0 rounded-md" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Skeleton className={cn('h-3.5', name)} />
        <Skeleton className={cn('h-3', line)} />
      </div>
    </div>
  )
}

/**
 * The left column while its data loads (specs/feed-navigation FN-08), with the shape of the
 * signed-in column (specs/sidebar-fill): groups, people, assets as rows, and
 * suggested at the bottom. The page, the bar and a language switch never wait for the column.
 * Decorative: the feed's own status announces the loading.
 */
export function InterestsSkeleton() {
  return (
    <div aria-hidden data-testid="interests-skeleton" className="flex flex-col md:h-full">
      <Skeleton className="mx-1 mt-1 mb-3 h-3 w-28" />

      <div data-section="groups" className="mb-4">
        <Head />
        <div className="flex flex-col gap-0.5 py-1">
          <CommunityRow name="w-20" line="w-32" />
          <CommunityRow name="w-14" line="w-36" />
          <CommunityRow name="w-20" line="w-28" />
        </div>
      </div>

      <div data-section="people" className="mb-4">
        <Head />
        <div className="flex flex-col gap-0.5 py-1">
          {['w-24', 'w-20', 'w-16'].map((width) => (
            <div key={width} className="flex min-h-10 items-center gap-2 px-1 py-1">
              <Skeleton className="size-8 shrink-0 rounded-full" />
              <Skeleton className={cn('h-3.5', width)} />
            </div>
          ))}
        </div>
      </div>

      <div data-section="assets" className="mb-4">
        <Head />
        {/* The real row's geometry (32px, gap-0.5), so the data lands with no layout shift. */}
        <div className="flex flex-col gap-0.5 py-1">
          {[0, 1, 2, 3, 4].map((row) => (
            <div key={row} className="flex min-h-8 items-center gap-2 px-1 py-1">
              <Skeleton className="size-6 shrink-0 rounded-full" />
              <Skeleton className="h-3.5 w-12" />
              <Skeleton className="ml-auto h-3 w-12" />
              <Skeleton className="h-3 w-10" />
            </div>
          ))}
        </div>
      </div>

      {/* Suggested at the bottom, as the column (PO, 2026-11-10). */}
      <div data-section="suggested" className="flex flex-col md:flex-1 md:justify-end">
        <hr className="mx-1 mb-6 shrink-0 border-border/60" />
        <Head />
        <div className="flex flex-col py-1">
          <CommunityRow name="w-16" line="w-32" />
          <CommunityRow name="w-20" line="w-28" />
          <CommunityRow name="w-24" line="w-32" />
        </div>
      </div>
    </div>
  )
}
