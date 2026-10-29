// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

const deps = vi.hoisted(() => ({
  viewer: null as { id: string; username: string } | null,
  uploadSignedImage: vi.fn(),
  saveAvatar: vi.fn(),
}))
vi.mock('@/lib/session', () => ({ getViewer: async () => deps.viewer }))
vi.mock('@/lib/uploads/signed-image-upload', () => ({ uploadSignedImage: deps.uploadSignedImage }))
vi.mock('../lib/profile-api', () => ({ saveAvatar: deps.saveAvatar }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

const { setAvatar } = await import('./set-avatar.action')

// The first bytes of a WebP file (RIFF....WEBP).
const WEBP = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 1, 2])
const form = (bytes: Uint8Array<ArrayBuffer>) => {
  const body = new FormData()
  body.set('file', new Blob([bytes]))
  return body
}

describe('setAvatar (specs/auth AU-21)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    deps.viewer = { id: 'user-1', username: 'ana_perez' }
    deps.uploadSignedImage.mockResolvedValue({ ok: true, data: { imageUrl: 'https://img/a.webp' } })
    deps.saveAvatar.mockResolvedValue(true)
  })

  it('uploads the photo for the session user and saves its URL in the profile', async () => {
    expect(await setAvatar(form(WEBP))).toEqual({ ok: true, data: null })
    expect(deps.uploadSignedImage).toHaveBeenCalledWith(
      '/api/v1/uploads/avatar',
      expect.objectContaining({ userId: 'user-1', contentType: 'image/webp' }),
    )
    expect(deps.saveAvatar).toHaveBeenCalledWith('user-1', 'https://img/a.webp')
  })

  it('needs a profile', async () => {
    deps.viewer = null
    expect(await setAvatar(form(WEBP))).toEqual({ ok: false, error: 'auth.errors.noSession' })
  })

  it('refuses what is not an image by its bytes, and what is too large', async () => {
    expect(await setAvatar(form(new Uint8Array([60, 115, 118, 103])))).toEqual({
      ok: false,
      error: 'auth.errors.photoType',
    })
    expect(await setAvatar(form(new Uint8Array(5 * 1024 * 1024)))).toEqual({
      ok: false,
      error: 'auth.errors.photoTooLarge',
    })
    expect(deps.uploadSignedImage).not.toHaveBeenCalled()
  })

  it('says the upload failed when uploading or saving fails', async () => {
    deps.uploadSignedImage.mockResolvedValueOnce({ ok: false, error: 'upload' })
    expect(await setAvatar(form(WEBP))).toEqual({ ok: false, error: 'auth.errors.photoUpload' })
    deps.saveAvatar.mockResolvedValueOnce(false)
    expect(await setAvatar(form(WEBP))).toEqual({ ok: false, error: 'auth.errors.photoUpload' })
  })
})
