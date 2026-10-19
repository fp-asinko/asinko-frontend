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
    <div className="flex min-h-full flex-col">
      {children}
      <SiteFooter className="mt-auto" />
    </div>
  )
}
