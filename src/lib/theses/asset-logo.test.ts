// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { thesisAssetLogo } from './asset-logo'

vi.mock('@/lib/images', () => ({ allowedImageUrl: (url: string | null) => url }))

const ASSET = { id: '00000000-0000-4000-8000-000000000001', symbol: 'NVDA', name: 'NVIDIA' }
const community = (slug: string, type: 'SYSTEM_ASSET' | 'USER_PUBLIC', avatarUrl: string | null) =>
  ({ id: ASSET.id, slug, name: slug, type, avatarUrl, viewerMembership: null }) as const

describe('thesisAssetLogo (specs/thesis-ticket TK-04, P-041)', () => {
  it('takes the asset’s own logo once the backend sends it', () => {
    expect(
      thesisAssetLogo({
        asset: { ...ASSET, logoUrl: 'https://img/NVDA.png' },
        community: community('macro', 'USER_PUBLIC', 'https://img/macro.png'),
      }),
    ).toBe('https://img/NVDA.png')
  })

  it('falls back to its community’s avatar only when the thesis is in the asset’s community', () => {
    expect(
      thesisAssetLogo({
        asset: ASSET,
        community: community('NVDA', 'SYSTEM_ASSET', 'https://img/c.png'),
      }),
    ).toBe('https://img/c.png')
    expect(
      thesisAssetLogo({
        asset: ASSET,
        community: community('macro', 'USER_PUBLIC', 'https://img/m.png'),
      }),
    ).toBeNull()
  })

  it('has none without an asset', () => {
    expect(
      thesisAssetLogo({ asset: null, community: community('NVDA', 'SYSTEM_ASSET', 'x') }),
    ).toBeNull()
  })
})
