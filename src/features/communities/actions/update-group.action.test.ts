// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { updateGroup } from './update-group.action'

const ME = '00000000-0000-4000-8000-000000000100'
const deps = vi.hoisted(() => ({
  viewer: null as { id: string; username: string } | null,
  updateGroupAs: vi.fn(),
  revalidatePath: vi.fn(),
}))
vi.mock('@/lib/session', () => ({ getViewer: async () => deps.viewer }))
vi.mock('../lib/update-group', () => ({ updateGroupAs: deps.updateGroupAs }))
vi.mock('next/cache', () => ({ revalidatePath: deps.revalidatePath }))

const failure = (code: string, extra: Record<string, unknown> = {}) => ({
  ok: false,
  kind: 'expected',
  code,
  errorKey: 'api.errors.UNKNOWN',
  endpoint: 'PATCH /api/v1/communities/:slug',
  ...extra,
})

describe('updateGroup (specs/community-edit CE-03, CE-06)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    deps.viewer = { id: ME, username: 'demo' }
    deps.updateGroupAs.mockResolvedValue({ ok: true, data: null })
  })

  it('saves what changed as the session user, and refreshes the layout', async () => {
    expect(
      await updateGroup('options-flow', { description: '', rules: 'Be kind', userId: 'x' }),
    ).toEqual({ ok: true, data: null })
    expect(deps.updateGroupAs).toHaveBeenCalledWith(ME, 'options-flow', {
      description: null,
      rules: 'Be kind',
    })
    expect(deps.revalidatePath).toHaveBeenCalledWith('/', 'layout')
  })

  it('asks for a session, a valid group and valid changes, before the API', async () => {
    deps.viewer = null
    expect(await updateGroup('options-flow', {})).toEqual({
      ok: false,
      error: 'api.errors.UNAUTHENTICATED',
    })
    deps.viewer = { id: ME, username: 'demo' }
    expect(await updateGroup('../admin', {})).toMatchObject({ ok: false })
    expect(await updateGroup('options-flow', { name: 'ab' })).toMatchObject({
      fieldErrors: { name: ['createGroup.errors.nameLength'] },
    })
    expect(deps.updateGroupAs).not.toHaveBeenCalled()
  })

  it('says who cannot edit it, and puts a refused field on its field', async () => {
    deps.updateGroupAs.mockResolvedValue(failure('NOT_MODERATOR'))
    expect(await updateGroup('defi', { rules: 'x' })).toEqual({
      ok: false,
      error: 'communities.editGroup.errors.notModerator',
    })
    deps.updateGroupAs.mockResolvedValue(failure('VALIDATION_ERROR', { field: 'rules' }))
    expect(await updateGroup('defi', { rules: 'x' })).toEqual({
      ok: false,
      error: 'createGroup.errors.rulesMax',
      fieldErrors: { rules: ['createGroup.errors.rulesMax'] },
    })
    deps.updateGroupAs.mockResolvedValue({ ...failure('HTTP'), errorKey: 'api.errors.UNAVAILABLE' })
    expect(await updateGroup('defi', { rules: 'x' })).toEqual({
      ok: false,
      error: 'api.errors.UNAVAILABLE',
    })
    expect(deps.revalidatePath).not.toHaveBeenCalled()
  })
})
