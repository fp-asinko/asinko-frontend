// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { createApiClient } from '@/lib/api/create-client'
import { draftSchema } from '@/lib/api/contract'
import { noContentSchema, paginatedSchema } from '@/lib/api/schemas'
import { DEMO_USER } from './demo-user'
import { MOCK_EXTENSIONS, MOCK_ROUTES } from './handlers'
import {
  isThesisDraftId,
  SEED_THESIS_DRAFT_ID,
  takeThesisDraft,
  thesisDraftsOf,
} from './thesis-drafts'

// Through the real client: the routes' `when` decides what is mocked (P-038, specs/thesis-drafts).
const offline = () => Promise.reject(new Error('offline'))
const missing = MOCK_ROUTES.filter((route) => !route.implemented)
const api = (routes = MOCK_ROUTES, fetch: typeof globalThis.fetch = offline) =>
  createApiClient({ baseUrl: 'http://mock', fetch, mocks: routes, extensions: MOCK_EXTENSIONS })

describe("a thesis's drafts, mocked (P-038)", () => {
  it('knows its ids', () => {
    expect(isThesisDraftId(SEED_THESIS_DRAFT_ID)).toBe(true)
    expect(isThesisDraftId('00000000-0000-4000-8000-000000008900')).toBe(false)
    expect(isThesisDraftId(undefined)).toBe(false)
  })

  it('saves, updates and deletes one, and lists it among the posts', async () => {
    const saved = await api()({
      method: 'POST',
      path: '/api/v1/drafts',
      body: {
        userId: DEMO_USER.id,
        type: 'THESIS',
        title: 'BTC above 150K',
        thesis: { assetSymbol: 'BTC', targetPrice: 150000, targetDirection: 'ABOVE' },
      },
      schema: draftSchema,
    })
    if (!saved.ok) throw new Error('expected ok')
    expect(saved.data.thesis).toMatchObject({ assetSymbol: 'BTC', targetDirection: 'ABOVE' })

    const updated = await api()({
      method: 'PATCH',
      path: '/api/v1/drafts/:draftId',
      params: { draftId: saved.data.id },
      body: { userId: DEMO_USER.id, type: 'THESIS', title: 'BTC above 160K' },
      schema: draftSchema,
    })
    expect(updated).toMatchObject({ ok: true, data: { title: 'BTC above 160K' } })

    const list = await api()({
      method: 'GET',
      path: '/api/v1/users/:userId/drafts',
      params: { userId: DEMO_USER.id },
      schema: paginatedSchema(draftSchema),
    })
    if (!list.ok) throw new Error('expected ok')
    expect(list.data.items[0]?.id).toBe(saved.data.id)
    expect(list.data.items.some((each) => each.type === 'TEXT')).toBe(true)

    await api()({
      method: 'DELETE',
      path: '/api/v1/drafts/:draftId',
      params: { draftId: saved.data.id },
      query: { userId: DEMO_USER.id },
      schema: noContentSchema,
    })
    expect(thesisDraftsOf(DEMO_USER.id).some((each) => each.id === saved.data.id)).toBe(false)
  })

  it("with API_MOCKS=missing, adds them to the backend's list and leaves a post's draft to it", async () => {
    const backend: typeof globalThis.fetch = async () =>
      new Response(JSON.stringify({ items: [], nextCursor: null }), {
        headers: { 'content-type': 'application/json' },
      })
    const list = await api(
      missing,
      backend,
    )({
      method: 'GET',
      path: '/api/v1/users/:userId/drafts',
      params: { userId: DEMO_USER.id },
      schema: paginatedSchema(draftSchema),
    })
    if (!list.ok) throw new Error('expected ok')
    expect(list.data.items.every((each) => each.type === 'THESIS')).toBe(true)

    // A post's draft is not mocked: it reaches the network (here, offline).
    const post = await api(missing)({
      method: 'POST',
      path: '/api/v1/drafts',
      body: { userId: DEMO_USER.id, type: 'TEXT', title: 'x' },
      schema: draftSchema,
    })
    expect(post).toMatchObject({ ok: false, code: 'NETWORK' })
  })

  it("takes a person's own draft to publish it, never someone else's", () => {
    expect(takeThesisDraft(SEED_THESIS_DRAFT_ID, '00000000-0000-4000-8000-000000000999')).toBe(
      false,
    )
  })
})
