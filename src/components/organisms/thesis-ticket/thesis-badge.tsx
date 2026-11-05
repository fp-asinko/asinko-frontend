import { TargetIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

/**
 * THESIS (specs/thesis-ticket TK-01), in gray as a poll's POLL (PO, 2026-11-05: not in blue). The
 * ticket is what tells a thesis from a post. `iconOnly` keeps its word for screen readers.
 */
export function ThesisBadge({ iconOnly = false }: { iconOnly?: boolean }) {
  const t = useTranslations('thesisTicket')
  return (
    <span className="inline-flex min-h-6 shrink-0 items-center gap-1.25 type-action font-extrabold text-muted-foreground uppercase">
      <TargetIcon aria-hidden className="size-3.5" />
      <span className={cn(iconOnly && 'sr-only sm:not-sr-only')}>{t('badge')}</span>
    </span>
  )
}
