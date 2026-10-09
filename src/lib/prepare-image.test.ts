import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MAX_UPLOAD_BYTES, prepareImage } from './prepare-image'

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
    drawImage: (_: unknown, x: number, y: number, w: number, h: number) =>
      canvas.drawn.push([x, y, w, h]),
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
