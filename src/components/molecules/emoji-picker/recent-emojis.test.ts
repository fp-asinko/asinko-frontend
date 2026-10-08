import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readRecentEmojis, rememberEmoji, RECENT_MAX } from './recent-emojis'

describe('recent emojis (specs/emoji-picker EP-05)', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  it('keeps the newest first, once each, up to 16', () => {
    rememberEmoji('🚀')
    rememberEmoji('🔥')
    rememberEmoji('🚀')
    expect(readRecentEmojis()).toEqual(['🚀', '🔥'])
    for (let i = 0; i < 20; i++) rememberEmoji(String(i))
    expect(readRecentEmojis()).toHaveLength(RECENT_MAX)
    expect(readRecentEmojis()[0]).toBe('19')
  })

  it('reads nothing from an odd value, and survives a blocked storage', () => {
    localStorage.setItem('asinko:recent-emojis', '{"not":"a list"}')
    expect(readRecentEmojis()).toEqual([])
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(readRecentEmojis()).toEqual([])
    expect(rememberEmoji('🔥')).toEqual(['🔥'])
  })
})
