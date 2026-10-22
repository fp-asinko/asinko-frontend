// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { POSTS } from '@/mocks/fixtures/posts'
import { feedItemSchema, feedPageSchema, impressionsRequestSchema } from './content'

const post = { kind: 'POST', content: POSTS[0] }
const via = {
  id: '11111111-1111-4111-8111-111111111111',
  slug: 'macro',
  name: 'Macro',
  type: 'SYSTEM_CATEGORY',
  avatarUrl: null,
}

describe('feed reason (specs/explore-v1 EX-02)', () => {
  it('reads the four reasons the backend sends', () => {
    const similar = feedItemSchema.parse({
      ...post,
      reason: { type: 'SIMILAR', via, countryCode: null },
    })
    expect(similar.reason).toEqual({ type: 'SIMILAR', via, countryCode: null })
    const country = feedItemSchema.parse({
      ...post,
      reason: { type: 'COUNTRY', via: null, countryCode: 'AR' },
    })
    expect(country.reason?.countryCode).toBe('AR')
  })

  it('keeps an item without a reason, or with an unknown type', () => {
    expect(feedItemSchema.parse(post).reason).toBeUndefined()
    expect(feedItemSchema.parse({ ...post, reason: null }).reason).toBeNull()
    const unknown = { type: 'NEW_POOL', via: null, countryCode: null }
    expect(feedItemSchema.parse({ ...post, reason: unknown }).reason).toEqual(unknown)
  })

  it('never drops the item for a malformed reason: the label goes, the content stays', () => {
    const parsed = feedItemSchema.safeParse({ ...post, reason: { type: 42 } })
    expect(parsed.success).toBe(true)
    expect(parsed.data?.reason).toBeNull()
    const badCountry = feedItemSchema.parse({
      ...post,
      reason: { type: 'COUNTRY', via: null, countryCode: 'argentina' },
    })
    expect(badCountry.reason?.countryCode).toBeNull()
  })
})

describe('feed page', () => {
  it('takes a requestId, null on an empty page, and none on a profile', () => {
    const requestId = '00000000-0000-4000-8000-000000000001'
    expect(feedPageSchema.parse({ items: [], nextCursor: null, requestId }).requestId).toBe(
      requestId,
    )
    expect(feedPageSchema.parse({ items: [], nextCursor: null, requestId: null }).requestId).toBe(
      null,
    )
    expect(feedPageSchema.parse({ items: [], nextCursor: null }).requestId).toBeUndefined()
    expect(feedPageSchema.safeParse({ items: [], nextCursor: null, requestId: 'x' }).success).toBe(
      false,
    )
  })
})

describe('impressions request', () => {
  const base = { userId: null, requestId: '00000000-0000-4000-8000-000000000001' }
  const event = { contentId: POSTS[0]!.id, type: 'SEEN', dwellMs: 1200 }

  it('takes between 1 and 100 events', () => {
    expect(impressionsRequestSchema.safeParse({ ...base, events: [event] }).success).toBe(true)
    expect(impressionsRequestSchema.safeParse({ ...base, events: [] }).success).toBe(false)
    const many = Array.from({ length: 101 }, () => event)
    expect(impressionsRequestSchema.safeParse({ ...base, events: many }).success).toBe(false)
  })

  it('refuses an unknown type and a dwell out of range', () => {
    for (const bad of [
      { ...event, type: 'CLICK' },
      { ...event, dwellMs: -1 },
      { ...event, dwellMs: 1.5 },
      { ...event, dwellMs: 60 * 60 * 1000 + 1 },
    ]) {
      expect(impressionsRequestSchema.safeParse({ ...base, events: [bad] }).success).toBe(false)
    }
  })
})
