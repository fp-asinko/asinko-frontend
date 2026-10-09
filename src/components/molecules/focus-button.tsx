'use client'

import type { ReactNode } from 'react'

/** The black pill of an empty state's action: 44px in phones, 36 from md (specs/empty-states). */
export const ACTION_PILL =
  'inline-flex h-11 tap items-center rounded-full bg-primary px-4 type-action text-primary-foreground outline-none hover:bg-primary-hover focus-visible:ring-3 focus-visible:ring-ring/50 md:h-9'

/** A button that sends the focus to a field of the page, by its id: "Add a comment" (ES-02). */
export function FocusButton({ target, children }: { target: string; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={() => document.getElementById(target)?.focus()}
      className={ACTION_PILL}
    >
      {children}
    </button>
  )
}
