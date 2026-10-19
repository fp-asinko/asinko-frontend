import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEMO_USER } from '@/mocks/demo-user'
import { setFeatured } from './featured.action'

const deps = vi.hoisted(() => ({ getViewer: vi.fn(), featureAs: vi.fn(), unfeatureAs: vi.fn() }))
vi.mock('@/lib/session', () => ({ getViewer: deps.getViewer }))
vi.mock('../lib/featured-api', async () => {
  const { z } = await import('zod')
  return {
    featuredRefSchema: z.object({ kind: z.enum(['post', 'thesis']), id: z.uuid() }),
    featureAs: deps.featureAs,
    unfeatureAs: deps.unfeatureAs,
  }
})

const ID = '00000000-0000-4000-8000-000000004001'
const failure = (code: string) => ({
  ok: false,
  kind: 'expected',
  code,
  errorKey: `api.errors.${code}`,
  endpoint: 'POST /api/v1/users/:userId/featured',
})

describe('setFeatured (specs/profile-showcase PS-07)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    deps.getViewer.mockResolvedValue(DEMO_USER)
    deps.featureAs.mockResolvedValue({ ok: true, data: null })
    deps.unfeatureAs.mockResolvedValue({ ok: true, data: null })
  })

  it('features or takes out, as the viewer of the session', async () => {
    expect(await setFeatured({ kind: 'post', id: ID, featured: true })).toEqual({
      ok: true,
      data: null,
    })
    expect(deps.featureAs).toHaveBeenCalledWith(DEMO_USER.id, { kind: 'post', id: ID })
    await setFeatured({ kind: 'thesis', id: ID, featured: false, userId: 'someone' })
    expect(deps.unfeatureAs).toHaveBeenCalledWith(DEMO_USER.id, { kind: 'thesis', id: ID })
  })

  it('checks the input and the session first', async () => {
    expect(await setFeatured({ kind: 'poll', id: ID, featured: true })).toMatchObject({ ok: false })
    expect(deps.getViewer).not.toHaveBeenCalled()
    deps.getViewer.mockResolvedValue(null)
    expect(await setFeatured({ kind: 'post', id: ID, featured: true })).toEqual({
      ok: false,
      error: 'api.errors.UNAUTHENTICATED',
    })
  })

  it('says the limit and whose content it is in its own words', async () => {
    deps.featureAs.mockResolvedValue(failure('FEATURED_LIMIT'))
    expect(await setFeatured({ kind: 'post', id: ID, featured: true })).toEqual({
      ok: false,
      error: 'featured.errors.limit',
    })
    deps.featureAs.mockResolvedValue(failure('NOT_OWNER'))
    expect(await setFeatured({ kind: 'post', id: ID, featured: true })).toMatchObject({
      error: 'featured.errors.notOwner',
    })
    deps.featureAs.mockResolvedValue({ ...failure('HTTP'), errorKey: 'api.errors.UNAVAILABLE' })
    expect(await setFeatured({ kind: 'post', id: ID, featured: true })).toMatchObject({
      error: 'api.errors.UNAVAILABLE',
    })
  })
})
