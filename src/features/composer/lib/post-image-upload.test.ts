// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { uploadPostImage } from './post-image-upload'

const api = vi.hoisted(() => ({ apiRequest: vi.fn() }))
vi.mock('@/lib/api', () => api)
vi.mock('@/env', () => ({ env: { API_MOCKS: false, SUPABASE_URL: 'https://project.supabase.co' } }))
vi.mock('@sentry/nextjs', () => ({ captureMessage: vi.fn() }))

const USER = '00000000-0000-4000-8000-000000000101'
const STORAGE = 'https://project.supabase.co'
const UPLOAD = `${STORAGE}/storage/v1/object/upload/sign/post-images/${USER}/a.webp?token=t`
const IMAGE = `${STORAGE}/storage/v1/object/public/post-images/${USER}/a.webp`
const body = new Blob(['webp'], { type: 'image/webp' })

function deps(response: Response | Error, mocked = false) {
  const fetch = vi.fn(async () => {
    if (response instanceof Error) throw response
    return response
  })
  return { fetch, deps: { fetch, storageOrigin: STORAGE, mocked } }
}

describe('uploadPostImage (specs/backend-answer-1013 BA-01, BA-02)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.apiRequest.mockResolvedValue({
      ok: true,
      data: { uploadUrl: UPLOAD, imageUrl: IMAGE, path: `${USER}/a.webp` },
    })
  })

  it('asks the backend for a signed URL, PUTs the bytes there and answers the image URL', async () => {
    const { fetch, deps: d } = deps(new Response(null, { status: 200 }))
    const result = await uploadPostImage({ userId: USER, body, contentType: 'image/webp' }, d)
    expect(result).toEqual({ ok: true, data: { imageUrl: IMAGE } })
    expect(api.apiRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        path: '/api/v1/uploads/post-image',
        body: { userId: USER, contentType: 'image/webp', size: body.size },
      }),
    )
    expect(fetch).toHaveBeenCalledWith(
      UPLOAD,
      expect.objectContaining({ method: 'PUT', headers: { 'Content-Type': 'image/webp' }, body }),
    )
  })

  it('says the type or size is wrong on a 422, and asks for an account on a 401', async () => {
    const { fetch, deps: d } = deps(new Response(null))
    api.apiRequest.mockResolvedValueOnce({ ok: false, kind: 'expected', code: 'INVALID' })
    expect(await uploadPostImage({ userId: USER, body, contentType: 'image/webp' }, d)).toEqual({
      ok: false,
      error: 'type',
    })
    api.apiRequest.mockResolvedValueOnce({ ok: false, kind: 'expected', code: 'UNAUTHENTICATED' })
    expect(await uploadPostImage({ userId: USER, body, contentType: 'image/webp' }, d)).toEqual({
      ok: false,
      error: 'unauthenticated',
    })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('fails as an upload when the backend or Storage fail (502 STORAGE_ERROR, network)', async () => {
    api.apiRequest.mockResolvedValueOnce({ ok: false, kind: 'unexpected', code: 'HTTP' })
    const first = deps(new Response(null))
    expect(
      await uploadPostImage({ userId: USER, body, contentType: 'image/webp' }, first.deps),
    ).toMatchObject({ ok: false, error: 'upload' })
    const second = deps(new Response(null, { status: 400 }))
    expect(
      await uploadPostImage({ userId: USER, body, contentType: 'image/webp' }, second.deps),
    ).toMatchObject({ ok: false, error: 'upload' })
    const third = deps(new TypeError('fetch failed'))
    expect(
      await uploadPostImage({ userId: USER, body, contentType: 'image/webp' }, third.deps),
    ).toMatchObject({ ok: false, error: 'upload' })
  })

  it('never sends the bytes anywhere but our own Storage, over https', async () => {
    for (const uploadUrl of [
      'https://elsewhere.example/put',
      'http://project.supabase.co/x',
      'nope',
    ]) {
      api.apiRequest.mockResolvedValueOnce({
        ok: true,
        data: { uploadUrl, imageUrl: IMAGE, path: 'x' },
      })
      const { fetch, deps: d } = deps(new Response(null))
      expect(
        await uploadPostImage({ userId: USER, body, contentType: 'image/webp' }, d),
      ).toMatchObject({ ok: false, error: 'upload' })
      expect(fetch).not.toHaveBeenCalled()
    }
  })

  it("sends nothing to a mocked route's placeholder, and refuses it without mocks", async () => {
    api.apiRequest.mockResolvedValue({
      ok: true,
      data: {
        uploadUrl: 'https://storage.mock.invalid/upload/a.webp',
        imageUrl: IMAGE,
        path: 'a.webp',
      },
    })
    const mocked = deps(new Response(null), true)
    expect(
      await uploadPostImage({ userId: USER, body, contentType: 'image/webp' }, mocked.deps),
    ).toEqual({ ok: true, data: { imageUrl: IMAGE } })
    expect(mocked.fetch).not.toHaveBeenCalled()

    const real = deps(new Response(null))
    expect(
      await uploadPostImage({ userId: USER, body, contentType: 'image/webp' }, real.deps),
    ).toEqual({ ok: false, error: 'upload' })
    expect(real.fetch).not.toHaveBeenCalled()
  })
})
