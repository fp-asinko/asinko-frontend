// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { MOCK_POST_IMAGE } from '@/mocks/post-image'
import { removePostImage, uploadPostImage } from './post-images'

vi.mock('@/env', () => ({ env: { API_MOCKS: false } }))
vi.mock('@sentry/nextjs', () => ({ captureMessage: vi.fn() }))

const USER = '00000000-0000-4000-8000-000000000101'
const BASE = 'https://project.supabase.co'

function deps(response: Response | Error, mocked = false) {
  const fetch = vi.fn(async () => {
    if (response instanceof Error) throw response
    return response
  })
  return { fetch, deps: { baseUrl: BASE, anonKey: 'anon', fetch, mocked } }
}

const body = new Blob(['webp'], { type: 'image/webp' })

describe('uploadPostImage (specs/post-image PI-07)', () => {
  it("puts the file in the user's folder with their token and answers its public URL", async () => {
    const { fetch, deps: d } = deps(new Response('{}', { status: 200 }))
    const result = await uploadPostImage(
      { userId: USER, token: 'user-token', body, contentType: 'image/webp' },
      d,
    )
    if (!result.ok) throw new Error('expected an upload')
    expect(result.data.imageUrl).toMatch(
      new RegExp(`^${BASE}/storage/v1/object/public/post-images/${USER}/[0-9a-f-]{36}\\.webp$`),
    )
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toMatch(new RegExp(`^${BASE}/storage/v1/object/post-images/${USER}/`))
    expect(init.method).toBe('POST')
    expect(init.headers).toMatchObject({
      Authorization: 'Bearer user-token',
      apikey: 'anon',
      'Content-Type': 'image/webp',
      'x-upsert': 'false',
    })
  })

  it('names a JPEG fallback .jpg', async () => {
    const { deps: d } = deps(new Response('{}'))
    const result = await uploadPostImage(
      { userId: USER, token: 't', body, contentType: 'image/jpeg' },
      d,
    )
    expect(result.ok && result.data.imageUrl.endsWith('.jpg')).toBe(true)
  })

  it('fails without throwing when Storage refuses or the network breaks', async () => {
    for (const response of [new Response('no', { status: 403 }), new Error('offline')]) {
      const { deps: d } = deps(response)
      expect(
        await uploadPostImage({ userId: USER, token: 't', body, contentType: 'image/webp' }, d),
      ).toEqual({ ok: false })
    }
  })

  it('answers a fixture image with every route mocked, without the network', async () => {
    const { fetch, deps: d } = deps(new Response('{}'), true)
    expect(
      await uploadPostImage({ userId: USER, token: 't', body, contentType: 'image/webp' }, d),
    ).toEqual({ ok: true, data: { imageUrl: MOCK_POST_IMAGE } })
    expect(fetch).not.toHaveBeenCalled()
  })
})

describe('removePostImage (Q1)', () => {
  const url = (name: string, user = USER) =>
    `${BASE}/storage/v1/object/public/post-images/${user}/${name}`

  it("deletes a file of the user's own folder", async () => {
    const { fetch, deps: d } = deps(new Response('{}'))
    expect(
      await removePostImage({ userId: USER, token: 't', imageUrl: url('a1-b2.webp') }, d),
    ).toEqual({ ok: true, data: null })
    const [target, init] = fetch.mock.calls[0] as unknown as [string, RequestInit]
    expect(target).toBe(`${BASE}/storage/v1/object/post-images/${USER}/a1-b2.webp`)
    expect(init.method).toBe('DELETE')
  })

  it("never touches another folder, a path or another host's file", async () => {
    const { fetch, deps: d } = deps(new Response('{}'))
    for (const imageUrl of [
      url('a1.webp', '00000000-0000-4000-8000-000000000999'),
      url('../other/a1.webp'),
      url('nested/a1.webp'),
      'https://evil.example/post-images/a1.webp',
    ]) {
      expect(await removePostImage({ userId: USER, token: 't', imageUrl }, d)).toEqual({
        ok: false,
      })
    }
    expect(fetch).not.toHaveBeenCalled()
  })
})
