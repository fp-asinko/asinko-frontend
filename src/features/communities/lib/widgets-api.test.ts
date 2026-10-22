import { describe, expect, it, vi } from 'vitest'
import { DEMO_USER } from '@/mocks/demo-user'
import { MOCK_ROUTES } from '@/mocks/handlers'
import { getWidgets, saveWidgetsAs, toWidget } from './widgets-api'

// The real client against the mock routes (P-028); a route left out reaches a fetch that fails.
const state = vi.hoisted(() => ({ viewer: { id: 'demo' } as unknown }))
vi.mock('@/lib/session', () => ({ getViewer: async () => state.viewer }))
vi.mock('@/lib/api', async () => {
  const { createApiClient } = await import('@/lib/api/create-client')
  const { keepValidItems: keepValid } = await import('@/lib/api/helpers')
  return {
    keepValidItems: (items: unknown[], schema: never) => keepValid(items, schema, () => {}),
    apiRequest: (request: Parameters<ReturnType<typeof createApiClient>>[0]) =>
      createApiClient({
        baseUrl: 'http://mock',
        fetch: () => Promise.reject(new Error('offline')),
        mocks: MOCK_ROUTES,
      })(request),
  }
})

describe('widgets-api (P-028, specs/community-widgets)', () => {
  it("maps a group's widgets in their order, every link and image checked", async () => {
    const widgets = await getWidgets('trading-on-chain')
    if (!widgets) throw new Error('expected widgets')
    expect(widgets.map((widget) => widget.type)).toEqual([
      'TEXT',
      'RULES',
      'BUTTONS',
      'COMMUNITIES',
      'IMAGES',
      'CALENDAR',
    ])
    const buttons = widgets.find((widget) => widget.type === 'BUTTONS')
    expect(buttons).toMatchObject({
      buttons: [
        { label: 'Dune dashboard', link: { external: true, host: 'dune.com' } },
        { label: 'DeFi', link: { url: '/hub/defi', external: false } },
      ],
    })
    const communities = widgets.find((widget) => widget.type === 'COMMUNITIES')
    expect(communities).toMatchObject({
      communities: [{ handle: '#defi', path: '/hub/defi', viewerIsMember: true }, {}, {}],
    })
  })

  it('says it could not ask them, not that there are none', async () => {
    // A slug that cannot be asked (checked before the network); a real group without any, [].
    expect(await getWidgets('../nowhere')).toBeNull()
    expect(await getWidgets('a-real-group')).toEqual([])
  })

  it('drops a button or an image that is not allowed; an event keeps itself without its link', () => {
    const base = { id: 'w', title: 'x' }
    expect(
      toWidget({ ...base, type: 'BUTTONS', buttons: [{ label: 'x', url: 'javascript:1' }] }, true),
    ).toMatchObject({ buttons: [] })
    expect(
      toWidget(
        {
          ...base,
          type: 'IMAGES',
          images: [{ imageUrl: 'https://evil.example/a.png', alt: 'x', linkUrl: null }],
        },
        true,
      ),
    ).toMatchObject({ images: [] })
    expect(
      toWidget(
        {
          ...base,
          type: 'CALENDAR',
          events: [
            {
              title: 'x',
              startsAt: '2026-10-21T21:00:00.000Z',
              endsAt: null,
              allDay: false,
              location: null,
              url: 'data:x',
            },
          ],
        },
        true,
      ),
    ).toMatchObject({ events: [{ title: 'x', link: null }] })
  })

  it('without a session, Join does not know if the viewer is a member', () => {
    const widget = toWidget(
      {
        id: 'w',
        title: 'x',
        type: 'COMMUNITIES',
        communities: [
          {
            id: '00000000-0000-4000-8000-000000001001',
            slug: 'defi',
            name: 'DeFi',
            type: 'USER_PUBLIC',
            avatarUrl: null,
            viewerMembership: 'MEMBER',
            memberCount: 3,
          },
        ],
      },
      false,
    )
    expect(widget).toMatchObject({ communities: [{ viewerIsMember: null }] })
  })

  it('saves the whole list for a moderator, and says why not otherwise', async () => {
    const saved = await saveWidgetsAs(DEMO_USER.id, 'trading-on-chain', [
      { type: 'TEXT', title: 'Hi', body: 'Hello' },
    ])
    expect(saved).toMatchObject({ ok: true, data: [{ type: 'TEXT', title: 'Hi' }] })
    expect(await saveWidgetsAs(DEMO_USER.id, 'macro', [])).toMatchObject({
      ok: false,
      code: 'NOT_MODERATOR',
    })
  })
})
