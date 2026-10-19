import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEMO_USER } from '@/mocks/demo-user'
import { deleteDraft, listDrafts, saveDraft } from './drafts.action'

const deps = vi.hoisted(() => ({
  getViewer: vi.fn(),
  listDraftsOf: vi.fn(),
  saveDraftAs: vi.fn(),
  deleteDraftAs: vi.fn(),
}))
vi.mock('@/lib/session', () => ({ getViewer: deps.getViewer }))
vi.mock('../lib/drafts-api', () => ({
  listDraftsOf: deps.listDraftsOf,
  saveDraftAs: deps.saveDraftAs,
  deleteDraftAs: deps.deleteDraftAs,
}))

const DRAFT = '00000000-0000-4000-8000-000000000901'
const failure = (code: string) => ({
  ok: false,
  kind: 'expected',
  code,
  errorKey: `api.errors.${code}`,
  endpoint: 'POST /api/v1/drafts',
})

describe('draft actions (specs/drafts-tags DT-01 to DT-05)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    deps.getViewer.mockResolvedValue(DEMO_USER)
  })

  it('saves with the userId of the session, leaving out what is empty', async () => {
    deps.saveDraftAs.mockResolvedValue({ ok: true, data: { id: DRAFT } })
    const result = await saveDraft({
      userId: 'someone-else',
      communityId: '',
      type: 'TEXT',
      title: ' Rates ',
      body: '',
      url: '',
      imageUrl: '',
      imageAlt: '',
      tag: '',
    })
    expect(result).toEqual({ ok: true, data: { id: DRAFT } })
    expect(deps.saveDraftAs).toHaveBeenCalledWith(DEMO_USER.id, undefined, {
      type: 'TEXT',
      title: 'Rates',
      body: '',
      url: '',
      imageAlt: '',
    })
  })

  it('updates the draft given (DT-03)', async () => {
    deps.saveDraftAs.mockResolvedValue({ ok: true, data: { id: DRAFT } })
    await saveDraft({ draftId: DRAFT, type: 'TEXT', body: 'Up.', tag: 'News' })
    expect(deps.saveDraftAs).toHaveBeenCalledWith(
      DEMO_USER.id,
      DRAFT,
      expect.objectContaining({ body: 'Up.', tag: 'News' }),
    )
  })

  it('refuses an empty draft or a bad id before the session', async () => {
    expect(await saveDraft({ type: 'TEXT' })).toEqual({
      ok: false,
      error: 'composer.drafts.errors.invalid',
    })
    expect(await saveDraft({ draftId: '../x', type: 'TEXT', title: 'a' })).toMatchObject({
      ok: false,
    })
    expect(await deleteDraft('../x')).toMatchObject({ ok: false })
    expect(deps.getViewer).not.toHaveBeenCalled()
  })

  it('says the limit in its own words (DT-05)', async () => {
    deps.saveDraftAs.mockResolvedValue(failure('DRAFT_LIMIT'))
    expect(await saveDraft({ type: 'TEXT', title: 'One more' })).toEqual({
      ok: false,
      error: 'composer.drafts.errors.limit',
    })
  })

  it('asks for a session in each one', async () => {
    deps.getViewer.mockResolvedValue(null)
    const unauthenticated = { ok: false, error: 'api.errors.UNAUTHENTICATED' }
    expect(await saveDraft({ type: 'TEXT', title: 'a' })).toEqual(unauthenticated)
    expect(await listDrafts()).toEqual(unauthenticated)
    expect(await deleteDraft(DRAFT)).toEqual(unauthenticated)
    expect(deps.saveDraftAs).not.toHaveBeenCalled()
    expect(deps.listDraftsOf).not.toHaveBeenCalled()
    expect(deps.deleteDraftAs).not.toHaveBeenCalled()
  })

  it("lists the viewer's drafts, and says when they cannot load", async () => {
    deps.listDraftsOf.mockResolvedValue({ ok: true, data: [] })
    expect(await listDrafts()).toEqual({ ok: true, data: [] })
    expect(deps.listDraftsOf).toHaveBeenCalledWith(DEMO_USER.id, DEMO_USER.username)
    deps.listDraftsOf.mockResolvedValue({ ...failure('HTTP'), errorKey: 'api.errors.UNAVAILABLE' })
    expect(await listDrafts()).toEqual({ ok: false, error: 'api.errors.UNAVAILABLE' })
  })

  it('deletes one, and one already gone counts as deleted (DT-04)', async () => {
    deps.deleteDraftAs.mockResolvedValue({ ok: true, data: null })
    expect(await deleteDraft(DRAFT)).toEqual({ ok: true, data: null })
    expect(deps.deleteDraftAs).toHaveBeenCalledWith(DEMO_USER.id, DRAFT)
    deps.deleteDraftAs.mockResolvedValue(failure('NOT_FOUND'))
    expect(await deleteDraft(DRAFT)).toEqual({ ok: true, data: null })
    deps.deleteDraftAs.mockResolvedValue({ ...failure('HTTP'), errorKey: 'api.errors.UNAVAILABLE' })
    expect(await deleteDraft(DRAFT)).toEqual({ ok: false, error: 'api.errors.UNAVAILABLE' })
  })
})
