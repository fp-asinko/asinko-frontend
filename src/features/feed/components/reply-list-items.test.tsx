import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import type { UserReply } from '../feed.types'
import { ReplyListItems } from './reply-list-items'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

const reply = (overrides: Partial<UserReply> = {}): UserReply => ({
  id: 'r1',
  body: 'Agree, **rates** are up.',
  score: 3,
  createdAt: new Date().toISOString(),
  edited: false,
  where: {
    title: 'Rates are up',
    path: '/post/p1/rates-are-up#comment-r1',
    community: {
      slug: 'defi',
      name: 'DeFi',
      handle: '#defi',
      path: '/hub/defi',
      avatarUrl: null,
      kind: 'group',
      personal: false,
      viewerIsMember: null,
    },
  },
  ...overrides,
})

describe('ReplyListItems (specs/backend-adoption BK-03)', () => {
  it('says where each comment is, links to it in its post, and shows what it says', () => {
    renderWithIntl(
      <ul>
        <ReplyListItems replies={[reply()]} />
      </ul>,
    )
    const article = screen.getByRole('article', { name: 'In Rates are up · #defi' })
    expect(article).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Rates are up' })).toHaveAttribute(
      'href',
      '/post/p1/rates-are-up#comment-r1',
    )
    expect(screen.getByRole('link', { name: '#defi' })).toHaveAttribute('href', '/hub/defi')
    expect(screen.getByText('rates').tagName).toBe('STRONG')
    expect(article).toHaveTextContent('3 points')
  })

  it("says where without a link when it has no page (a poll's)", () => {
    renderWithIntl(
      <ul>
        <ReplyListItems
          replies={[reply({ where: { title: 'Cut in December?', path: null, community: null } })]}
        />
      </ul>,
    )
    expect(screen.getByText('Cut in December?')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Cut in December?' })).toBeNull()
  })
})
