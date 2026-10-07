import type { CommunityPage } from './communities.types'

/** A community page for component tests: #macro, a group, no session data. */
export function communityPage(overrides: Partial<CommunityPage> = {}): CommunityPage {
  return {
    slug: 'macro',
    handle: '#macro',
    subtitle: null,
    description: 'Rates, inflation and central banks.',
    avatarUrl: null,
    bannerUrl: null,
    kind: 'group',
    memberCount: 1204,
    rules: null,
    mainUrl: null,
    viewerMembership: null,
    viewerIsFavorite: false,
    ...overrides,
  }
}
