import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Center column of a page: up to 780px (48.75rem) as in the prototype, centered. Under a hero
 * (PageHero), from lg, it takes the center of the second row (specs/community-widgets CW-01).
 * There <main> spans both columns, so its padding no longer parts the center from the right
 * column: the center keeps its own 16px gap, as without a hero.
 */
export function PageColumns({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'mx-auto w-full max-w-195 min-w-0 lg:col-start-1 lg:row-start-2 lg:group-has-[main>[data-hero]]/row:pr-4',
        className,
      )}
    >
      {children}
    </div>
  )
}

/**
 * The top of a page over both columns, from lg, as a Reddit group's banner (specs/community-widgets
 * CW-01): the shell puts it in the first row, the center column and the right one under it. Under
 * lg there is no right column: it is the top of the page, as before. It stays inside <main>.
 */
export function PageHero({ children }: { children: ReactNode }) {
  return (
    <div data-hero className="min-w-0 lg:col-start-1 lg:col-end-3 lg:row-start-1">
      {children}
    </div>
  )
}
