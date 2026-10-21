import { ChevronDownIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ComingSoon } from '@/components/molecules/coming-soon'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useId, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { SectionResult } from '../interests.types'
import { CloudOffIcon } from 'lucide-react'
import { EmptyState } from '@/components/organisms/empty-state'

/**
 * Collapsible section of the column (prototype: 10px uppercase label + chevron, no dividers),
 * with shadcn's Collapsible so opening and closing animate their height in every browser (S-01).
 * Open by default, so before hydration it looks the same. Shows the section's own error (H-19).
 * The <h2> lives outside the trigger (a button, which may drop a heading inside it), so the
 * sections stay in the headings list.
 */
export function SidebarSection<T>({
  title,
  result,
  empty,
  emptyIcon,
  moreLabel,
  fill = false,
  className,
  children,
}: {
  title: string
  result: SectionResult<T[]>
  empty?: string
  /** The empty state's icon (specs/empty-states). */
  emptyIcon?: ReactNode
  /** Accessible name of the section's "more" link (coming soon, H-26), e.g. "More assets". */
  moreLabel?: string
  /** Takes the column's height left (specs/sidebar-fill SF-02): its list fills it. */
  fill?: boolean
  className?: string
  children: (data: T[]) => ReactNode
}) {
  const t = useTranslations('interests')
  const headingId = useId()

  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        'mb-4', // At least its title and one whole item: below it, the column scrolls (SF-04).
        fill && 'md:flex md:min-h-24 md:flex-1 md:flex-col',
        className,
      )}
    >
      <h2 id={headingId} className="sr-only">
        {title}
      </h2>
      <Collapsible defaultOpen className={cn(fill && 'md:flex md:min-h-0 md:flex-1 md:flex-col')}>
        <CollapsibleTrigger className="group flex min-h-6 w-full cursor-pointer items-center justify-between rounded-sm px-1 py-1 text-muted-foreground transition-colors duration-150 ease-out outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50">
          <span className="text-[0.625rem] leading-[1.4] font-bold tracking-[0.08em] uppercase">
            {title}
          </span>
          <ChevronDownIcon
            aria-hidden
            className="size-3 -rotate-90 transition-transform duration-200 ease-out group-data-panel-open:rotate-0"
            strokeWidth={2.5}
          />
        </CollapsibleTrigger>
        {/* Height from Base UI's --collapsible-panel-height: animates in every browser (S-01). */}
        <CollapsibleContent
          className={cn(
            'overflow-hidden transition-[height] duration-200 ease-out data-ending-style:h-0 data-ending-style:duration-150 data-starting-style:h-0',
            // Filling, its height is the column's left (no measured height to animate to).
            'h-(--collapsible-panel-height)',
            fill && 'md:h-auto md:min-h-0 md:flex-1',
          )}
        >
          <div className={cn('py-1', fill && 'md:h-full')}>
            {!result.ok ? (
              <EmptyState
                icon={<CloudOffIcon />}
                title={t('error')}
                size="inline"
                className="px-1"
              />
            ) : result.data.length === 0 && empty ? (
              <EmptyState icon={emptyIcon} title={empty} size="inline" className="px-1" />
            ) : (
              <>
                {children(result.data)}
                {moreLabel && (
                  <div className="mt-1 flex justify-end">
                    <ComingSoon
                      label={moreLabel}
                      placement="below-end"
                      className="h-6 tap rounded-sm px-1.5 text-[0.625rem] font-medium text-muted-foreground hover:text-foreground"
                    >
                      {t('more')}
                    </ComingSoon>
                  </div>
                )}
              </>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </section>
  )
}
