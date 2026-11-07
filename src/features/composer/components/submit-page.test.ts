// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { checkSubmitSegment, parseSubmitQuery } from './submit-page'

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NOT_FOUND')
  },
}))
vi.mock('@/i18n/navigation', () => ({
  permanentRedirect: ({ href, locale }: { href: string; locale: string }) => {
    throw new Error(`REDIRECT ${locale}${href}`)
  },
}))
vi.mock('@/lib/session', () => ({ getViewer: vi.fn() }))
vi.mock('../lib/submit-community', () => ({ getSubmitCommunity: vi.fn() }))
// The editor brings the API client and its environment: not this test's.
vi.mock('./submit-editor-loader', () => ({ SubmitEditorLoader: () => null }))
// The page reads whether thesis drafts are mocked (specs/thesis-drafts TD-08).
vi.mock('@/env', () => ({ env: { API_MOCKS: 'all' } }))

describe('the page to create a post: its URL (specs/submit-page SU-01)', () => {
  it('reads the community and the format, leaving anything odd out', () => {
    expect(parseSubmitQuery({ community: 'defi', type: 'link' })).toEqual({
      community: 'defi',
      type: 'link',
      related: [],
    })
    // The thesis's tab too (specs/thesis-create TC-01).
    expect(parseSubmitQuery({ type: 'thesis' }).type).toBe('thesis')
    // The thesis it answers, only as an id (specs/thesis-agree AG-11).
    const id = '00000000-0000-4000-8000-000000000001'
    expect(parseSubmitQuery({ type: 'thesis', counter: id }).counter).toBe(id)
    expect(parseSubmitQuery({ type: 'thesis', counter: '../x' }).counter).toBeUndefined()
    expect(parseSubmitQuery({ community: ['BTC', 'ETH'], type: 'video' })).toEqual({
      community: 'BTC',
      type: undefined,
      related: [],
    })
    expect(parseSubmitQuery({ community: '', type: undefined })).toEqual({
      community: undefined,
      type: undefined,
      related: [],
    })
  })

  it('reads up to three related ones, valid, without repeats or the main one (RA-04)', () => {
    expect(parseSubmitQuery({ community: 'defi', related: 'BTC,macro' }).related).toEqual([
      'BTC',
      'macro',
    ])
    expect(
      parseSubmitQuery({ community: 'defi', related: 'defi,BTC,BTC,,a b,XAU/USD,macro,eth' })
        .related,
    ).toEqual(['BTC', 'XAU/USD', 'macro'])
  })

  it("keeps each locale's word: the other one redirects with its query, or is a 404", () => {
    expect(() => checkSubmitSegment('submit', 'en', {})).not.toThrow()
    expect(() => checkSubmitSegment('publicar', 'es', {})).not.toThrow()
    expect(() => checkSubmitSegment('submit', 'es', { community: 'defi' })).toThrow(
      'REDIRECT es/publicar?community=defi',
    )
    expect(() => checkSubmitSegment('submit', 'pt', {})).toThrow('REDIRECT pt/publicar')
    expect(() => checkSubmitSegment('publicar', 'en', {})).toThrow('NOT_FOUND')
  })
})
