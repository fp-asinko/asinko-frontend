/**
 * A field in its own box, as the forms that create something use it (specs/submit-form-layout
 * SF-03, specs/community-create): filled and without a line (PO, 2026-11-05: cleaner). The gray
 * says where to write, and the border shows only while writing, or in red with an error.
 */
export const FIELD_BOX =
  'rounded-2xl border border-transparent bg-surface px-4 text-base shadow-none transition-colors duration-150 focus-visible:border-foreground/60 focus-visible:ring-0 aria-invalid:border-destructive aria-invalid:ring-0 md:text-base dark:bg-surface dark:aria-invalid:ring-0'

/**
 * A form's actions, on the right (specs/submit-form-layout SF-06). In phones they stick over the
 * bottom bar while a long form is filled (specs/submit-tools ST-07), edge to edge; from md, in
 * their place. Goes with `data-sticky-actions`, which leaves their room when scrolling to a field.
 */
export const ACTIONS_BAR =
  'sticky bottom-[calc(3.5625rem+env(safe-area-inset-bottom))] z-10 -mx-4 mt-4 flex items-center justify-end border-t bg-background px-4 py-3 md:static md:mx-0 md:px-0 md:pt-4 md:pb-0'
