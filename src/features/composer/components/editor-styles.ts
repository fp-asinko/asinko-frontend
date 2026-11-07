// The classes the post and thesis editors share (specs/submit-form-layout, specs/thesis-create).

/** A field in its own box (SF-03, SF-05): shared with the form that creates a group. */
export { FIELD_BOX } from '@/components/molecules/field-styles'

export const PILL =
  'inline-flex h-11 tap items-center justify-center rounded-full px-3 type-action font-bold outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-disabled:opacity-50 aria-disabled:active:scale-100 sm:px-4 md:h-9'

/** A field without its own box: the composer box around them is the box, as X. */
export const BARE =
  'h-auto rounded-none border-0 bg-transparent p-0 text-foreground shadow-none focus-visible:ring-0 aria-invalid:ring-0 dark:bg-transparent'

/**
 * Cancel and Publish, on the right (SF-06). In phones it sticks over the bottom bar while a long
 * text is written (specs/submit-tools ST-07), edge to edge; from md, in its place.
 */
export const ACTIONS_BAR =
  'sticky bottom-[calc(3.5625rem+env(safe-area-inset-bottom))] z-10 -mx-4 mt-4 flex items-center justify-end border-t bg-background px-4 py-3 md:static md:mx-0 md:px-0 md:pt-4 md:pb-0'
