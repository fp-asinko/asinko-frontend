import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEMO_USER } from '@/mocks/demo-user'
import { findWidgetCommunities } from './find-widget-communities.action'
import { saveWidgets } from './save-widgets.action'
import { uploadWidgetImage } from './upload-widget-image.action'

const deps = vi.hoisted(() => ({
  getViewer: vi.fn(),
  saveWidgetsAs: vi.fn(),
  searchWidgetCommunities: vi.fn(),
  uploadSignedImage: vi.fn(),
}))
vi.mock('@/lib/session', () => ({ getViewer: deps.getViewer }))
vi.mock('../lib/widgets-api', () => ({ saveWidgetsAs: deps.saveWidgetsAs }))
vi.mock('../lib/community-search', () => ({
  searchWidgetCommunities: deps.searchWidgetCommunities,
}))
vi.mock('@/lib/uploads/signed-image-upload', () => ({ uploadSignedImage: deps.uploadSignedImage }))

const failure = (code: string, extra: Record<string, unknown> = {}) => ({
  ok: false,
  kind: 'expected',
  code,
  errorKey: `api.errors.${code}`,
  endpoint: 'PUT /api/v1/communities/:slug/widgets',
  ...extra,
})

const text = { type: 'TEXT', title: 'Hi', body: 'Hello' }
const event = {
  type: 'CALENDAR',
  title: 'E',
  events: [
    {
      title: 'FOMC',
      startsAt: '2026-10-28T00:00:00.000Z',
      endsAt: '',
      allDay: true,
      location: '',
      url: '',
    },
  ],
}

describe('saveWidgets (specs/community-widgets CW-12, CW-13)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    deps.getViewer.mockResolvedValue(DEMO_USER)
    deps.saveWidgetsAs.mockResolvedValue({ ok: true, data: [] })
  })

  it('saves the whole list as the viewer of the session, empties as null', async () => {
    expect(await saveWidgets({ slug: 'macro', items: [text, event], userId: 'x' })).toEqual({
      ok: true,
      data: [],
    })
    expect(deps.saveWidgetsAs).toHaveBeenCalledWith(DEMO_USER.id, 'macro', [
      text,
      {
        ...event,
        events: [{ ...event.events[0], endsAt: null, location: null, url: null }],
      },
    ])
  })

  it('marks the widget its schema refuses, by its position, before the session', async () => {
    const result = await saveWidgets({ slug: 'macro', items: [text, { ...text, title: '' }] })
    expect(result).toMatchObject({
      ok: false,
      fieldErrors: { '1': ['communities.widgets.errors.titleRequired'] },
    })
    expect(deps.getViewer).not.toHaveBeenCalled()
  })

  it('says why the backend refused: not a moderator, or which widget', async () => {
    deps.saveWidgetsAs.mockResolvedValue(failure('NOT_MODERATOR'))
    expect(await saveWidgets({ slug: 'macro', items: [] })).toEqual({
      ok: false,
      error: 'communities.widgets.errors.notModerator',
    })
    deps.saveWidgetsAs.mockResolvedValue(failure('INVALID_WIDGET', { index: 0, field: 'buttons' }))
    expect(await saveWidgets({ slug: 'macro', items: [text] })).toMatchObject({
      fieldErrors: { '0': ['communities.widgets.errors.invalidButtons'] },
    })
    deps.saveWidgetsAs.mockResolvedValue(failure('TOO_MANY_WIDGETS'))
    expect(await saveWidgets({ slug: 'macro', items: [text] })).toMatchObject({
      error: 'communities.widgets.errors.tooManyWidgets',
    })
  })

  it('asks for a session', async () => {
    deps.getViewer.mockResolvedValue(null)
    expect(await saveWidgets({ slug: 'macro', items: [] })).toEqual({
      ok: false,
      error: 'api.errors.UNAUTHENTICATED',
    })
  })
})

describe('findWidgetCommunities (CW-10)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    deps.getViewer.mockResolvedValue(DEMO_USER)
  })

  it('searches with a session; an empty search finds nothing without asking', async () => {
    deps.searchWidgetCommunities.mockResolvedValue({ ok: true, data: [{ id: 'c1' }] })
    expect(await findWidgetCommunities(' def ')).toEqual({ ok: true, data: [{ id: 'c1' }] })
    expect(deps.searchWidgetCommunities).toHaveBeenCalledWith('def')
    expect(await findWidgetCommunities('')).toEqual({ ok: true, data: [] })
    deps.getViewer.mockResolvedValue(null)
    expect(await findWidgetCommunities('def')).toMatchObject({ ok: false })
  })
})

describe('uploadWidgetImage (CW-11, P-029)', () => {
  const COMMUNITY = '00000000-0000-4000-8000-000000001009'
  const webp = () =>
    new Blob([new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50])], {
      type: 'image/webp',
    })
  const form = (fields: Record<string, string | Blob>) => {
    const data = new FormData()
    for (const [key, value] of Object.entries(fields)) data.set(key, value)
    return data
  }

  beforeEach(() => {
    vi.clearAllMocks()
    deps.getViewer.mockResolvedValue(DEMO_USER)
    deps.uploadSignedImage.mockResolvedValue({ ok: true, data: { imageUrl: '/a.webp' } })
  })

  it('uploads with the group, as the viewer of the session', async () => {
    expect(await uploadWidgetImage(form({ file: webp(), communityId: COMMUNITY }))).toEqual({
      ok: true,
      data: { imageUrl: '/a.webp' },
    })
    expect(deps.uploadSignedImage).toHaveBeenCalledWith(
      '/api/v1/uploads/community-image',
      expect.objectContaining({ userId: DEMO_USER.id, extra: { communityId: COMMUNITY } }),
    )
  })

  it('refuses something that is not an image, or without its group', async () => {
    const svg = new Blob(['<svg/>'], { type: 'image/svg+xml' })
    expect(await uploadWidgetImage(form({ file: svg, communityId: COMMUNITY }))).toMatchObject({
      error: 'communities.widgets.errors.imageType',
    })
    expect(await uploadWidgetImage(form({ file: webp(), communityId: 'x' }))).toMatchObject({
      ok: false,
    })
    expect(deps.uploadSignedImage).not.toHaveBeenCalled()
  })
})
