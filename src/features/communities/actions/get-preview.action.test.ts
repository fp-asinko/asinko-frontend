import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getPreview } from './get-preview.action'

const deps = vi.hoisted(() => ({ getPreviewData: vi.fn() }))
vi.mock('../lib/preview-api', () => ({ getPreviewData: deps.getPreviewData }))

describe('getPreview (specs/mention-preview MP-12)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects what the page attribute should never hold, before the API', async () => {
    for (const raw of [
      null,
      'macro',
      { kind: 'post', slug: 'x' },
      { kind: 'group', slug: '../admin' },
      { kind: 'user', slug: 'x'.repeat(65) },
    ]) {
      expect(await getPreview(raw)).toEqual({ ok: false, error: 'api.errors.INVALID' })
    }
    expect(deps.getPreviewData).not.toHaveBeenCalled()
  })

  it('answers the card, or the error key when it fails', async () => {
    const data = { community: { slug: 'macro' }, profile: null }
    deps.getPreviewData.mockResolvedValue({ ok: true, data })
    expect(await getPreview({ kind: 'group', slug: 'macro' })).toEqual({ ok: true, data })
    expect(deps.getPreviewData).toHaveBeenCalledWith({ kind: 'group', slug: 'macro' })

    deps.getPreviewData.mockResolvedValue({ ok: false, errorKey: 'api.errors.UNAVAILABLE' })
    expect(await getPreview({ kind: 'asset', slug: 'BTC' })).toEqual({
      ok: false,
      error: 'api.errors.UNAVAILABLE',
    })
  })
})
