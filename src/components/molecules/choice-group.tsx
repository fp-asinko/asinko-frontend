'use client'

import { cva } from 'class-variance-authority'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'

/** A pill: 40px tall, or 32px for many short options (a deadline's shortcuts). */
const pill = cva(
  'inline-flex tap cursor-pointer items-center rounded-full bg-muted type-action text-foreground hover:bg-muted-hover has-data-checked:bg-primary has-data-checked:text-primary-foreground has-focus-visible:ring-3 has-focus-visible:ring-ring/50',
  {
    variants: {
      size: {
        // A comfortable target (WCAG 2.5.8 asks 24px), with the radio's dot.
        md: 'h-10 gap-2 px-4',
        // Only the name: the black pill says which one is chosen.
        sm: 'h-8 px-3 [&_[data-slot=radio-group-item]]:sr-only',
      },
    },
    defaultVariants: { size: 'md' },
  },
)

/** One option: its value and what it says. */
export type Choice<Value extends string> = { value: Value; label: string }

/**
 * A few options as gray pills, one chosen (specs/thesis-create TC-05, TC-07): a radio group,
 * one Tab stop and the arrows to move, with the radio's dot inside each pill. The chosen one goes
 * black, as the main pills (design-system.md § Píldora gris).
 */
export function ChoiceGroup<Value extends string>({
  id,
  labelledBy,
  describedBy,
  options,
  value,
  onChange,
  invalid = false,
  required = false,
  size = 'md',
}: {
  id?: string
  /** The id of the visible label that names the group. */
  labelledBy: string
  describedBy?: string
  options: readonly Choice<Value>[]
  value: Value | undefined
  onChange: (value: Value) => void
  invalid?: boolean
  /** One has to be chosen: said to assistive technology. */
  required?: boolean
  size?: 'md' | 'sm'
}) {
  return (
    <RadioGroup
      id={id}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      aria-required={required || undefined}
      // Empty is "none chosen yet": Base UI takes null for it.
      value={value ?? null}
      onValueChange={(next) => onChange(next as Value)}
      className={cn('flex flex-wrap', size === 'sm' ? 'gap-1.5' : 'gap-2')}
    >
      {options.map((option) => (
        <label
          key={option.value}
          // The focus ring on the whole pill: the dot alone is too small to show it (on black too).
          className={cn(pill({ size }), invalid && 'ring-2 ring-destructive/40')}
        >
          <RadioGroupItem
            value={option.value}
            // On the black pill, the dot inverts with it.
            className="focus-visible:ring-0 data-checked:border-primary-foreground"
          />
          {option.label}
        </label>
      ))}
    </RadioGroup>
  )
}
