// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { thesisArgumentsQuerySchema } from './thesis-arguments-query.schema'

describe('thesisArgumentsQuerySchema (specs/thesis-arguments TA-01, TA-03)', () => {
  it('takes a side and an order from the URL', () => {
    expect(thesisArgumentsQuerySchema.parse({ side: 'contra', sort: 'new' })).toEqual({
      side: 'contra',
      sort: 'new',
    })
  })

  it('is For and Best when missing or unknown, never throwing', () => {
    expect(thesisArgumentsQuerySchema.parse({})).toEqual({ side: 'pro', sort: 'best' })
    expect(thesisArgumentsQuerySchema.parse({ side: 'maybe', sort: ['x'] })).toEqual({
      side: 'pro',
      sort: 'best',
    })
  })
})
