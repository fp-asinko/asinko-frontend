// The classes the post and thesis editors share (specs/submit-form-layout, specs/thesis-create).

/** A field in its own box (SF-03, SF-05): shared with the form that creates a group. */
export { FIELD_BOX } from '@/components/molecules/field-styles'

export const PILL =
  'inline-flex h-11 tap items-center justify-center rounded-full px-3 type-action font-bold outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-disabled:opacity-50 aria-disabled:active:scale-100 sm:px-4 md:h-9'

/** A field without its own box: the composer box around them is the box, as X. */
export const BARE =
  'h-auto rounded-none border-0 bg-transparent p-0 text-foreground shadow-none focus-visible:ring-0 aria-invalid:ring-0 dark:bg-transparent'

/** Cancel and Publish, on the right (SF-06), sticky in phones (ST-07): shared with the group form. */
export { ACTIONS_BAR } from '@/components/molecules/field-styles'
