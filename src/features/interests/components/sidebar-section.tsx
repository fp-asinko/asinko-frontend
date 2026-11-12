import { ChevronDownIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { MoreToggle } from '@/components/molecules/more-toggle'
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
  more = false,
  fill = false,
  action,
  className,
  children,
}: {
  title: string
  result: SectionResult<T[]>
  empty?: string
  /** The empty state's icon (specs/empty-states). */
  emptyIcon?: ReactNode
  /** "more" under its list, while some item is out of sight (specs/sidebar-more). */
  more?: boolean
  /**
   * At most the column's height left (specs/sidebar-fill SF-02): its own height while its list fits,
   * else it shrinks and its list shows only the items that fit whole. Its parent puts it at the bottom.
   */
  fill?: boolean
  /**
   * A control in the header, right after the title (e.g. "Create group"), so the chevrons of all
   * sections stay aligned. It is a sibling of the toggle, not inside it: a link cannot live inside
   * a button. Stays visible while collapsed.
   */
  action?: ReactNode
  className?: string
  /** The list, with the id "more" controls. */
  children: (data: T[], listId: string) => ReactNode
}) {
  const t = useTranslations('interests')
  const headingId = useId()
  const listId = useId()

  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        // `group/section`: its list shows everything while "more" is open (specs/sidebar-more).
        'group/section mb-4', // At least its title and one whole item: below it, the column scrolls (SF-04).
        fill && 'md:flex md:min-h-24 md:flex-col',
        className,
      )}
    >
      <h2 id={headingId} className="sr-only">
        {title}
      </h2>
      <Collapsible defaultOpen className={cn(fill && 'md:flex md:min-h-0 md:flex-col')}>
        <div className="group/head relative flex min-h-6 items-center gap-1 rounded-sm px-1 py-1 text-muted-foreground transition-colors duration-150 ease-out hover:text-foreground">
          {/* One real button stretched over the whole header: it keeps click, keyboard and focus,
              and its name is the title. The visible title and chevron are decoration over it. */}
          <CollapsibleTrigger className="absolute inset-0 cursor-pointer rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            <span className="sr-only">{title}</span>
          </CollapsibleTrigger>
          <span
            aria-hidden
            className="pointer-events-none relative text-[0.625rem] leading-[1.4] font-bold tracking-[0.08em] uppercase"
          >
            {title}
          </span>
          {/* Above the stretched trigger, so a click on it does not toggle. */}
          {action && <div className="relative z-10 -my-1">{action}</div>}
          <ChevronDownIcon
            aria-hidden
            className="pointer-events-none relative ml-auto size-3 -rotate-90 transition-transform duration-200 ease-out group-has-[[data-panel-open]]/head:rotate-0"
            strokeWidth={2.5}
          />
        </div>
        {/* Height from Base UI's --collapsible-panel-height: animates in every browser (S-01). */}
        <CollapsibleContent
          className={cn(
            'overflow-hidden transition-[height] duration-200 ease-out data-ending-style:h-0 data-ending-style:duration-150 data-starting-style:h-0',
            // Filling, at most the column's height left (no measured height to animate to).
            'h-(--collapsible-panel-height)',
            fill && 'md:h-auto md:min-h-0',
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
                {children(result.data, listId)}
                {more && (
                  <div className="mt-1 flex justify-end empty:hidden">
                    <MoreToggle
                      controls={listId}
                      section={title}
                      more={t('more')}
                      less={t('less')}
                    />
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
