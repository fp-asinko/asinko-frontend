// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { removePostImageAction, uploadPostImageAction } from './upload-post-image.action'

const deps = vi.hoisted(() => ({
  viewer: { id: '00000000-0000-4000-8000-000000000101', username: 'maria' } as {
    id: string
    username: string
  } | null,
  uploadPostImage: vi.fn(),
  removePostImage: vi.fn(),
}))
vi.mock('@/lib/session', () => ({
  getViewer: async () => deps.viewer,
  getAccessToken: async () => 'user-token',
}))
vi.mock('@/lib/storage/post-images', () => ({
  uploadPostImage: deps.uploadPostImage,
  removePostImage: deps.removePostImage,
}))

const WEBP = [...'RIFF']
  .map((c) => c.charCodeAt(0))
  .concat(
    [0, 0, 0, 0],
    [...'WEBP'].map((c) => c.charCodeAt(0)),
  )
const JPEG = [0xff, 0xd8, 0xff, 0xe0]
const PNG = [0x89, 0x50, 0x4e, 0x47]

function form(bytes: number[], type = 'image/webp', extra = 0) {
  const data = new FormData()
  data.set('file', new Blob([new Uint8Array([...bytes, ...new Array(extra).fill(0)])], { type }))
  return data
}

describe('uploadPostImageAction (specs/post-image PI-06, PI-07)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    deps.viewer = { id: '00000000-0000-4000-8000-000000000101', username: 'maria' }
    deps.uploadPostImage.mockResolvedValue({ ok: true, data: { imageUrl: 'https://x/y.webp' } })
  })

  it("uploads a WebP into the viewer's folder with their token, the type read from the bytes", async () => {
    expect(await uploadPostImageAction(form(WEBP, 'image/png'))).toEqual({
      ok: true,
      data: { imageUrl: 'https://x/y.webp' },
    })
    expect(deps.uploadPostImage).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: '00000000-0000-4000-8000-000000000101',
        token: 'user-token',
        contentType: 'image/webp',
      }),
    )
  })

  it('takes the JPEG fallback too', async () => {
    await uploadPostImageAction(form(JPEG))
    expect(deps.uploadPostImage).toHaveBeenCalledWith(
      expect.objectContaining({ contentType: 'image/jpeg' }),
    )
  })

  it('refuses another file whatever type it claims, an empty one or one too large', async () => {
    for (const data of [form(PNG, 'image/webp'), form([])]) {
      expect(await uploadPostImageAction(data)).toEqual({
        ok: false,
        error: 'composer.errors.imageType',
      })
    }
    expect(await uploadPostImageAction(form(WEBP, 'image/webp', 4 * 1024 * 1024))).toEqual({
      ok: false,
      error: 'composer.errors.imageTooLarge',
    })
    expect(await uploadPostImageAction(new FormData())).toMatchObject({ ok: false })
    expect(deps.uploadPostImage).not.toHaveBeenCalled()
  })

  it('asks for a session, and says when Storage fails', async () => {
    deps.viewer = null
    expect(await uploadPostImageAction(form(WEBP))).toEqual({
      ok: false,
      error: 'api.errors.UNAUTHENTICATED',
    })
    deps.viewer = { id: '00000000-0000-4000-8000-000000000101', username: 'maria' }
    deps.uploadPostImage.mockResolvedValue({ ok: false })
    expect(await uploadPostImageAction(form(WEBP))).toEqual({
      ok: false,
      error: 'composer.errors.imageUpload',
    })
  })
})

describe('removePostImageAction (Q1)', () => {
  beforeEach(() => vi.clearAllMocks())

  it("removes from the viewer's folder, and only a URL", async () => {
    deps.viewer = { id: '00000000-0000-4000-8000-000000000101', username: 'maria' }
    expect(await removePostImageAction({ imageUrl: 'https://x/y.webp' })).toEqual({
      ok: true,
      data: null,
    })
    expect(deps.removePostImage).toHaveBeenCalledWith({
      userId: '00000000-0000-4000-8000-000000000101',
      token: 'user-token',
      imageUrl: 'https://x/y.webp',
    })
    expect(await removePostImageAction({ imageUrl: 'javascript:alert(1)' })).toMatchObject({
      ok: false,
    })
  })

  it('asks for a session', async () => {
    deps.viewer = null
    expect(await removePostImageAction({ imageUrl: 'https://x/y.webp' })).toEqual({
      ok: false,
      error: 'api.errors.UNAUTHENTICATED',
    })
  })
})
