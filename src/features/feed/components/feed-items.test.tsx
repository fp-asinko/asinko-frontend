import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { pollItem, postItem } from '../feed-items.fixture'
import { FeedItems } from './feed-items'

vi.mock('@/lib/communities/join-community.action', () => ({ joinCommunity: vi.fn() }))
vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))
vi.mock('../actions/load-comments-preview.action', () => ({ loadCommentsPreview: vi.fn() }))
vi.mock('../actions/vote-post.action', () => ({ votePost: vi.fn() }))
vi.mock('../actions/vote-comment.action', () => ({ voteComment: vi.fn() }))
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

  it('shows first-page images at once and fades in the ones loaded later (D-M1)', () => {
    const withImage = postItem({ media: { type: 'image', url: '/mocks/chart.svg' } })
    const { unmount } = renderWithIntl(
      <ul>
        <FeedItems items={[withImage]} />
      </ul>,
    )
    expect(screen.getByRole('img', { name: 'Image attached to the post' })).not.toHaveClass(
      'opacity-0',
    )
    unmount()

    renderWithIntl(
      <ul>
        <FeedItems items={[withImage]} later />
      </ul>,
    )
    expect(screen.getByRole('img', { name: 'Image attached to the post' })).toHaveClass('opacity-0')
  })
})

describe('FeedItems with ads (specs/post-detail-refresh PD-16)', () => {
  const ad = (advertiser: string) => ({
    id: advertiser,
    advertiser,
    logoUrl: null,
    body: `${advertiser} body`,
    url: 'https://example.com',
    domain: 'example.com',
    imageUrl: null,
  })
  const ADS = [ad('First'), ad('Second')]
  const items = (count: number) =>
    Array.from({ length: count }, (_, index) =>
      postItem({ id: `post-${index}`, title: `P${index}` }),
    )

  /** What the list reads, in order: "card" or the ad's advertiser. */
  function reading() {
    return Array.from(document.querySelectorAll('ul > li')).map((li) =>
      li.querySelector('section')
        ? li.querySelector('section')!.getAttribute('aria-label')
        : 'card',
    )
  }

  it('puts an ad after every 10th card, rotating them', () => {
    renderWithIntl(
      <ul>
        <FeedItems items={items(20)} ads={ADS} />
      </ul>,
    )
    const order = reading()
    expect(order).toHaveLength(22)
    expect(order[10]).toBe('Ad: First')
    expect(order[21]).toBe('Ad: Second')
  })

  it('keeps counting from the pages before (offset)', () => {
    renderWithIntl(
      <ul>
        <FeedItems items={items(5)} ads={ADS} offset={25} />
      </ul>,
    )
    // Cards 26 to 30: the ad after the 30th, the third of the feed (back to the first).
    expect(reading()).toEqual(['card', 'card', 'card', 'card', 'card', 'Ad: First'])
  })

  it('shows the cards alone without ads', () => {
    renderWithIntl(
      <ul>
        <FeedItems items={items(10)} />
      </ul>,
    )
    expect(reading().every((each) => each === 'card')).toBe(true)
  })
})
