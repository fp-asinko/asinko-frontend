// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createGroup } from './create-group.action'

const ME = '00000000-0000-4000-8000-000000000100'
const deps = vi.hoisted(() => ({
  viewer: null as { id: string; username: string } | null,
  createGroupAs: vi.fn(),
  revalidatePath: vi.fn(),
}))
vi.mock('@/lib/session', () => ({ getViewer: async () => deps.viewer }))
vi.mock('../lib/create-group', () => ({ createGroupAs: deps.createGroupAs }))
vi.mock('next/cache', () => ({ revalidatePath: deps.revalidatePath }))

const input = {
  name: 'Options Flow',
  slug: 'options-flow',
  description: '',
  rules: '',
  mainUrl: '',
}
const failure = (code: string, errorKey = 'api.errors.UNKNOWN') => ({
  ok: false,
  kind: 'expected',
  code,
  errorKey,
  endpoint: 'POST /api/v1/communities',
})

describe('createGroup (specs/community-create CG-09, CG-10)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    deps.viewer = { id: ME, username: 'demo' }
    deps.createGroupAs.mockResolvedValue({ ok: true, data: { id: 'g1', slug: 'options-flow' } })
  })

  it('creates the group as the session user and refreshes the layout for the left column', async () => {
    expect(await createGroup({ ...input, userId: 'someone-else' })).toEqual({
      ok: true,
      data: { id: 'g1', slug: 'options-flow' },
    })
    expect(deps.createGroupAs).toHaveBeenCalledWith(ME, {
      name: 'Options Flow',
      slug: 'options-flow',
      description: undefined,
      rules: undefined,
      mainUrl: undefined,
    })
    expect(deps.revalidatePath).toHaveBeenCalledWith('/', 'layout')
  })

  it('asks for a session before anything', async () => {
    deps.viewer = null
    expect(await createGroup(input)).toEqual({ ok: false, error: 'api.errors.UNAUTHENTICATED' })
    expect(deps.createGroupAs).not.toHaveBeenCalled()
  })

  it('refuses an invalid input with its fields, before the API', async () => {
    expect(await createGroup({ ...input, name: 'ab', slug: 'Bad' })).toMatchObject({
      ok: false,
      error: 'createGroup.errors.invalid',
      fieldErrors: {
        name: ['createGroup.errors.nameLength'],
        slug: ['createGroup.errors.slugFormat'],
      },
    })
    expect(await createGroup(null)).toMatchObject({ ok: false })
    expect(deps.createGroupAs).not.toHaveBeenCalled()
  })

  it('turns a taken or refused handle into the handle error, anything else into its key', async () => {
    deps.createGroupAs.mockResolvedValue(failure('SLUG_TAKEN'))
    expect(await createGroup(input)).toEqual({
      ok: false,
      error: 'createGroup.errors.slugTaken',
      fieldErrors: { slug: ['createGroup.errors.slugTaken'] },
    })
    deps.createGroupAs.mockResolvedValue(failure('INVALID_SLUG'))
    expect(await createGroup(input)).toMatchObject({
      fieldErrors: { slug: ['createGroup.errors.slugFormat'] },
    })
    deps.createGroupAs.mockResolvedValue(failure('HTTP', 'api.errors.UNAVAILABLE'))
    expect(await createGroup(input)).toEqual({ ok: false, error: 'api.errors.UNAVAILABLE' })
    expect(deps.revalidatePath).not.toHaveBeenCalled()
  })
})
