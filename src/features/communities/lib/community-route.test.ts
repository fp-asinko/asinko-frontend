// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CommunityPage } from '../communities.types'
import { resolveAssetPage, resolveCommunityPage } from './community-route'

const deps = vi.hoisted(() => ({ getCommunityPage: vi.fn(), getAssetSummary: vi.fn() }))
vi.mock('./community-api', () => ({ getCommunityPage: deps.getCommunityPage }))
vi.mock('./asset-api', () => ({ getAssetSummary: deps.getAssetSummary }))
vi.mock('@/lib/api', async () => {
  const { getOrThrow } = await import('@/lib/api/helpers')
  return { getOrThrow }
})
// notFound and the redirect throw, as in Next; the tests read what they were called with.
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NOT_FOUND')
  },
}))
vi.mock('@/i18n/navigation', () => ({
  permanentRedirect: ({ href, locale }: { href: string; locale: string }) => {
    throw new Error(`REDIRECT ${locale}${href}`)
  },
}))

const page = (overrides: Partial<CommunityPage>): CommunityPage => ({
  id: '00000000-0000-4000-8000-000000001001',
  slug: 'macro',
  handle: '#macro',
  subtitle: null,
  description: null,
  avatarUrl: null,
  bannerUrl: null,
  kind: 'group',
  memberCount: 5,
  createdAt: null,
  rules: null,
  mainUrl: null,
  viewerMembership: null,
  viewerIsFavorite: false,
  ...overrides,
})
const found = (data: CommunityPage) => ({ ok: true, data })
const missing = {
  ok: false,
  kind: 'expected',
  code: 'NOT_FOUND',
  errorKey: 'api.errors.NOT_FOUND',
  endpoint: 'GET /api/v1/communities/:slug',
}

describe('resolveCommunityPage (specs/community-pages CP-02)', () => {
  beforeEach(() => deps.getCommunityPage.mockReset())

  it('returns the community when it belongs on this route', async () => {
    deps.getCommunityPage.mockResolvedValue(found(page({})))
    await expect(resolveCommunityPage('macro', 'group', 'es')).resolves.toMatchObject({
      handle: '#macro',
    })
  })

  it('shows the not-found page for an unknown community', async () => {
    deps.getCommunityPage.mockResolvedValue(missing)
    await expect(resolveCommunityPage('nope', 'group', 'es')).rejects.toThrow('NOT_FOUND')
  })

  it('redirects a community of another kind to its own page, in the same locale', async () => {
    deps.getCommunityPage.mockResolvedValue(found(page({ slug: 'BTC', kind: 'asset' })))
    await expect(resolveCommunityPage('BTC', 'group', 'es')).rejects.toThrow(
      'REDIRECT es/asset/BTC',
    )
    deps.getCommunityPage.mockResolvedValue(found(page({})))
    await expect(resolveCommunityPage('macro', 'asset', 'pt')).rejects.toThrow(
      'REDIRECT pt/hub/macro',
    )
  })

  it('tries an asset symbol in upper case and redirects to it (the backend is case-sensitive)', async () => {
    deps.getCommunityPage
      .mockResolvedValueOnce(missing)
      .mockResolvedValueOnce(found(page({ slug: 'BTC', kind: 'asset' })))
    await expect(resolveCommunityPage('btc', 'asset', 'en')).rejects.toThrow(
      'REDIRECT en/asset/BTC',
    )
    expect(deps.getCommunityPage).toHaveBeenLastCalledWith('BTC')
  })

  it('throws any other failure, for error.tsx', async () => {
    deps.getCommunityPage.mockResolvedValue({ ...missing, kind: 'unexpected', code: 'HTTP' })
    await expect(resolveCommunityPage('macro', 'group', 'es')).rejects.toThrow()
  })
})

describe('resolveAssetPage (specs/backend-answer-1013 BA-09)', () => {
  const TSLA = {
    symbol: 'TSLA',
    handle: '$TSLA',
    name: 'Tesla, Inc.',
    logoUrl: null,
    communitySlug: null,
  }

  beforeEach(() => vi.clearAllMocks())

  it('takes the community when the asset has one', async () => {
    deps.getCommunityPage.mockResolvedValue(found(page({ slug: 'BTC', kind: 'asset' })))
    expect(await resolveAssetPage('BTC', 'en')).toMatchObject({
      kind: 'community',
      page: { slug: 'BTC' },
    })
    expect(deps.getAssetSummary).not.toHaveBeenCalled()
  })

  it('shows the asset alone while it has no community', async () => {
    deps.getCommunityPage.mockResolvedValue(missing)
    deps.getAssetSummary.mockResolvedValue({ ok: true, data: TSLA })
    expect(await resolveAssetPage('TSLA', 'en')).toEqual({ kind: 'asset', asset: TSLA })
  })

  it('redirects a lower-case symbol to its canonical page', async () => {
    deps.getCommunityPage.mockResolvedValue(missing)
    deps.getAssetSummary.mockImplementation(async (symbol: string) =>
      symbol === 'TSLA' ? { ok: true, data: TSLA } : missing,
    )
    await expect(resolveAssetPage('tsla', 'es')).rejects.toThrow('REDIRECT es/asset/TSLA')
  })

  it('is the not-found page outside the catalog', async () => {
    deps.getCommunityPage.mockResolvedValue(missing)
    deps.getAssetSummary.mockResolvedValue(missing)
    await expect(resolveAssetPage('NOPE', 'en')).rejects.toThrow('NOT_FOUND')
  })
})
