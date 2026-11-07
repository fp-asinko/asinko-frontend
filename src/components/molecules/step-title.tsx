import { CheckIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * A form's step title (specs/thesis-form-steps FS-08, FS-09): its number in a circle, or ✓ once
 * done, then its name. Screen readers hear "Step 1 of 6" before the name, and whether it is done:
 * never the check alone. Goes inside the field's label, so the field keeps the name as its own.
 */
export function StepTitle({
  n,
  total,
  done = false,
  children,
}: {
  n: number
  total: number
  done?: boolean
  children: ReactNode
}) {
  const t = useTranslations('common.steps')
  return (
    <span className="inline-flex items-center gap-2">
      <span
        aria-hidden
        className={cn(
          'relative inline-flex size-5 shrink-0 items-center justify-center rounded-full type-caption font-bold tabular-nums transition-colors duration-150',
          done
            ? 'bg-primary text-primary-foreground'
            : 'border border-border-strong text-muted-foreground',
        )}
      >
        {/* The number stays, hidden under the ✓: its text gives the circle the same baseline
            done or not, so the title's row does not move as the step fills (PO 2026-11-06). */}
        <span className={cn(done && 'invisible')}>{n}</span>
        {done && <CheckIcon className="absolute size-3" strokeWidth={3} />}
      </span>
      <span className="sr-only">{t(done ? 'stepDone' : 'step', { n, total })}</span> {children}
    </span>
  )
}
