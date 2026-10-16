import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { draftKey } from '../lib/draft-key'
import {
  clearDraft,
  forgetOpenedDraft,
  hasText,
  useStoredDraft,
  writeDraft,
} from './use-post-draft'

const KEY = draftKey('u1')
const DRAFT = {
  community: { id: 'c1', slug: 'defi', handle: '#defi', name: 'DeFi', own: false },
  type: 'TEXT' as const,
  title: 'A title',
  body: 'A body',
  url: '',
  savedAt: 1,
}

describe('the post draft (specs/submit-page SU-12)', () => {
  afterEach(() => {
    clearDraft(KEY)
    vi.restoreAllMocks()
  })

  it('is kept per person, and read back as it was when the page opened', () => {
    expect(KEY).toBe('asinko:post-draft:u1')
    writeDraft(KEY, DRAFT)
    const { result } = renderHook(() => useStoredDraft(KEY))
    // A draft from before related ones existed reads with none (specs/related-tags RT-06).
    expect(result.current).toEqual({ ...DRAFT, related: [] })
    // What is saved while writing is not offered back on the same visit.
    writeDraft(KEY, { ...DRAFT, title: 'Newer' })
    expect(renderHook(() => useStoredDraft(KEY)).result.current?.title).toBe('A title')
    // The next visit reads it again.
    forgetOpenedDraft(KEY)
    expect(renderHook(() => useStoredDraft(KEY)).result.current?.title).toBe('Newer')
  })

  it('keeps the related ones (specs/related-tags RT-06)', () => {
    writeDraft(KEY, { ...DRAFT, related: ['$GGAL', '#macro'] })
    expect(renderHook(() => useStoredDraft(KEY)).result.current?.related).toEqual([
      '$GGAL',
      '#macro',
    ])
    clearDraft(KEY)
  })

  it('offers nothing without a key, without text, or with something unreadable', () => {
    expect(renderHook(() => useStoredDraft(null)).result.current).toBeNull()
    writeDraft(KEY, { ...DRAFT, title: ' ', body: '' })
    expect(renderHook(() => useStoredDraft(KEY)).result.current).toBeNull()
    clearDraft(KEY)
    localStorage.setItem(KEY, '{not json')
    expect(renderHook(() => useStoredDraft(KEY)).result.current).toBeNull()
  })

  it('keeps working when the browser refuses its storage (private mode)', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied')
    })
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied')
    })
    expect(() => writeDraft(KEY, DRAFT)).not.toThrow()
    expect(renderHook(() => useStoredDraft(KEY)).result.current).toBeNull()
  })

  it('counts a title, a body or a link as something written', () => {
    expect(hasText({ title: '', body: '', url: '' })).toBe(false)
    expect(hasText({ title: '', body: '', url: 'https://x.com' })).toBe(true)
  })
})
