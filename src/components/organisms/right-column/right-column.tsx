import type { ReactNode } from 'react'
import { RecentlyViewedSlot } from './recently-viewed-slot'
import { SeasonTokensTeaser } from './season-tokens-teaser'
import { SiteFooter } from './site-footer'

/**
 * The content of the right column (specs/right-column): the season tokens, then "Recently viewed"
 * (specs/recently-viewed), which arrives after the page loads and so goes below.
 * The footer sits at the bottom of the column, whatever the cards above take. The invitation to
 * join moved to the left column (specs/guest-sidebar GS-05). A page can lead with its own card
 * instead of the season tokens: a profile, its person's card (specs/profile-aside PA-01).
 */
export function RightColumn({ lead }: { lead?: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      {lead ?? <SeasonTokensTeaser />}
      <RecentlyViewedSlot />
      <SiteFooter className="mt-auto" />
    </div>
  )
}
