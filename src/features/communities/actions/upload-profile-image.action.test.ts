// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MAX_UPLOAD_BYTES } from '@/lib/prepare-image'
import { uploadProfileImage } from './upload-profile-image.action'

const ME = '00000000-0000-4000-8000-000000000100'
const deps = vi.hoisted(() => ({
  viewer: null as { id: string; username: string } | null,
  uploadSignedImage: vi.fn(),
}))
vi.mock('@/lib/session', () => ({ getViewer: async () => deps.viewer }))
vi.mock('@/lib/uploads/signed-image-upload', () => ({ uploadSignedImage: deps.uploadSignedImage }))

const WEBP = [...'RIFF']
  .map((c) => c.charCodeAt(0))
  .concat(
    [0, 0, 0, 0],
    [...'WEBP'].map((c) => c.charCodeAt(0)),
  )
const PNG = [0x89, 0x50, 0x4e, 0x47]

function form(kind: string, bytes: number[], extra = 0) {
  const data = new FormData()
  data.set('kind', kind)
  data.set('file', new Blob([new Uint8Array([...bytes, ...new Array(extra).fill(0)])]))
  return data
}

describe('uploadProfileImage (specs/profile-presentation PP-07, P-021)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    deps.viewer = { id: ME, username: 'demo' }
    deps.uploadSignedImage.mockResolvedValue({ ok: true, data: { imageUrl: '/a.webp' } })
  })

  it('uploads the photo or the banner for the viewer, each to its place', async () => {
    expect(await uploadProfileImage(form('avatar', WEBP))).toEqual({
      ok: true,
      data: { imageUrl: '/a.webp' },
    })
    expect(deps.uploadSignedImage).toHaveBeenCalledWith(
      '/api/v1/uploads/avatar',
      expect.objectContaining({ userId: ME, contentType: 'image/webp' }),
    )
    await uploadProfileImage(form('banner', WEBP))
    expect(deps.uploadSignedImage).toHaveBeenLastCalledWith(
      '/api/v1/uploads/profile-banner',
      expect.anything(),
    )
  })

  it('refuses another kind, another file, an empty one or one too large, before asking', async () => {
    expect(await uploadProfileImage(form('cover', WEBP))).toMatchObject({
      error: 'communities.edit.errors.imageType',
    })
    expect(await uploadProfileImage(form('avatar', PNG))).toMatchObject({
      error: 'communities.edit.errors.imageType',
    })
    expect(await uploadProfileImage(form('avatar', []))).toMatchObject({
      error: 'communities.edit.errors.imageType',
    })
    expect(await uploadProfileImage(form('avatar', WEBP, MAX_UPLOAD_BYTES))).toMatchObject({
      error: 'communities.edit.errors.imageTooLarge',
    })
    expect(deps.uploadSignedImage).not.toHaveBeenCalled()
  })

  it('asks for a session, and says what failed', async () => {
    deps.viewer = null
    expect(await uploadProfileImage(form('avatar', WEBP))).toEqual({
      ok: false,
      error: 'api.errors.UNAUTHENTICATED',
    })
    deps.viewer = { id: ME, username: 'demo' }
    deps.uploadSignedImage.mockResolvedValue({ ok: false, error: 'upload' })
    expect(await uploadProfileImage(form('avatar', WEBP))).toEqual({
      ok: false,
      error: 'communities.edit.errors.imageUpload',
    })
  })
})
