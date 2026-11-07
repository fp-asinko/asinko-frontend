import { CheckIcon, XIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import type { ThesisStateName } from './thesis-summary.types'

/** The state's chip: the accuracy tints for the resolved ones, gray for the rest (PT-07). */
const STATE_CLASSES: Record<ThesisStateName, string> = {
  open: 'bg-muted text-foreground',
  correct: 'bg-thesis-correct text-thesis-correct-foreground',
  incorrect: 'bg-thesis-incorrect text-thesis-incorrect-foreground',
  disputed: 'bg-thesis-disputed text-thesis-disputed-foreground',
  expired: 'bg-muted text-muted-foreground',
  cancelled: 'bg-muted text-muted-foreground',
}

/**
 * A thesis's state (specs/profile-track-record PT-07): ✓ or ✗ with its name, never the color alone.
 * Shared by the profile's card, a featured one (specs/profile-showcase PS-05) and the feed's
 * (specs/thesis-detail TD-03).
 */
export function ThesisState({
  state,
  onSurface = false,
}: {
  state: ThesisStateName
  /**
   * On a `bg-surface` panel (the ticket): the gray pill would melt into it, so the gray ones go
   * white with a hairline, as a layer over the panel.
   */
  onSurface?: boolean
}) {
  const t = useTranslations('thesisSummary')
  return (
    <span
      data-state={state}
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 type-meta font-bold',
        STATE_CLASSES[state],
        onSurface &&
          STATE_CLASSES[state].startsWith('bg-muted') &&
          'bg-background ring-1 ring-border ring-inset',
      )}
    >
      {state === 'correct' && <CheckIcon aria-hidden className="size-3.5" />}
      {state === 'incorrect' && <XIcon aria-hidden className="size-3.5" />}
      {t(`state.${state}`)}
    </span>
  )
}
