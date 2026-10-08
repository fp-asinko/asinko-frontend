import { beforeEach, describe, expect, it, vi } from 'vitest'
import { communityPage } from '../communities.fixture'
import { getPreviewData } from './preview-api'
import { profileDetails } from '../profile.fixture'

const deps = vi.hoisted(() => ({ getCommunityPage: vi.fn(), getProfileDetails: vi.fn() }))
vi.mock('./community-api', () => ({ getCommunityPage: deps.getCommunityPage }))
vi.mock('./profile-api', () => ({ getProfileDetails: deps.getProfileDetails }))

const maria = profileDetails({
  displayName: 'María',
  bio: 'Macro and rates.',
  followerCount: 120,
  accuracyRate: 0.7,
  currentStreak: 3,
})
const notFound = {
  ok: false,
  kind: 'expected',
  code: 'NOT_FOUND',
  errorKey: 'api.errors.NOT_FOUND',
  endpoint: 'GET /api/v1/communities/:slug',
} as const

describe('getPreviewData (specs/mention-preview § 3)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    deps.getCommunityPage.mockResolvedValue({ ok: true, data: communityPage() })
    deps.getProfileDetails.mockResolvedValue({ ok: true, data: maria })
  })

  it('sends only what the card shows of a group, and no profile', async () => {
    const result = await getPreviewData({ kind: 'group', slug: 'macro' })
    expect(result).toEqual({
      ok: true,
      data: {
        community: {
          slug: 'macro',
          handle: '#macro',
          subtitle: null,
          description: 'Rates, inflation and central banks.',
          avatarUrl: null,
          bannerUrl: null,
          kind: 'group',
          memberCount: 1204,
          createdAt: null,
          viewerMembership: null,
        },
        profile: null,
      },
    })
    expect(deps.getProfileDetails).not.toHaveBeenCalled()
  })

  it('brings a person with their channel, both at once', async () => {
    deps.getCommunityPage.mockResolvedValue({
      ok: true,
      data: communityPage({ slug: 'maria', handle: '@maria', kind: 'user' }),
    })
    const result = await getPreviewData({ kind: 'user', slug: 'maria' })
    expect(result.ok && result.data.profile).toEqual(maria)
    expect(deps.getCommunityPage).toHaveBeenCalledWith('maria')
    expect(deps.getProfileDetails).toHaveBeenCalledWith('maria')
  })

  it('fails when the community or the profile fails (no card then)', async () => {
    deps.getCommunityPage.mockResolvedValue(notFound)
    expect(await getPreviewData({ kind: 'group', slug: 'gone' })).toEqual(notFound)

    deps.getCommunityPage.mockResolvedValue({
      ok: true,
      data: communityPage({ kind: 'user' }),
    })
    deps.getProfileDetails.mockResolvedValue(notFound)
    expect(await getPreviewData({ kind: 'user', slug: 'gone' })).toEqual(notFound)
  })

  it('shows a personal channel asked as a group as a community', async () => {
    deps.getCommunityPage.mockResolvedValue({ ok: true, data: communityPage({ kind: 'user' }) })
    const result = await getPreviewData({ kind: 'group', slug: 'maria' })
    expect(result.ok && result.data.profile).toBeNull()
  })
})
