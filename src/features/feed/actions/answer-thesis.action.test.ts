import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEMO_USER } from '@/mocks/demo-user'
import { answerThesis } from './answer-thesis.action'

const deps = vi.hoisted(() => ({ getViewer: vi.fn(), answerThesisAs: vi.fn() }))
vi.mock('@/lib/session', () => ({ getViewer: deps.getViewer }))
vi.mock('../lib/votes-api', () => ({ answerThesisAs: deps.answerThesisAs }))

const ID = '00000000-0000-4000-8000-000000000001'
const AGREEMENT = { yes: 3, no: 2, viewerVote: 'no', canVote: true }

describe('answerThesis (specs/thesis-agree AG-04, AG-05, AG-08)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    deps.getViewer.mockResolvedValue(DEMO_USER)
  })

  it('validates the input before anything else', async () => {
    expect(await answerThesis({ thesisId: ID, value: 'maybe' })).toEqual({
      ok: false,
      error: 'api.errors.INVALID',
    })
    expect(await answerThesis({ thesisId: 'x', value: 'yes' })).toMatchObject({ ok: false })
    expect(deps.answerThesisAs).not.toHaveBeenCalled()
  })

  it('needs a session, checked inside the action', async () => {
    deps.getViewer.mockResolvedValue(null)
    expect(await answerThesis({ thesisId: ID, value: 'yes' })).toEqual({
      ok: false,
      error: 'api.errors.UNAUTHENTICATED',
    })
    expect(deps.answerThesisAs).not.toHaveBeenCalled()
  })

  it('answers with the userId of the session, never one sent by the client', async () => {
    deps.answerThesisAs.mockResolvedValue({ ok: true, data: AGREEMENT })
    const result = await answerThesis({ thesisId: ID, value: 'no', userId: 'other' })
    expect(deps.answerThesisAs).toHaveBeenCalledWith(DEMO_USER.id, { thesisId: ID, value: 'no' })
    expect(result).toEqual({ ok: true, data: AGREEMENT })
  })

  it('takes the answer back with null, and passes errors as their key', async () => {
    deps.answerThesisAs.mockResolvedValue({ ok: false, errorKey: 'api.errors.THESIS_CLOSED' })
    expect(await answerThesis({ thesisId: ID, value: null })).toEqual({
      ok: false,
      error: 'api.errors.THESIS_CLOSED',
    })
    expect(deps.answerThesisAs).toHaveBeenCalledWith(DEMO_USER.id, { thesisId: ID, value: null })
  })
})
