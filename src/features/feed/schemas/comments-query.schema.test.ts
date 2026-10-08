// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { commentsQuerySchema } from './comments-query.schema'

const parse = (raw: Record<string, unknown>) => commentsQuerySchema.parse(raw)

describe('commentsQuerySchema (specs/post-detail-refresh PD-04, PD-06)', () => {
  it('reads each order, and best by default or when unknown', () => {
    for (const sort of ['best', 'top', 'new', 'old']) expect(parse({ sort }).sort).toBe(sort)
    expect(parse({}).sort).toBe('best')
    expect(parse({ sort: 'hot' }).sort).toBe('best')
    expect(parse({ sort: ['new', 'old'] }).sort).toBe('new')
  })

  it('searches from 2 to 100 characters, trimmed; anything else is no search', () => {
    expect(parse({ q: '  eth  ' }).q).toBe('eth')
    expect(parse({ q: 'e' }).q).toBeUndefined()
    expect(parse({ q: 'x'.repeat(101) }).q).toBeUndefined()
    expect(parse({}).q).toBeUndefined()
    expect(parse({ q: ['btc', 'eth'] }).q).toBe('btc')
  })
})
