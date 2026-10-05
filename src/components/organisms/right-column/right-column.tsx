import { SeasonTokensTeaser } from './season-tokens-teaser'
import { SiteFooter } from './site-footer'

/** The content of the right column (specs/right-column): "Recently viewed" waits for post-detail. */
export function RightColumn() {
  return (
    <>
      <SeasonTokensTeaser />
      <SiteFooter />
    </>
  )
}
