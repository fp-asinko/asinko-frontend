import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEMO_USER } from '@/mocks/demo-user'
import { getAssetQuote } from './asset-quote.action'
import { createThesis } from './create-thesis.action'

const deps = vi.hoisted(() => ({
  getViewer: vi.fn(),
  createThesisAs: vi.fn(),
  assetQuote: vi.fn(),
  deleteDraftAs: vi.fn(),
}))
vi.mock('../lib/drafts-api', () => ({ deleteDraftAs: deps.deleteDraftAs }))
vi.mock('@/lib/session', () => ({ getViewer: deps.getViewer }))
vi.mock('../lib/theses-api', () => ({
  createThesisAs: deps.createThesisAs,
  assetQuote: deps.assetQuote,
}))

const DAY_MS = 24 * 60 * 60 * 1000
const valid = () => ({
  communityId: '00000000-0000-4000-8000-000000001001',
  assetSymbol: 'NVDA',
  claim: 'NVDA above 200',
  direction: 'ABOVE',
  targetPrice: '200',
  deadline: new Date(Date.now() + 30 * DAY_MS).toISOString(),
  conviction: 'HIGH',
  reasoning: 'Demand.',
  disclaimerAccepted: true,
})
const failure = (code: string, errorKey = `api.errors.${code}`) => ({
  ok: false,
  kind: 'expected',
  code,
  errorKey,
  endpoint: 'POST /api/v1/theses',
})

describe('createThesis (specs/thesis-create TC-13 to TC-15)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    deps.getViewer.mockResolvedValue(DEMO_USER)
  })

  it('rejects invalid input with the key of each field, before anything else', async () => {
    const result = await createThesis({ ...valid(), claim: '', disclaimerAccepted: false })
    expect(result).toMatchObject({
      ok: false,
      fieldErrors: {
        claim: ['composer.thesis.errors.claimRequired'],
        disclaimerAccepted: ['composer.thesis.errors.disclaimer'],
      },
    })
    expect(deps.getViewer).not.toHaveBeenCalled()
    expect(deps.createThesisAs).not.toHaveBeenCalled()
  })

  it('refuses a deadline no longer far enough, before the network', async () => {
    const result = await createThesis({
      ...valid(),
      deadline: new Date(Date.now() + DAY_MS / 2).toISOString(),
    })
    expect(result).toEqual({
      ok: false,
      error: 'composer.thesis.errors.deadline',
      fieldErrors: { deadline: ['composer.thesis.errors.deadline'] },
    })
    expect(deps.createThesisAs).not.toHaveBeenCalled()
  })

  it('needs a session, checked inside the action', async () => {
    deps.getViewer.mockResolvedValue(null)
    expect(await createThesis(valid())).toEqual({ ok: false, error: 'api.errors.UNAUTHENTICATED' })
    expect(deps.createThesisAs).not.toHaveBeenCalled()
  })

  it('publishes with the userId of the session, and answers the username', async () => {
    deps.createThesisAs.mockResolvedValue({ ok: true, data: { id: 'new' } })
    const result = await createThesis({ ...valid(), userId: 'someone-else' })
    const [userId, input] = deps.createThesisAs.mock.calls[0]!
    expect(userId).toBe(DEMO_USER.id)
    expect(input).not.toHaveProperty('userId')
    expect(input).toMatchObject({ targetPrice: 200, direction: 'ABOVE' })
    expect(result).toEqual({ ok: true, data: { username: DEMO_USER.username } })
  })

  it('publishes from a draft with its id, and deletes it (specs/thesis-drafts TD-04)', async () => {
    const DRAFT = '00000000-0000-4000-8000-000000042001'
    deps.createThesisAs.mockResolvedValue({ ok: true, data: { id: 'new' } })
    await createThesis(valid(), DRAFT)
    expect(deps.createThesisAs.mock.calls[0]?.[2]).toBe(DRAFT)
    expect(deps.deleteDraftAs).toHaveBeenCalledWith(DEMO_USER.id, DRAFT)
  })

  it('publishes without the draft when it is gone, and ignores an id that is not one', async () => {
    const DRAFT = '00000000-0000-4000-8000-000000042001'
    deps.createThesisAs
      .mockResolvedValueOnce(failure('NOT_FOUND'))
      .mockResolvedValueOnce({ ok: true, data: { id: 'new' } })
    expect(await createThesis(valid(), DRAFT)).toMatchObject({ ok: true })
    expect(deps.createThesisAs.mock.calls[1]?.[2]).toBeUndefined()

    vi.clearAllMocks()
    deps.createThesisAs.mockResolvedValue({ ok: true, data: { id: 'new' } })
    await createThesis(valid(), '../x')
    expect(deps.createThesisAs.mock.calls[0]?.[2]).toBeUndefined()
    expect(deps.deleteDraftAs).not.toHaveBeenCalled()
  })

  it.each([
    ['CLAIM_TOO_LONG', 'claim', 'composer.thesis.errors.claimTooLong'],
    ['DEADLINE_OUT_OF_RANGE', 'deadline', 'composer.thesis.errors.deadline'],
    ['ASSET_NOT_FOUND', 'assetSymbol', 'composer.thesis.errors.asset'],
    ['AMBIGUOUS_SYMBOL', 'assetSymbol', 'composer.thesis.errors.asset'],
    ['INVALID_COMMUNITY', 'communityId', 'composer.errors.invalidCommunity'],
    ['PERSONAL_CHANNEL_OWNER_ONLY', 'communityId', 'composer.errors.ownProfileOnly'],
    ['DISCLAIMER_NOT_ACCEPTED', 'disclaimerAccepted', 'composer.thesis.errors.disclaimer'],
  ])('puts %s in its field', async (code, field, key) => {
    deps.createThesisAs.mockResolvedValue(failure(code))
    expect(await createThesis(valid())).toEqual({
      ok: false,
      error: key,
      fieldErrors: { [field]: [key] },
    })
  })

  it('says the rest as the API client does', async () => {
    deps.createThesisAs.mockResolvedValue(failure('VALIDATION_ERROR'))
    expect(await createThesis(valid())).toEqual({ ok: false, error: 'composer.errors.invalid' })
    deps.createThesisAs.mockResolvedValue(failure('RATE_LIMITED'))
    expect(await createThesis(valid())).toEqual({ ok: false, error: 'api.errors.RATE_LIMITED' })
  })
})

describe('getAssetQuote (TC-05)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('asks for a valid symbol only', async () => {
    const quote = { name: 'NVIDIA', price: 180, changePct: 1.2, stale: false }
    deps.assetQuote.mockResolvedValue(quote)
    expect(await getAssetQuote('NVDA')).toEqual(quote)
    expect(await getAssetQuote('../x')).toBeNull()
    expect(await getAssetQuote(42)).toBeNull()
    expect(deps.assetQuote).toHaveBeenCalledTimes(1)
  })
})
