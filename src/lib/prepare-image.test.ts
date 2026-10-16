import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cropImage, MAX_UPLOAD_BYTES, prepareImage } from './prepare-image'

/** jsdom has no image decoding nor canvas: doubles that keep what they were asked. */
const canvas = vi.hoisted(() => ({
  drawn: [] as number[][],
  types: [] as string[],
  result: (type: string): Blob | null => new Blob(['x'], { type }),
}))

function stubBitmap(width: number, height: number) {
  vi.stubGlobal(
    'createImageBitmap',
    vi.fn(async () => ({ width, height, close: vi.fn() })),
  )
}

beforeEach(() => {
  canvas.drawn = []
  canvas.types = []
  canvas.result = (type) => new Blob(['x'], { type })
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    drawImage: (_: unknown, ...numbers: number[]) => canvas.drawn.push(numbers),
  } as never)
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (callback, type) {
    canvas.types.push(type ?? '')
    callback(canvas.result(type ?? ''))
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

const file = (type: string) => new File(['bytes'], 'photo', { type })

describe('prepareImage (specs/post-image PI-03, PI-05)', () => {
  it('shrinks the longest side to 2048px and gives WebP', async () => {
    stubBitmap(4096, 3072)
    const result = await prepareImage(file('image/jpeg'))
    expect(result).toMatchObject({ ok: true, width: 2048, height: 1536 })
    if (result.ok) expect(result.blob.type).toBe('image/webp')
    expect(canvas.drawn).toEqual([[0, 0, 2048, 1536]])
  })

  it('keeps a small image at its size, oriented as the photo says', async () => {
    stubBitmap(800, 600)
    expect(await prepareImage(file('image/png'))).toMatchObject({ width: 800, height: 600 })
    expect(createImageBitmap).toHaveBeenCalledWith(expect.any(File), {
      imageOrientation: 'from-image',
    })
  })

  it('falls back to JPEG where the browser cannot write WebP', async () => {
    stubBitmap(800, 600)
    canvas.result = (type) => new Blob(['x'], { type: type === 'image/webp' ? 'image/png' : type })
    const result = await prepareImage(file('image/webp'))
    if (!result.ok) throw new Error('expected an image')
    expect(result.blob.type).toBe('image/jpeg')
    expect(canvas.types).toEqual(['image/webp', 'image/jpeg'])
  })

  it('refuses other types before reading them', async () => {
    stubBitmap(10, 10)
    for (const type of ['image/gif', 'image/svg+xml', 'application/pdf', '']) {
      expect(await prepareImage(file(type))).toEqual({ ok: false, error: 'type' })
    }
    expect(createImageBitmap).not.toHaveBeenCalled()
  })

  it('says when the file cannot be read or is still too large', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn().mockRejectedValue(new Error('broken')))
    expect(await prepareImage(file('image/png'))).toEqual({ ok: false, error: 'unreadable' })

    stubBitmap(2048, 2048)
    canvas.result = (type) => new Blob([new Uint8Array(MAX_UPLOAD_BYTES + 1)], { type })
    expect(await prepareImage(file('image/png'))).toEqual({ ok: false, error: 'tooLarge' })
  })
})

describe('cropImage (specs/profile-presentation PP-07)', () => {
  it('draws the chosen part at the final size, as WebP', async () => {
    stubBitmap(3000, 2000)
    const area = { x: 100, y: 50, width: 800, height: 800 }
    expect(await cropImage(file('image/jpeg'), area, { width: 400, height: 400 })).toMatchObject({
      ok: true,
      width: 400,
      height: 400,
    })
    expect(canvas.drawn).toEqual([[100, 50, 800, 800, 0, 0, 400, 400]])
    expect(canvas.types).toEqual(['image/webp'])
    expect(createImageBitmap).toHaveBeenCalledWith(expect.anything(), {
      imageOrientation: 'from-image',
    })
  })

  it('refuses other types, and says when it cannot read it or it is too large', async () => {
    const area = { x: 0, y: 0, width: 10, height: 10 }
    const size = { width: 1500, height: 375 }
    expect(await cropImage(file('image/svg+xml'), area, size)).toEqual({ ok: false, error: 'type' })
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => Promise.reject(new Error('x'))),
    )
    expect(await cropImage(file('image/png'), area, size)).toEqual({
      ok: false,
      error: 'unreadable',
    })
    stubBitmap(10, 10)
    canvas.result = (type) => new Blob([new Uint8Array(MAX_UPLOAD_BYTES + 1)], { type })
    expect(await cropImage(file('image/png'), area, size)).toEqual({ ok: false, error: 'tooLarge' })
  })
})
