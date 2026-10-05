import { SeasonTokensTeaser } from './season-tokens-teaser'
import { SiteFooter } from './site-footer'

/**
 * The content of the right column (specs/right-column): "Recently viewed" waits for post-detail.
 * The footer sits at the bottom of the column, whatever the cards above take. The invitation to
 * join moved to the left column (specs/guest-sidebar GS-05).
 */
export function RightColumn() {
  return (
    <div className="flex min-h-full flex-col">
      <SeasonTokensTeaser />
      <SiteFooter className="mt-auto" />
    </div>
  )
}
