import { ChevronDownIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import type { SectionResult } from '../interests.types'

/**
 * Collapsible section of the column (prototype: uppercase label + chevron). A native <details>:
 * collapses without JavaScript and works with the keyboard. Shows the section's own error (H-19).
 */
export function SidebarSection<T>({
  title,
  result,
  empty,
  children,
}: {
  title: string
  result: SectionResult<T[]>
  empty?: string
  children: (data: T[]) => ReactNode
}) {
  const t = useTranslations('interests')

  return (
    <details open className="group border-b border-border py-3 last:border-b-0">
      <summary className="flex min-h-9 cursor-pointer list-none items-center justify-between rounded-md px-1 text-section text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
        <h2>{title}</h2>
        <ChevronDownIcon
          aria-hidden
          className="size-4 transition-transform group-open:rotate-180 motion-reduce:transition-none"
        />
      </summary>
      <div className="mt-2">
        {!result.ok ? (
          <p className="px-1 text-meta text-muted-foreground">{t('error')}</p>
        ) : result.data.length === 0 && empty ? (
          <p className="px-1 text-meta text-muted-foreground">{empty}</p>
        ) : (
          children(result.data)
        )}
      </div>
    </details>
  )
}
