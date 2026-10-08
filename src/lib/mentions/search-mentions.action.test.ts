import { beforeEach, describe, expect, it, vi } from 'vitest'
import { searchMentions } from './search-mentions.action'

const deps = vi.hoisted(() => ({ searchMentionOptions: vi.fn() }))
vi.mock('./mentions-api', () => deps)

describe('searchMentions (specs/mention-autocomplete MA-10)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('searches with the trimmed query', async () => {
    deps.searchMentionOptions.mockResolvedValue({ ok: true, data: [] })
    expect(await searchMentions({ kind: 'asset', q: ' bt ' })).toEqual({ ok: true, data: [] })
    expect(deps.searchMentionOptions).toHaveBeenCalledWith('asset', 'bt')
  })

  it('rejects an odd input before anything else', async () => {
    for (const raw of [
      null,
      { kind: 'post', q: 'x' },
      { kind: 'user', q: ' ' },
      { kind: 'user', q: 'x'.repeat(33) },
    ]) {
      expect(await searchMentions(raw)).toEqual({ ok: false, error: 'api.errors.INVALID' })
    }
    expect(deps.searchMentionOptions).not.toHaveBeenCalled()
  })

  it('returns a failure as its translation key', async () => {
    deps.searchMentionOptions.mockResolvedValue({
      ok: false,
      kind: 'unexpected',
      code: 'NETWORK',
      errorKey: 'api.errors.UNAVAILABLE',
      endpoint: 'GET /api/v1/search',
    })
    expect(await searchMentions({ kind: 'user', q: 'mar' })).toEqual({
      ok: false,
      error: 'api.errors.UNAVAILABLE',
    })
  })
})
