import {
  RecentlyViewedSlot,
  RightColumn,
  SeasonTokensTeaser,
} from '@/components/organisms/right-column'
import { GUEST_OWNER } from '@/lib/recently-viewed'
import { getViewer } from '@/lib/session'

// The Home's right column: the season tokens, then "Recently viewed" (specs/recently-viewed),
// which arrives after the page loads and so goes below. Only here (specs/community-widgets CW-02).
export default async function HomeRight() {
  const viewer = await getViewer()
  return (
    <RightColumn>
      <SeasonTokensTeaser />
      {/* Each account its own list, and the guest too (specs/recently-viewed RV-10). */}
      <RecentlyViewedSlot owner={viewer?.id ?? GUEST_OWNER} />
    </RightColumn>
  )
}
