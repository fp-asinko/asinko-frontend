import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * A card of the right column, as Reddit's sidebar blocks (specs/community-widgets): a section named
 * by its title, an optional action on its right (a pencil, "Edit widgets") and what it holds. The
 * same box as the profile's card: bordered, without shadow.
 */
export function AsideCard({
  id,
  title,
  action,
  children,
  className,
}: {
  /** Its title's id: unique in the page (a group's widgets can show twice, phone and column). */
  id: string
  title: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section
      aria-labelledby={id}
      className={cn('rounded-xl border bg-card px-3.5 py-3.5 wrap-anywhere', className)}
    >
      <div className="flex min-h-6 items-center justify-between gap-2">
        <h2 id={id} className="min-w-0 type-small font-bold">
          {title}
        </h2>
        {action}
      </div>
      <div className="mt-2">{children}</div>
    </section>
  )
}
