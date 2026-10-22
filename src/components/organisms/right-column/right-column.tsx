import type { ReactNode } from 'react'
import { SiteFooter } from './site-footer'

/**
 * The right column (specs/right-column): what the page brings, then the footer at its bottom,
 * whatever the cards above take. Each page brings what speaks of it (specs/community-widgets
 * CW-02, CW-03): the Home, the season tokens and "Recently viewed"; a group, its widgets; a
 * profile, its card. Without anything, only the footer.
 */
export function RightColumn({ children }: { children?: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      {/* Air between the last card and the footer's line, and under the footer: the column ends
          at the bottom of the screen (StickyColumn, PO 2026-10-21). */}
      <div className="pb-3.5">{children}</div>
      <SiteFooter className="mt-auto pb-6" />
    </div>
  )
}
