import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEMO_USER } from '@/mocks/demo-user'
import { createThesisUpdate } from './create-thesis-update.action'

const deps = vi.hoisted(() => ({
  getViewer: vi.fn(),
  createThesisUpdateAs: vi.fn(),
  refresh: vi.fn(),
}))
vi.mock('@/lib/session', () => ({ getViewer: deps.getViewer }))
vi.mock('next/cache', () => ({ refresh: deps.refresh }))
vi.mock('../lib/thesis-updates-api', () => ({ createThesisUpdateAs: deps.createThesisUpdateAs }))

const ID = '00000000-0000-4000-8000-000000000001'
const failure = (code: string) => ({
  ok: false,
  kind: 'expected',
  code,
  errorKey: `api.errors.${code}`,
  endpoint: 'POST /api/v1/theses/:id/updates',
})

describe('createThesisUpdate (specs/thesis-arguments TA-10, TA-11)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    deps.getViewer.mockResolvedValue(DEMO_USER)
  })

  it('needs a text of 1 to 2,000 characters, before anything else', async () => {
    expect(await createThesisUpdate({ thesisId: ID, body: '  ' })).toEqual({
      ok: false,
      error: 'feed.thesis.updates.errors.required',
    })
    expect(await createThesisUpdate({ thesisId: ID, body: 'x'.repeat(2001) })).toEqual({
      ok: false,
      error: 'feed.thesis.updates.errors.tooLong',
    })
    expect(deps.createThesisUpdateAs).not.toHaveBeenCalled()
  })

  it('needs a session, checked inside the action', async () => {
    deps.getViewer.mockResolvedValue(null)
    expect(await createThesisUpdate({ thesisId: ID, body: 'Still in.' })).toEqual({
      ok: false,
      error: 'api.errors.UNAUTHENTICATED',
    })
  })

  it('posts with the userId of the session and refreshes the page', async () => {
    deps.createThesisUpdateAs.mockResolvedValue({ ok: true, data: { id: 'u-1' } })
    const result = await createThesisUpdate({ thesisId: ID, body: ' Still in. ', userId: 'x' })
    expect(deps.createThesisUpdateAs).toHaveBeenCalledWith(DEMO_USER.id, {
      thesisId: ID,
      body: 'Still in.',
    })
    expect(result).toEqual({ ok: true, data: { id: 'u-1' } })
    expect(deps.refresh).toHaveBeenCalledOnce()
  })

  it('says when the thesis is no longer open, and passes the rest through', async () => {
    deps.createThesisUpdateAs.mockResolvedValue(failure('THESIS_NOT_OPEN'))
    expect(await createThesisUpdate({ thesisId: ID, body: 'Late.' })).toEqual({
      ok: false,
      error: 'feed.thesis.updates.errors.notOpen',
    })
    deps.createThesisUpdateAs.mockResolvedValue(failure('USER_MISMATCH'))
    expect(await createThesisUpdate({ thesisId: ID, body: 'Not mine.' })).toEqual({
      ok: false,
      error: 'api.errors.USER_MISMATCH',
    })
    expect(deps.refresh).not.toHaveBeenCalled()
  })
})
