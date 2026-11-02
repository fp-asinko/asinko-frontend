'use client'

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'

/** One level: its value and what it is called. */
export type Level<Value extends string> = { value: Value; label: string }

/** The prototype's bars: 16px wide, 20 to 38px tall. Written out: Tailwind only builds what it reads. */
const HEIGHTS = ['h-5', 'h-6.5', 'h-8', 'h-9.5'] as const

/**
 * The scale, green to red: every filled bar takes the chosen level's, the chosen one too (the
 * radio paints it --primary when checked).
 */
const FILLS = [
  'bg-level-1 dark:bg-level-1 data-checked:bg-level-1 dark:data-checked:bg-level-1',
  'bg-level-2 dark:bg-level-2 data-checked:bg-level-2 dark:data-checked:bg-level-2',
  'bg-level-3 dark:bg-level-3 data-checked:bg-level-3 dark:data-checked:bg-level-3',
  'bg-level-4 dark:bg-level-4 data-checked:bg-level-4 dark:data-checked:bg-level-4',
] as const

/**
 * A level chosen on rising bars, as the prototype's conviction (specs/thesis-create TC-25): a radio
 * group (one Tab stop, the arrows to move), each bar one option. The bars fill up to the chosen
 * one in its color, from green to red (the riskiest; the last level is always red). Beside them, the chosen level's name, or `prompt`:
 * color is never the only signal.
 */
export function LevelBars<Value extends string>({
  id,
  labelledBy,
  describedBy,
  levels,
  value,
  onChange,
  prompt,
  invalid = false,
  required = false,
}: {
  id?: string
  /** The id of the visible label that names the group. */
  labelledBy: string
  describedBy?: string
  /** Up to four, the lowest first. */
  levels: readonly Level<Value>[]
  value: Value | undefined
  onChange: (value: Value) => void
  /** What the name says while none is chosen. */
  prompt: string
  invalid?: boolean
  required?: boolean
}) {
  const chosen = levels.findIndex((level) => level.value === value)
  // Fewer than four levels end on red too.
  const fill = FILLS[chosen + FILLS.length - levels.length]

  return (
    <div className="flex items-end gap-3">
      <RadioGroup
        id={id}
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        aria-required={required || undefined}
        value={value ?? null}
        onValueChange={(next) => onChange(next as Value)}
        // 8px apart: each bar takes 24px to the touch (WCAG 2.5.8) without overlapping the next.
        className="flex w-auto items-end gap-2"
      >
        {levels.map((level, index) => (
          <RadioGroupItem
            key={level.value}
            value={level.value}
            aria-label={level.label}
            className={cn(
              // A bar, not a dot: the indicator inside is hidden, the fill says the choice.
              'aspect-auto w-4 rounded-[2px] border-0 bg-border-strong transition-colors duration-150 after:-inset-x-1 dark:bg-border-strong [&_[data-slot=radio-group-indicator]]:hidden',
              HEIGHTS[index],
              index <= chosen && fill,
              'data-checked:border-0',
              invalid && 'ring-2 ring-destructive/40',
            )}
          />
        ))}
      </RadioGroup>
      <span
        className={cn(
          'type-action whitespace-nowrap',
          chosen === -1 ? 'font-normal text-muted-foreground' : 'text-foreground',
        )}
      >
        {chosen === -1 ? prompt : levels[chosen]!.label}
      </span>
    </div>
  )
}
