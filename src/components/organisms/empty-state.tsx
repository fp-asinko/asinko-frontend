import { cva } from 'class-variance-authority'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

const layout = cva('flex animate-fade-in flex-col items-center text-center', {
  variants: {
    size: {
      // The page's main content: centered, with air.
      page: 'gap-3 px-6 py-12',
      // A section or a column: compact.
      section: 'gap-2 px-4 py-6',
      // Narrow places (the left column, a card's comments): the icon beside the text.
      inline: 'flex-row items-start gap-2.5 py-1 text-left',
    },
  },
})

const circle = cva(
  'flex shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground',
  {
    variants: {
      size: {
        page: 'size-16 [&_svg]:size-8',
        section: 'size-10 [&_svg]:size-5',
        inline: 'size-8 [&_svg]:size-4',
      },
    },
  },
)

/**
 * A list with nothing in it, or that could not load (specs/empty-states ES-01, ES-03): an icon in
 * a gray circle (decorative), a title that says what happens, a description and, when there is
 * one, what to do. No business logic: the texts and the action come translated.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  size = 'page',
  className,
}: {
  /** A lucide icon: drawn in the circle, hidden from screen readers. */
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  size?: 'page' | 'section' | 'inline'
  className?: string
}) {
  return (
    <div className={cn(layout({ size }), className)}>
      {icon && (
        <span aria-hidden className={circle({ size })}>
          {icon}
        </span>
      )}
      <div
        className={cn(
          'flex max-w-xs flex-col',
          size === 'inline' ? 'min-h-8 justify-center gap-0.5' : 'gap-1',
        )}
      >
        <p className={size === 'inline' ? 'type-meta font-semibold' : 'type-ui font-bold'}>
          {title}
        </p>
        {description && (
          <p
            className={cn(size === 'inline' ? 'type-meta' : 'type-small', 'text-muted-foreground')}
          >
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}
