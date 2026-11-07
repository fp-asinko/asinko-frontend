/**
 * A field in its own box, as the forms that create something use it (specs/submit-form-layout
 * SF-03, specs/community-create): filled and without a line (PO, 2026-11-05: cleaner). The gray
 * says where to write, and the border shows only while writing, or in red with an error.
 */
export const FIELD_BOX =
  'rounded-2xl border border-transparent bg-surface px-4 text-base shadow-none transition-colors duration-150 focus-visible:border-foreground/60 focus-visible:ring-0 aria-invalid:border-destructive aria-invalid:ring-0 md:text-base dark:bg-surface dark:aria-invalid:ring-0'
