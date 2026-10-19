import { CheckIcon, XIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import type { ThesisItem } from '../communities.types'

/** The state's chip: the accuracy tints for the resolved ones, gray for the rest (PT-07). */
const STATE_CLASSES: Record<ThesisItem['state'], string> = {
  open: 'bg-muted text-foreground',
  correct: 'bg-thesis-correct text-thesis-correct-foreground',
  incorrect: 'bg-thesis-incorrect text-thesis-incorrect-foreground',
  disputed: 'bg-thesis-disputed text-thesis-disputed-foreground',
  expired: 'bg-muted text-muted-foreground',
  cancelled: 'bg-muted text-muted-foreground',
}

/**
 * A thesis's state (specs/profile-track-record PT-07): ✓ or ✗ with its name, never the color alone.
 * Shared by its card and a featured one (specs/profile-showcase PS-05).
 */
export function ThesisState({ state }: { state: ThesisItem['state'] }) {
  const t = useTranslations('communities.theses')
  return (
    <span
      data-state={state}
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 type-meta font-bold',
        STATE_CLASSES[state],
      )}
    >
      {state === 'correct' && <CheckIcon aria-hidden className="size-3.5" />}
      {state === 'incorrect' && <XIcon aria-hidden className="size-3.5" />}
      {t(`state.${state}`)}
    </span>
  )
}
