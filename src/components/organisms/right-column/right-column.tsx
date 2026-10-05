import { JoinCard } from './join-card'
import { SeasonTokensTeaser } from './season-tokens-teaser'
import { SiteFooter } from './site-footer'

/**
 * The content of the right column (specs/right-column): "Recently viewed" waits for post-detail.
 * The footer sits at the bottom of the column, whatever the cards above take.
 */
export function RightColumn({ signedIn }: { signedIn: boolean }) {
  return (
    <div className="flex min-h-full flex-col">
      {!signedIn && <JoinCard />}
      <SeasonTokensTeaser />
      <SiteFooter className="mt-auto" />
    </div>
  )
}
