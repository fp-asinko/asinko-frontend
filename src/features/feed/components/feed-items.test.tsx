import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { pollItem, postItem, thesisItem } from '../feed-items.fixture'
import { FeedItems } from './feed-items'

vi.mock('@/lib/communities/join-community.action', () => ({ joinCommunity: vi.fn() }))
vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))
vi.mock('../actions/load-comments-preview.action', () => ({ loadCommentsPreview: vi.fn() }))
vi.mock('../actions/vote-post.action', () => ({ votePost: vi.fn() }))
vi.mock('../actions/vote-comment.action', () => ({ voteComment: vi.fn() }))
vi.mock('../actions/vote-thesis.action', () => ({ voteThesis: vi.fn() }))
vi.mock('../actions/vote-poll.action', () => ({ votePoll: vi.fn() }))
vi.mock('../actions/cancel-thesis.action', () => ({ cancelThesis: vi.fn() }))

describe('FeedItems', () => {
  it('draws a thesis with its card, and "⋯" only when its author can cancel it (TD-12)', () => {
    renderWithIntl(
      <ul>
        <FeedItems
          items={[
            thesisItem({ id: 'a', claim: 'Mine, open', canCancel: true }),
            thesisItem({ id: 'b', claim: 'Someone else’s' }),
          ]}
        />
      </ul>,
    )
    expect(screen.getByRole('article', { name: 'Mine, open' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /^Options for the thesis/ })).toHaveLength(1)
    expect(
      screen.getByRole('button', { name: 'Options for the thesis Mine, open' }),
    ).toBeInTheDocument()
  })

  it('renders each item as a list item with the card of its kind', () => {
    const { container } = renderWithIntl(
      <ul>
        <FeedItems items={[postItem(), pollItem()]} />
      </ul>,
    )
    const cards = container.querySelectorAll(':scope > ul > li > article')
    expect(cards).toHaveLength(2)
    expect(
      screen.getByRole('article', { name: 'Whales accumulated 48,000 $BTC' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('article', { name: 'Where does $BTC close 2026?' })).toBeInTheDocument()
  })

  it('shows first-page images at once and fades in the ones loaded later (D-M1)', () => {
    const withImage = postItem({ media: { type: 'image', url: '/mocks/chart.svg', alt: null } })
    const { unmount } = renderWithIntl(
      <ul>
        <FeedItems items={[withImage]} />
      </ul>,
    )
    expect(screen.getByRole('img', { name: 'Whales accumulated 48,000 $BTC' })).not.toHaveClass(
      'opacity-0',
    )
    unmount()

    renderWithIntl(
      <ul>
        <FeedItems items={[withImage]} later />
      </ul>,
    )
    expect(screen.getByRole('img', { name: 'Whales accumulated 48,000 $BTC' })).toHaveClass(
      'opacity-0',
    )
  })
})
