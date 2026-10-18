import { cleanup, render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { previewPost } from './preview-post.action'

const deps = vi.hoisted(() => ({ viewer: null as { id: string; username: string } | null }))
vi.mock('@/lib/session', () => ({ getViewer: async () => deps.viewer }))
vi.mock('next-intl/server', () => ({ setRequestLocale: vi.fn() }))
// The card has its own tests: here, what it is given.
vi.mock('../components/post-card', () => ({
  PostCard: ({ post, variant }: { post: Record<string, unknown>; variant: string }) => (
    <pre data-variant={variant}>{JSON.stringify(post)}</pre>
  ),
}))

const DRAFT = {
  title: ' Rates ',
  body: 'Ask @maria about $BTC.',
  type: 'TEXT',
  community: { slug: 'defi', handle: '#defi', name: 'DeFi', own: false },
  locale: 'en',
}

async function cardOf(raw: unknown) {
  const result = await previewPost(raw)
  if (!result.ok) throw new Error(result.error)
  cleanup()
  render(result.data.card as ReactElement)
  const card = screen.getByText(/"kind":"post"/)
  return { variant: card.dataset.variant, post: JSON.parse(card.textContent ?? '{}') }
}

describe('previewPost (specs/submit-tools ST-01, ST-02)', () => {
  beforeEach(() => {
    deps.viewer = { id: '00000000-0000-4000-8000-000000000100', username: 'demo' }
  })

  it("is the feed's card of the post being written, by the viewer, at zero", async () => {
    const { variant, post } = await cardOf(DRAFT)
    expect(variant).toBe('preview')
    expect(post).toMatchObject({
      title: 'Rates',
      author: { username: 'demo', handle: '@demo', path: '/user/demo' },
      community: { slug: 'defi', handle: '#defi', kind: 'group', path: '/hub/defi' },
      score: 0,
      commentCount: 0,
      media: null,
    })
  })

  it('shows the mentions in bold without a link: the backend resolves them on publishing', async () => {
    const { post } = await cardOf(DRAFT)
    expect(post.body).toBe('Ask [@maria](asinko:ticker) about [$BTC](asinko:ticker).')
  })

  it('shows a link only http(s), with its real domain, and an asset community as one', async () => {
    const { post } = await cardOf({
      ...DRAFT,
      type: 'LINK',
      url: 'https://www.example.com/report',
      community: { slug: 'XAU/USD', handle: '$XAU/USD', name: 'Gold', own: false },
    })
    expect(post.media).toEqual({
      type: 'link',
      url: 'https://www.example.com/report',
      domain: 'example.com',
    })
    expect(post.community).toMatchObject({ kind: 'asset', path: '/asset/XAU%2FUSD' })
    const bad = await cardOf({ ...DRAFT, type: 'LINK', url: 'javascript:alert(1)' })
    expect(bad.post.media).toBeNull()
  })

  it('refuses a draft without title or body, odd input and no session', async () => {
    expect(await previewPost({ ...DRAFT, title: ' ' })).toEqual({
      ok: false,
      error: 'api.errors.INVALID',
    })
    expect(await previewPost({ ...DRAFT, locale: 'fr' })).toMatchObject({ ok: false })
    deps.viewer = null
    expect(await previewPost(DRAFT)).toEqual({ ok: false, error: 'api.errors.UNAUTHENTICATED' })
  })
})
