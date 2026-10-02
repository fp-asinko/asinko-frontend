import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loadCommentsPreview } from './load-comments-preview.action'

const deps = vi.hoisted(() => ({
  getCommentsPreview: vi.fn(),
  setRequestLocale: vi.fn(),
}))
vi.mock('../lib/comments-api', () => ({ getCommentsPreview: deps.getCommentsPreview }))
vi.mock('next-intl/server', () => ({ setRequestLocale: deps.setRequestLocale }))

const ID = '00000000-0000-4000-8000-000000000001'

describe('loadCommentsPreview', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects invalid input without calling the API (public endpoint)', async () => {
    for (const raw of [
      null,
      { kind: 'post', id: 'nope', locale: 'en' },
      { kind: 'x', id: ID, locale: 'en' },
      { kind: 'post', id: ID, locale: 'fr' },
    ]) {
      expect(await loadCommentsPreview(raw)).toEqual({ ok: false, error: 'api.errors.INVALID' })
    }
    expect(deps.getCommentsPreview).not.toHaveBeenCalled()
  })

  it('sets the locale and returns the rendered preview', async () => {
    deps.getCommentsPreview.mockResolvedValue({ ok: true, data: [] })
    const result = await loadCommentsPreview({ kind: 'post', id: ID, locale: 'es' })
    expect(deps.setRequestLocale).toHaveBeenCalledWith('es')
    expect(result.ok).toBe(true)
  })

  it('returns the translation key of a failure, never a backend message', async () => {
    deps.getCommentsPreview.mockResolvedValue({
      ok: false,
      kind: 'unexpected',
      code: 'HTTP',
      errorKey: 'api.errors.UNAVAILABLE',
      endpoint: 'GET /api/v1/posts/:id/comments',
    })
    expect(await loadCommentsPreview({ kind: 'post', id: ID, locale: 'en' })).toEqual({
      ok: false,
      error: 'api.errors.UNAVAILABLE',
    })
  })
})
