import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { ApiRequestError, invalidInput, unexpectedFailure } from './errors'
import { getOrThrow, keepValidItems } from './helpers'

describe('getOrThrow', () => {
  it('returns the data of a successful result', () => {
    expect(getOrThrow({ ok: true, data: 42 })).toBe(42)
  })

  it('throws ApiRequestError with the failure, for error.tsx', () => {
    const failure = unexpectedFailure('GET /api/v1/feed/explore', 'TIMEOUT')
    expect(() => getOrThrow(failure)).toThrow(ApiRequestError)
    try {
      getOrThrow(failure)
    } catch (error) {
      expect((error as ApiRequestError).failure).toBe(failure)
    }
  })
})

describe('keepValidItems', () => {
  const postSchema = z.object({ id: z.string(), title: z.string() })

  it('keeps every item when all are valid, without reporting', () => {
    const onDropped = vi.fn()
    const items = [
      { id: '1', title: 'a' },
      { id: '2', title: 'b' },
    ]
    expect(keepValidItems(items, postSchema, onDropped)).toEqual(items)
    expect(onDropped).not.toHaveBeenCalled()
  })

  it('drops invalid items and reports how many and which fields broke', () => {
    const onDropped = vi.fn()
    const items = [{ id: '1', title: 'a' }, { id: 2, title: 'b' }, { id: '3' }]
    expect(keepValidItems(items, postSchema, onDropped)).toEqual([{ id: '1', title: 'a' }])
    expect(onDropped).toHaveBeenCalledWith(2, ['id', 'title'])
  })
})

describe('invalidInput', () => {
  it('is an expected INVALID failure for the endpoint', () => {
    expect(invalidInput('GET /api/v1/profiles/:identifier')).toEqual({
      ok: false,
      kind: 'expected',
      endpoint: 'GET /api/v1/profiles/:identifier',
      code: 'INVALID',
      errorKey: 'api.errors.INVALID',
    })
  })
})
