import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { draftKey, thesisDraftKey } from '../lib/draft-key'
import { useStoredDraft, writeDraft } from './use-post-draft'
import {
  clearDraft,
  discardDraft,
  forgetOpenedDraft,
  hasThesisText,
  useStoredThesisDraft,
  writeThesisDraft,
  type ThesisDraft,
} from './use-thesis-draft'

const KEY = thesisDraftKey('u1')
const NVDA = { id: 'a1', slug: 'NVDA', handle: '$NVDA', name: 'NVIDIA', own: false }
const DRAFT: ThesisDraft = {
  community: NVDA,
  asset: NVDA,
  claim: 'NVDA above 200',
  direction: 'ABOVE',
  targetPrice: '200',
  deadline: '2026-12-31',
  conviction: 'HIGH',
  reasoning: 'Demand.',
  savedAt: 1,
}

describe('the thesis draft (specs/thesis-create TC-10)', () => {
  afterEach(() => {
    clearDraft(KEY)
    clearDraft(draftKey('u1'))
    forgetOpenedDraft(KEY)
  })

  it('is kept per person apart from the post draft, and read back as the page opened', () => {
    expect(KEY).toBe('asinko:thesis-draft:u1')
    writeThesisDraft(KEY, DRAFT)
    writeDraft(draftKey('u1'), {
      community: null,
      type: 'TEXT',
      title: 'A post',
      body: '',
      url: '',
      savedAt: 1,
    })
    expect(renderHook(() => useStoredThesisDraft(KEY)).result.current).toEqual(DRAFT)
    expect(renderHook(() => useStoredDraft(draftKey('u1'))).result.current?.title).toBe('A post')
  })

  it('offers nothing without text, broken, or once discarded', () => {
    expect(hasThesisText({ claim: ' ', targetPrice: '', reasoning: '' })).toBe(false)
    writeThesisDraft(KEY, { ...DRAFT, claim: '', targetPrice: '', reasoning: '' })
    expect(renderHook(() => useStoredThesisDraft(KEY)).result.current).toBeNull()

    forgetOpenedDraft(KEY)
    window.localStorage.setItem(KEY, '{broken')
    expect(renderHook(() => useStoredThesisDraft(KEY)).result.current).toBeNull()

    forgetOpenedDraft(KEY)
    discardDraft(KEY)
    writeThesisDraft(KEY, DRAFT)
    expect(window.localStorage.getItem(KEY)).toBeNull()
  })

  it('is none without a session', () => {
    expect(renderHook(() => useStoredThesisDraft(null)).result.current).toBeNull()
  })
})
