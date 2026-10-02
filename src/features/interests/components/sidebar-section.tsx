import { ChevronDownIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ComingSoon } from '@/components/molecules/coming-soon'
import { useId, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { SectionResult } from '../interests.types'

/**
 * Collapsible section of the column (prototype: 10px uppercase label + chevron, no dividers). A
 * native <details>: collapses without JavaScript and works with the keyboard. Shows the section's
 * own error (H-19). The <h2> lives outside the <summary> (a button for assistive tech, which may
 * drop a heading inside it), so the sections stay in the headings list.
 */
export function SidebarSection<T>({
  title,
  result,
  empty,
  moreLabel,
  className,
  children,
}: {
  title: string
  result: SectionResult<T[]>
  empty?: string
  /** Accessible name of the section's "more" link (coming soon, H-26), e.g. "More assets". */
  moreLabel?: string
  className?: string
  children: (data: T[]) => ReactNode
}) {
  const t = useTranslations('interests')
  const headingId = useId()

  return (
    <section aria-labelledby={headingId} className={cn('mb-0.5', className)}>
      <h2 id={headingId} className="sr-only">
        {title}
      </h2>
      <details open className="group">
        <summary className="flex min-h-6 cursor-pointer list-none items-center justify-between rounded-sm px-1 py-1 text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
          <span className="text-[0.625rem] leading-[1.4] font-bold tracking-[0.08em] uppercase">
            {title}
          </span>
          <ChevronDownIcon
            aria-hidden
            className="size-3 -rotate-90 transition-transform group-open:rotate-0 motion-reduce:transition-none"
            strokeWidth={2.5}
          />
        </summary>
        <div className="py-1">
          {!result.ok ? (
            <p className="px-1 type-meta text-muted-foreground">{t('error')}</p>
          ) : result.data.length === 0 && empty ? (
            <p className="px-1 type-meta text-muted-foreground">{empty}</p>
          ) : (
            <>
              {children(result.data)}
              {moreLabel && (
                <div className="mt-1 flex justify-end">
                  <ComingSoon
                    label={moreLabel}
                    placement="below-end"
                    className="h-6 rounded-sm px-1.5 text-[0.625rem] font-medium text-muted-foreground"
                  >
                    {t('more')}
                  </ComingSoon>
                </div>
              )}
            </>
          )}
        </div>
      </details>
    </section>
  )
}
