import { RecentlyViewedSlot } from './recently-viewed-slot'
import { SeasonTokensTeaser } from './season-tokens-teaser'
import { SiteFooter } from './site-footer'

/**
 * The content of the right column (specs/right-column): the season tokens, then "Recently viewed"
 * (specs/recently-viewed), which arrives after the page loads and so goes below.
 * The footer sits at the bottom of the column, whatever the cards above take. The invitation to
 * join moved to the left column (specs/guest-sidebar GS-05).
 */
export function RightColumn() {
  return (
    <div className="flex min-h-full flex-col">
      <SeasonTokensTeaser />
      <RecentlyViewedSlot />
      <SiteFooter className="mt-auto" />
    </div>
  )
}
