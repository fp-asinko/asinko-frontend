import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { pollItem, postItem } from '../feed-items.fixture'
import { FeedItems } from './feed-items'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))
vi.mock('../actions/load-comments-preview.action', () => ({ loadCommentsPreview: vi.fn() }))
vi.mock('../actions/vote-post.action', () => ({ votePost: vi.fn() }))
vi.mock('../actions/vote-poll.action', () => ({ votePoll: vi.fn() }))

describe('FeedItems', () => {
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
})
