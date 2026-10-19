import {
  RecentlyViewedSlot,
  RightColumn,
  SeasonTokensTeaser,
} from '@/components/organisms/right-column'

// The Home's right column: the season tokens, then "Recently viewed" (specs/recently-viewed),
// which arrives after the page loads and so goes below. Only here (specs/community-widgets CW-02).
export default function HomeRight() {
  return (
    <RightColumn>
      <SeasonTokensTeaser />
      <RecentlyViewedSlot />
    </RightColumn>
  )
}
