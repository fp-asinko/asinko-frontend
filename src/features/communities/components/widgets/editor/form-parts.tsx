'use client'

import { PlusIcon, XIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { FieldError } from '@/components/ui/field'

/** A key of the widget schemas (communities.widgets.errors.x) as the editor's message. */
export function useWidgetError() {
  const t = useTranslations('communities.widgets')
  return (key: string | undefined) =>
    key?.startsWith('communities.widgets.errors.')
      ? t(key.replace('communities.widgets.', '') as 'errors.invalid')
      : undefined
}

/**
 * One item of a list in a widget's form (a rule, a button, an event, an image): its fields in a
 * bordered box under its name, and × to take it out.
 */
export function ListItem({
  legend,
  removeLabel,
  onRemove,
  children,
}: {
  legend: string
  removeLabel: string
  onRemove?: () => void
  children: ReactNode
}) {
  return (
    // The legend first, as the fieldset's name; × in the corner, over the box.
    <fieldset data-item className="relative flex flex-col gap-3 rounded-lg border p-3">
      <legend className="float-left min-h-6 pr-10 type-meta font-semibold text-muted-foreground">
        {legend}
      </legend>
      {onRemove && (
        <button
          type="button"
          aria-label={removeLabel}
          onClick={onRemove}
          className="absolute top-1.5 right-1.5 inline-flex size-9 tap items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <XIcon aria-hidden className="size-4" />
        </button>
      )}
      {children}
    </fieldset>
  )
}

/**
 * After an item of a list is taken out, the focus goes on (WCAG 2.4.3): to the first field of the
 * one that takes its place, the one before, or "Add…". After the list is drawn again.
 */
export function focusAfterRemove(form: HTMLElement | null, index: number, addId: string) {
  requestAnimationFrame(() => {
    const items = form?.querySelectorAll<HTMLElement>('fieldset[data-item]') ?? []
    const item = items[index] ?? items[index - 1]
    const target =
      item?.querySelector<HTMLElement>('input, textarea') ?? document.getElementById(addId)
    target?.focus()
  })
}

/**
 * "Add rule", "Add button"…: a gray pill, gone at the list's limit. `pending` keeps it (and the
 * focus on it) while what it adds is on its way, saying so.
 */
export function AddItem({
  id,
  onClick,
  pending = false,
  children,
}: {
  id?: string
  onClick: () => void
  pending?: boolean
  children: ReactNode
}) {
  return (
    <button
      id={id}
      type="button"
      aria-disabled={pending || undefined}
      onClick={() => !pending && onClick()}
      className="inline-flex h-10 w-fit tap items-center gap-1.5 rounded-full bg-muted px-3.5 type-action outline-none hover:bg-muted-hover focus-visible:ring-3 focus-visible:ring-ring/50 aria-disabled:opacity-60 aria-disabled:active:scale-100 md:h-9"
    >
      {!pending && <PlusIcon aria-hidden className="size-4" />}
      {children}
    </button>
  )
}

/** What is wrong with a list as a whole ("Add at least one"). */
export function ListError({ message }: { message?: string }) {
  if (!message) return null
  return <FieldError className="type-meta">{message}</FieldError>
}
