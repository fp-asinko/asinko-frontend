// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { parseProfileTab } from './profile-tab.schema'

describe('profile tab (specs/profile-track-record PT-04)', () => {
  it('reads Theses from the URL and falls back to Posts for anything else', () => {
    expect(parseProfileTab({ tab: 'theses' })).toBe('theses')
    expect(parseProfileTab({ tab: 'posts' })).toBe('posts')
    expect(parseProfileTab({})).toBe('posts')
    // Replies, since specs/backend-adoption BK-03.
    expect(parseProfileTab({ tab: 'replies' })).toBe('replies')
    expect(parseProfileTab({ tab: 'all' })).toBe('posts')
    expect(parseProfileTab({ tab: ['theses', 'posts'] })).toBe('posts')
    expect(parseProfileTab(undefined)).toBe('posts')
  })
})
