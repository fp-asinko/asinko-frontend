'use client'

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'

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
}: {
  id?: string
  /** The id of the visible label that names the group. */
  labelledBy: string
  describedBy?: string
  options: readonly Choice<Value>[]
  value: Value | undefined
  onChange: (value: Value) => void
  invalid?: boolean
}) {
  return (
    <RadioGroup
      id={id}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      // Empty is "none chosen yet": Base UI takes null for it.
      value={value ?? null}
      onValueChange={(next) => onChange(next as Value)}
      className="flex flex-wrap gap-2"
    >
      {options.map((option) => (
        <label
          key={option.value}
          className={cn(
            // 40px tall: a comfortable target (WCAG 2.5.8 asks 24).
            'inline-flex h-10 tap cursor-pointer items-center gap-2 rounded-full bg-muted px-4 type-action text-foreground hover:bg-muted-hover',
            'has-data-checked:bg-primary has-data-checked:text-primary-foreground',
            invalid && 'ring-2 ring-destructive/40',
          )}
        >
          <RadioGroupItem
            value={option.value}
            // On the black pill, the dot inverts with it.
            className="data-checked:border-primary-foreground"
          />
          {option.label}
        </label>
      ))}
    </RadioGroup>
  )
}
