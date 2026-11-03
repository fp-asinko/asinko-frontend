import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEMO_USER } from '@/mocks/demo-user'
import { cancelThesis } from './cancel-thesis.action'

const deps = vi.hoisted(() => ({ getViewer: vi.fn(), cancelThesisAs: vi.fn() }))
vi.mock('@/lib/session', () => ({ getViewer: deps.getViewer }))
vi.mock('../lib/thesis-api', () => ({ cancelThesisAs: deps.cancelThesisAs }))

const ID = '00000000-0000-4000-8000-000000000001'
const failure = (code: string) => ({
  ok: false,
  kind: 'expected',
  code,
  errorKey: `api.errors.${code}`,
  endpoint: 'PUT /api/v1/theses/:id/cancel',
})

describe('cancelThesis (specs/thesis-detail TD-14, TD-15)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    deps.getViewer.mockResolvedValue(DEMO_USER)
  })

  it('needs a reason of 1 to 280 characters, before anything else (Q4)', async () => {
    expect(await cancelThesis({ thesisId: ID, reason: '   ' })).toEqual({
      ok: false,
      error: 'feed.thesis.cancel.errors.reasonRequired',
    })
    expect(await cancelThesis({ thesisId: ID, reason: 'x'.repeat(281) })).toEqual({
      ok: false,
      error: 'feed.thesis.cancel.errors.reasonTooLong',
    })
    expect(await cancelThesis({ thesisId: 'x', reason: 'Wrong asset.' })).toMatchObject({
      ok: false,
    })
    expect(deps.cancelThesisAs).not.toHaveBeenCalled()
  })

  it('needs a session, checked inside the action', async () => {
    deps.getViewer.mockResolvedValue(null)
    expect(await cancelThesis({ thesisId: ID, reason: 'Wrong asset.' })).toEqual({
      ok: false,
      error: 'api.errors.UNAUTHENTICATED',
    })
    expect(deps.cancelThesisAs).not.toHaveBeenCalled()
  })

  it('cancels with the userId of the session and the reason trimmed', async () => {
    deps.cancelThesisAs.mockResolvedValue({ ok: true, data: {} })
    const result = await cancelThesis({ thesisId: ID, reason: ' Wrong asset. ', userId: 'other' })
    expect(deps.cancelThesisAs).toHaveBeenCalledWith(DEMO_USER.id, {
      thesisId: ID,
      reason: 'Wrong asset.',
    })
    expect(result).toEqual({ ok: true, data: null })
  })

  it('says when it can no longer be cancelled, and passes the rest through', async () => {
    deps.cancelThesisAs.mockResolvedValue(failure('THESIS_NOT_CANCELLABLE'))
    expect(await cancelThesis({ thesisId: ID, reason: 'Too late.' })).toEqual({
      ok: false,
      error: 'feed.thesis.cancel.errors.notCancellable',
    })
    deps.cancelThesisAs.mockResolvedValue(failure('USER_MISMATCH'))
    expect(await cancelThesis({ thesisId: ID, reason: 'Not mine.' })).toEqual({
      ok: false,
      error: 'api.errors.USER_MISMATCH',
    })
  })
})
