import { CheckIcon, XIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ThesisTicketState } from '@/lib/theses/ticket.types'
import { cn } from '@/lib/utils'

/** Correct and incorrect in their tints, the rest in gray (TI-14): written whole for Tailwind. */
const STAMP_CLASSES: Record<Exclude<ThesisTicketState, 'open'>, string> = {
  correct: 'bg-thesis-correct text-thesis-correct-foreground',
  incorrect: 'bg-thesis-incorrect text-thesis-incorrect-foreground',
  disputed: 'bg-background text-muted-foreground',
  expired: 'bg-background text-muted-foreground',
  cancelled: 'bg-background text-muted-foreground',
}

/** A stamp's look, shared by the state's and the number's (specs/thesis-number TN-02). */
const STAMP =
  'inline-flex w-fit items-center gap-1 rounded-md border-2 border-current px-2 py-0.5 text-[0.6875rem] leading-[1.4] font-extrabold tracking-widest uppercase'

/**
 * A closed thesis's stamp (specs/thesis-identity TI-14, TI-15, Q3), as on a paid ticket: its state,
 * tilted, with ✓ or ✗. Decorative: "Result" already reads the state, so the screen reader skips it.
 * Open, none: the "Open" chip stays by the deadline. A Server Component.
 */
export function ThesisStamp({
  state,
  className,
}: {
  state: ThesisTicketState
  className?: string
}) {
  const t = useTranslations('thesisSummary')
  if (state === 'open') return null
  return (
    <span
      aria-hidden
      data-stamp={state}
      className={cn(STAMP, '-rotate-3 sm:-rotate-6', STAMP_CLASSES[state], className)}
    >
      {state === 'correct' && <CheckIcon className="size-3.5" strokeWidth={3} />}
      {state === 'incorrect' && <XIcon className="size-3.5" strokeWidth={3} />}
      {t(`state.${state}`)}
    </span>
  )
}

/**
 * The thesis's number among its author's (specs/thesis-number TN-01, TN-02): "#12" printed big and
 * faint on the ticket's lower stub, at its right, as a lottery ticket's serial (PO, 2026-11-06).
 * Behind the text: the stub's words and the state's stamp go over it. Drawn for the eye; `label`
 * says it to the screen reader ("Thesis number 12 by maria", TN-04). A Server Component.
 */
export function ThesisSerial({ number, label }: { number: number; label: string }) {
  return (
    <span data-number={number}>
      <span
        aria-hidden
        className="pointer-events-none absolute top-2 right-4 text-5xl leading-none font-black tracking-tight text-foreground/[0.07] tabular-nums select-none"
      >
        #{number}
      </span>
      <span className="sr-only">{label}</span>
    </span>
  )
}
