import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEMO_USER } from '@/mocks/demo-user'
import { createPost } from './create-post.action'
import { searchCommunities } from './search-communities.action'

const deps = vi.hoisted(() => ({
  getViewer: vi.fn(),
  createPostAs: vi.fn(),
  listCommunityOptions: vi.fn(),
}))
vi.mock('@/lib/session', () => ({ getViewer: deps.getViewer }))
vi.mock('../lib/composer-api', () => ({
  createPostAs: deps.createPostAs,
  listCommunityOptions: deps.listCommunityOptions,
}))

const COMMUNITY = '00000000-0000-4000-8000-000000001001'
const valid = { communityId: COMMUNITY, type: 'TEXT', title: 'Title', body: 'Body', url: '' }
const failure = (code: string, errorKey = `api.errors.${code}`) => ({
  ok: false,
  kind: 'expected',
  code,
  errorKey,
  endpoint: 'POST /api/v1/posts',
})

describe('createPost (specs/post-create-detail PC-09 to PC-11)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    deps.getViewer.mockResolvedValue(DEMO_USER)
  })

  it('rejects invalid input with the key of each field, before anything else', async () => {
    const result = await createPost({ ...valid, title: '', type: 'LINK', url: 'javascript:x' })
    expect(result).toMatchObject({
      ok: false,
      error: 'composer.errors.invalid',
      fieldErrors: { title: ['composer.errors.titleRequired'], url: ['composer.errors.url'] },
    })
    expect(deps.getViewer).not.toHaveBeenCalled()
    expect(deps.createPostAs).not.toHaveBeenCalled()
  })

  it('needs a session, checked inside the action', async () => {
    deps.getViewer.mockResolvedValue(null)
    expect(await createPost(valid)).toEqual({ ok: false, error: 'api.errors.UNAUTHENTICATED' })
    expect(deps.createPostAs).not.toHaveBeenCalled()
  })

  it('publishes with the userId of the session, never one from the form', async () => {
    deps.createPostAs.mockResolvedValue({ ok: true, data: { id: 'new', title: 'Title' } })
    const result = await createPost({ ...valid, userId: 'someone-else' })
    expect(deps.createPostAs).toHaveBeenCalledWith(
      DEMO_USER.id,
      { communityId: COMMUNITY, type: 'TEXT', title: 'Title', body: 'Body', related: [] },
      undefined,
    )
    expect(result).toEqual({ ok: true, data: { id: 'new', title: 'Title' } })
  })

  it('publishes a draft with its id, the backend deletes it (specs/backend-answer-1020 BA-05)', async () => {
    const draft = '00000000-0000-4000-8000-000000000901'
    deps.createPostAs.mockResolvedValue({ ok: true, data: { id: 'new', title: 'Title' } })
    expect(await createPost(valid, draft)).toMatchObject({ ok: true })
    expect(deps.createPostAs).toHaveBeenCalledWith(DEMO_USER.id, expect.any(Object), draft)
    // Not a uuid: as without a draft.
    deps.createPostAs.mockClear()
    await createPost(valid, '../x')
    expect(deps.createPostAs).toHaveBeenCalledWith(DEMO_USER.id, expect.any(Object), undefined)
  })

  it('publishes anyway when its draft is gone (deleted from another device)', async () => {
    const draft = '00000000-0000-4000-8000-000000000901'
    deps.createPostAs
      .mockResolvedValueOnce(failure('NOT_FOUND'))
      .mockResolvedValueOnce({ ok: true, data: { id: 'new', title: 'Title' } })
    expect(await createPost(valid, draft)).toMatchObject({ ok: true })
    expect(deps.createPostAs).toHaveBeenLastCalledWith(DEMO_USER.id, expect.any(Object))
  })

  it('explains the backend refusals in the editor words', async () => {
    for (const [code, error] of [
      ['PERSONAL_CHANNEL_OWNER_ONLY', 'composer.errors.ownProfileOnly'],
      ['INVALID_COMMUNITY', 'composer.errors.invalidCommunity'],
      ['INVALID_RELATED_COMMUNITY', 'composer.errors.invalidRelated'],
      ['VALIDATION_ERROR', 'composer.errors.invalid'],
    ]) {
      deps.createPostAs.mockResolvedValue(failure(code!, 'api.errors.UNKNOWN'))
      expect(await createPost(valid)).toEqual({ ok: false, error })
    }
    deps.createPostAs.mockResolvedValue(failure('RATE_LIMITED'))
    expect(await createPost(valid)).toEqual({ ok: false, error: 'api.errors.RATE_LIMITED' })
  })
})

describe('searchCommunities (PC-06)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    deps.getViewer.mockResolvedValue(DEMO_USER)
  })

  it("lists for the session's user, with the search trimmed", async () => {
    deps.listCommunityOptions.mockResolvedValue({ ok: true, data: [] })
    expect(await searchCommunities('  de ')).toEqual({ ok: true, data: [] })
    expect(deps.listCommunityOptions).toHaveBeenCalledWith(DEMO_USER.username, 'de', 'all')
  })

  it('passes the kind along (specs/picker-filters PF-02)', async () => {
    deps.listCommunityOptions.mockResolvedValue({ ok: true, data: [] })
    await searchCommunities('bt', 'assets')
    expect(deps.listCommunityOptions).toHaveBeenCalledWith(DEMO_USER.username, 'bt', 'assets')
  })

  it('rejects odd input and missing sessions, and returns failures as keys', async () => {
    expect(await searchCommunities(42)).toEqual({ ok: false, error: 'api.errors.INVALID' })
    expect(await searchCommunities('', 'people')).toEqual({
      ok: false,
      error: 'api.errors.INVALID',
    })
    expect(await searchCommunities('x'.repeat(65))).toEqual({
      ok: false,
      error: 'api.errors.INVALID',
    })
    deps.listCommunityOptions.mockResolvedValue(failure('UNAVAILABLE', 'api.errors.UNAVAILABLE'))
    expect(await searchCommunities('')).toEqual({ ok: false, error: 'api.errors.UNAVAILABLE' })
    deps.getViewer.mockResolvedValue(null)
    expect(await searchCommunities('')).toEqual({ ok: false, error: 'api.errors.UNAUTHENTICATED' })
  })
})
