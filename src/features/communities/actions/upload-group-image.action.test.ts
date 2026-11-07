// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MAX_UPLOAD_BYTES } from '@/lib/prepare-image'
import { uploadGroupImage } from './upload-group-image.action'

const ME = '00000000-0000-4000-8000-000000000100'
const GROUP = '00000000-0000-4000-8000-000000000200'
const deps = vi.hoisted(() => ({
  viewer: null as { id: string; username: string } | null,
  uploadSignedImage: vi.fn(),
  updateGroupImageAs: vi.fn(),
}))
vi.mock('@/lib/session', () => ({ getViewer: async () => deps.viewer }))
vi.mock('@/lib/uploads/signed-image-upload', () => ({ uploadSignedImage: deps.uploadSignedImage }))
vi.mock('../lib/update-group-images', () => ({ updateGroupImageAs: deps.updateGroupImageAs }))

const WEBP = [...'RIFF']
  .map((c) => c.charCodeAt(0))
  .concat(
    [0, 0, 0, 0],
    [...'WEBP'].map((c) => c.charCodeAt(0)),
  )

type Fields = Partial<Record<'communityId' | 'slug' | 'kind', string>>

function form(fields: Fields = {}, bytes = WEBP, extra = 0) {
  const data = new FormData()
  const all = { communityId: GROUP, slug: 'options-flow', kind: 'banner', ...fields }
  for (const [key, value] of Object.entries(all)) data.set(key, value)
  data.set('file', new Blob([new Uint8Array([...bytes, ...new Array(extra).fill(0)])]))
  return data
}

describe('uploadGroupImage (specs/community-create CG-11)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    deps.viewer = { id: ME, username: 'demo' }
    deps.uploadSignedImage.mockResolvedValue({ ok: true, data: { imageUrl: '/up.webp' } })
    deps.updateGroupImageAs.mockResolvedValue({ ok: true, data: { imageUrl: '/kept.webp' } })
  })

  it('uploads for the group, then saves it with the URL the response gives', async () => {
    expect(await uploadGroupImage(form())).toEqual({ ok: true, data: { imageUrl: '/kept.webp' } })
    expect(deps.uploadSignedImage).toHaveBeenCalledWith(
      '/api/v1/uploads/community-image',
      expect.objectContaining({
        userId: ME,
        contentType: 'image/webp',
        extra: { communityId: GROUP },
      }),
    )
    expect(deps.updateGroupImageAs).toHaveBeenCalledWith(ME, 'options-flow', 'banner', '/up.webp')
  })

  it('asks for a session, a valid input and an image of up to 4 MB, before asking', async () => {
    deps.viewer = null
    expect(await uploadGroupImage(form())).toEqual({
      ok: false,
      error: 'api.errors.UNAUTHENTICATED',
    })
    deps.viewer = { id: ME, username: 'demo' }
    for (const bad of [{ communityId: 'x' }, { slug: '../a' }, { kind: 'cover' }]) {
      expect(await uploadGroupImage(form(bad))).toMatchObject({
        error: 'createGroup.errors.imageType',
      })
    }
    expect(await uploadGroupImage(form({}, [0x89, 0x50]))).toMatchObject({
      error: 'createGroup.errors.imageType',
    })
    expect(await uploadGroupImage(form({}, WEBP, MAX_UPLOAD_BYTES))).toMatchObject({
      error: 'createGroup.errors.imageTooLarge',
    })
    expect(deps.uploadSignedImage).not.toHaveBeenCalled()
  })

  it('says why the upload or the saving failed', async () => {
    deps.uploadSignedImage.mockResolvedValue({ ok: false, error: 'upload' })
    expect(await uploadGroupImage(form())).toEqual({
      ok: false,
      error: 'createGroup.errors.imageUpload',
    })
    expect(deps.updateGroupImageAs).not.toHaveBeenCalled()

    deps.uploadSignedImage.mockResolvedValue({ ok: true, data: { imageUrl: '/up.webp' } })
    deps.updateGroupImageAs.mockResolvedValue({ ok: false, errorKey: 'api.errors.UNAVAILABLE' })
    expect(await uploadGroupImage(form())).toEqual({ ok: false, error: 'api.errors.UNAVAILABLE' })
  })
})
