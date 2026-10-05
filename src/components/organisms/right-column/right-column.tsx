import { JoinCard } from './join-card'
import { SeasonTokensTeaser } from './season-tokens-teaser'
import { SiteFooter } from './site-footer'

/** The content of the right column (specs/right-column): "Recently viewed" waits for post-detail. */
export function RightColumn({ signedIn }: { signedIn: boolean }) {
  return (
    <>
      {!signedIn && <JoinCard />}
      <SeasonTokensTeaser />
      <SiteFooter />
    </>
  )
}
