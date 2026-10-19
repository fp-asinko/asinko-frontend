import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEMO_USER } from '@/mocks/demo-user'
import { SEED_DRAFT_ID } from '@/mocks/drafts'
import { communityBySlug } from '@/mocks/fixtures/communities'
import { MOCK_ROUTES } from '@/mocks/handlers'
import type { MockRoute } from '@/mocks/types'
import { deleteDraftAs, listDraftsOf, saveDraftAs } from './drafts-api'

// The real client against the mock routes (P-022); a route left out reaches a fetch that fails.
const state = vi.hoisted(() => ({ routes: [] as readonly MockRoute[] }))
vi.mock('@/lib/api', async () => {
  const { createApiClient } = await import('@/lib/api/create-client')
  const { noContentSchema, paginatedSchema } = await import('@/lib/api/schemas')
  return {
    noContentSchema,
    paginatedSchema,
    apiRequest: (request: Parameters<ReturnType<typeof createApiClient>>[0]) =>
      createApiClient({
        baseUrl: 'http://mock',
        fetch: () => Promise.reject(new Error('offline')),
        mocks: state.routes,
      })(request),
  }
})

const me = DEMO_USER.id
const macro = communityBySlug('macro')!

describe('drafts-api (P-022, specs/drafts-tags DT-01 to DT-04)', () => {
  beforeEach(() => {
    state.routes = MOCK_ROUTES
  })

  it("lists the drafts with their community as the picker's option, tags included", async () => {
    const result = await listDraftsOf(me, DEMO_USER.username)
    if (!result.ok) throw new Error('expected ok')
    const seeded = result.data.find((draft) => draft.id === SEED_DRAFT_ID)
    expect(seeded).toMatchObject({
      tag: 'Analysis',
      community: { id: macro.id, handle: '#macro', own: false, tags: macro.tags },
    })
  })

  it('saves a new one, updates it, and deletes it', async () => {
    const made = await saveDraftAs(me, undefined, {
      type: 'TEXT',
      title: 'Rates',
      body: '',
      url: '',
      imageAlt: '',
    })
    if (!made.ok) throw new Error('expected ok')
    const updated = await saveDraftAs(me, made.data.id, {
      type: 'TEXT',
      title: 'Rates, again',
      body: '',
      url: '',
      imageAlt: '',
    })
    expect(updated).toEqual({ ok: true, data: { id: made.data.id } })
    const listed = await listDraftsOf(me, DEMO_USER.username)
    expect(listed.ok && listed.data[0]).toMatchObject({ id: made.data.id, title: 'Rates, again' })

    expect(await deleteDraftAs(me, made.data.id)).toEqual({ ok: true, data: null })
    expect(await deleteDraftAs(me, made.data.id)).toMatchObject({ ok: false, code: 'NOT_FOUND' })
  })

  it('keeps a draft whose community cannot be asked, without its tags', async () => {
    // Only the drafts' route: the community's request fails.
    state.routes = MOCK_ROUTES.filter((route) => route.path.includes('drafts'))
    const result = await listDraftsOf(me, DEMO_USER.username)
    if (!result.ok) throw new Error('expected ok')
    expect(result.data.find((draft) => draft.id === SEED_DRAFT_ID)?.community).toMatchObject({
      handle: '#macro',
      tags: [],
    })
  })
})
