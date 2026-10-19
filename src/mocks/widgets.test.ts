// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { widgetSchema } from '@/lib/api/contract'
import { DEMO_USER } from './demo-user'
import { communityBySlug } from './fixtures/communities'
import { listWidgets, saveWidgets, signCommunityImageUpload } from './widgets'

const me = DEMO_USER.id
const items = (slug: string) =>
  (listWidgets(slug).body as { items: Array<{ id: string; type: string }> }).items
const code = (response: { body?: unknown }) =>
  (response.body as { error?: { code: string; index?: number; field?: string } }).error

describe('widgets mock (P-028, specs/community-widgets)', () => {
  it('lists a group widgets in their order, one of each type, every one in the contract', () => {
    const list = items('trading-on-chain')
    expect(list.map((widget) => widget.type)).toEqual([
      'TEXT',
      'RULES',
      'BUTTONS',
      'COMMUNITIES',
      'IMAGES',
      'CALENDAR',
    ])
    for (const widget of list) expect(widgetSchema.safeParse(widget).success).toBe(true)
    expect(items('latam')).toEqual([])
    expect(listWidgets('nowhere')).toMatchObject({ status: 404 })
  })

  it('saves the whole list for a moderator, giving new ones an id and resolving communities', () => {
    const defi = communityBySlug('defi')!.id
    const saved = saveWidgets('trading-on-chain', {
      userId: me,
      items: [
        { type: 'TEXT', title: 'Hi', body: 'Hello' },
        { type: 'COMMUNITIES', title: 'See also', communityIds: [defi] },
      ],
    })
    expect(saved.status).toBe(200)
    const [text, communities] = (saved.body as { items: Array<Record<string, unknown>> }).items
    expect(text!.id).toMatch(/^w-new-/)
    expect(communities).toMatchObject({
      communities: [{ id: defi, memberCount: expect.any(Number) }],
    })
  })

  it('says which widget and which field break the proposal', () => {
    const save = (widget: Record<string, unknown>) =>
      code(
        saveWidgets('trading-on-chain', {
          userId: me,
          items: [{ type: 'TEXT', title: 'Ok', body: 'Ok' }, widget],
        }),
      )
    expect(save({ type: 'TEXT', title: '', body: 'x' })).toMatchObject({
      code: 'INVALID_WIDGET',
      index: 1,
      field: 'title',
    })
    expect(
      save({ type: 'BUTTONS', title: 'L', buttons: [{ label: 'x', url: 'javascript:1' }] }),
    ).toMatchObject({ field: 'buttons' })
    expect(
      save({ type: 'BUTTONS', title: 'L', buttons: [{ label: 'x', url: '//evil.com' }] }),
    ).toMatchObject({ field: 'buttons' })
    expect(
      save({
        type: 'CALENDAR',
        title: 'E',
        events: [{ title: 'x', startsAt: 'soon', allDay: false }],
      }),
    ).toMatchObject({ field: 'events' })
    expect(save({ type: 'POLL', title: 'x' })).toMatchObject({ field: 'type' })
    const many = Array.from({ length: 21 }, () => ({ type: 'TEXT', title: 'x', body: 'x' }))
    expect(code(saveWidgets('trading-on-chain', { userId: me, items: many }))).toMatchObject({
      code: 'TOO_MANY_WIDGETS',
    })
  })

  it('refuses someone who does not moderate, or another user', () => {
    expect(code(saveWidgets('macro', { userId: me, items: [] }))).toMatchObject({
      code: 'NOT_MODERATOR',
    })
    expect(code(saveWidgets('trading-on-chain', { userId: 'x', items: [] }))).toMatchObject({
      code: 'USER_MISMATCH',
    })
  })

  it('signs a widget image only for a moderator of that community (P-029)', () => {
    const body = { userId: me, contentType: 'image/webp', size: 1000 }
    expect(
      signCommunityImageUpload({ ...body, communityId: communityBySlug('trading-on-chain')!.id }),
    ).toMatchObject({ status: 200 })
    expect(
      signCommunityImageUpload({ ...body, communityId: communityBySlug('macro')!.id }),
    ).toMatchObject({ status: 403 })
    expect(
      signCommunityImageUpload({
        ...body,
        contentType: 'image/svg+xml',
        communityId: communityBySlug('trading-on-chain')!.id,
      }),
    ).toMatchObject({ status: 422 })
  })
})
