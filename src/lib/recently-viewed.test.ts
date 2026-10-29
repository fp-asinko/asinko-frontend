import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearRecent,
  readRecent,
  RECENT_MAX,
  recordRecent,
  subscribeRecent,
  type RecentItem,
} from './recently-viewed'

const item = (id: string, overrides: Partial<RecentItem> = {}) => ({
  id,
  href: `/post/${id}/title`,
  label: '#macro',
  title: `Post ${id}`,
  kind: 'post' as const,
  score: 1,
  comments: 0,
  ...overrides,
})

describe('recently viewed (specs/recently-viewed)', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  it('puts the last opened first, once, with its latest numbers, up to 10 (RV-03, RV-04)', () => {
    recordRecent(item('a'), new Date('2026-10-08T10:00:00Z'))
    recordRecent(item('b'))
    recordRecent(item('a', { score: 9 }), new Date('2026-10-08T11:00:00Z'))
    const list = readRecent()
    expect(list.map((each) => each.id)).toEqual(['a', 'b'])
    expect(list[0]).toMatchObject({ score: 9, viewedAt: '2026-10-08T11:00:00.000Z' })

    for (let i = 0; i < 15; i++) recordRecent(item(String(i)))
    expect(readRecent()).toHaveLength(RECENT_MAX)
    expect(readRecent()[0]!.id).toBe('14')
  })

  it('gives the same array while nothing changed (useSyncExternalStore)', () => {
    recordRecent(item('a'))
    expect(readRecent()).toBe(readRecent())
  })

  it('clears the list (RV-05)', () => {
    recordRecent(item('a'))
    clearRecent()
    expect(readRecent()).toEqual([])
  })

  it('drops what does not look like ours: odd fields or a page from somewhere else', () => {
    const good = { ...item('a'), viewedAt: '2026-10-08T10:00:00.000Z' }
    localStorage.setItem(
      'asinko:recently-viewed',
      JSON.stringify([
        good,
        { ...good, id: 'b', href: 'https://evil.example/post/x' },
        { ...good, id: 'c', href: '//evil.example' },
        { ...good, id: 'c2', href: '/post/../admin' },
        { ...good, id: 'c3', href: '/post/x?next=https://evil.example' },
        { ...good, id: 'c4', title: 'x'.repeat(301) },
        { ...good, id: 'd', score: 'many' },
        { ...good, id: 'e', kind: 'ad' },
        'nonsense',
      ]),
    )
    expect(readRecent().map((each) => each.id)).toEqual(['a'])
    localStorage.setItem('asinko:recently-viewed', '{not json')
    expect(readRecent()).toEqual([])
  })

  it('leaves out an item with nothing to show: a thought saved before its text was', () => {
    const good = { ...item('a'), viewedAt: '2026-10-26T10:00:00.000Z' }
    localStorage.setItem(
      'asinko:recently-viewed',
      JSON.stringify([good, { ...good, id: 'b', title: '' }, { ...good, id: 'c', title: '  ' }]),
    )
    expect(readRecent().map((each) => each.id)).toEqual(['a'])
  })

  it('keeps a thought, its text as its title (specs/thoughts)', () => {
    recordRecent(item('t', { kind: 'thought', title: 'Rates first, risk later.' }))
    expect(readRecent()).toEqual([expect.objectContaining({ id: 't', kind: 'thought' })])
  })

  it('keeps a post whose title has no letters (its slug is empty: /post/{id}/)', () => {
    recordRecent(item('emoji', { href: '/post/emoji/', title: '🚀🚀🚀' }))
    expect(readRecent().map((each) => each.id)).toEqual(['emoji'])
  })

  it('reads nothing from a broken value', () => {
    localStorage.setItem('asinko:recently-viewed', '{not json')
    expect(readRecent()).toEqual([])
  })

  it('survives a blocked storage: nothing kept, nothing thrown (RV-05)', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(() => recordRecent(item('a'))).not.toThrow()
    expect(readRecent()).toEqual([])
  })

  it('tells its listeners about changes in this tab and in others (RV-06)', () => {
    const onChange = vi.fn()
    const stop = subscribeRecent(onChange)
    recordRecent(item('a'))
    expect(onChange).toHaveBeenCalledTimes(1)
    window.dispatchEvent(new StorageEvent('storage', { key: 'asinko:recently-viewed' }))
    window.dispatchEvent(new StorageEvent('storage', { key: 'something-else' }))
    expect(onChange).toHaveBeenCalledTimes(2)
    stop()
    clearRecent()
    expect(onChange).toHaveBeenCalledTimes(2)
  })
})
