import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { FeaturedMenuContext } from '@/components/organisms/featured'
import { renderWithIntl } from '@/test/render-with-intl'
import { pollItem } from '../feed-items.fixture'
import { PollCard } from './poll-card'

vi.mock('@/lib/communities/join-community.action', () => ({ joinCommunity: vi.fn() }))
vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))
vi.mock('../actions/load-comments-preview.action', () => ({ loadCommentsPreview: vi.fn() }))
vi.mock('../actions/vote-post.action', () => ({ votePost: vi.fn() }))
vi.mock('../actions/vote-comment.action', () => ({ voteComment: vi.fn() }))
vi.mock('../actions/vote-poll.action', () => ({ votePoll: vi.fn() }))

describe('PollCard (H-13)', () => {
  it('says why Explore shows it before the header, and carries its id for the impressions (specs/explore-v1)', () => {
    const poll = pollItem({ reason: { type: 'country', countryCode: 'AR' } })
    renderWithIntl(<PollCard poll={poll} />)
    const line = screen.getByText('Popular in Argentina')
    const article = screen.getByRole('article')
    expect(article.firstElementChild).toContainElement(line)
    expect(article).toHaveAttribute('data-content-id', poll.id)
    // A poll has no page to open yet: no path.
    expect(article).not.toHaveAttribute('data-content-path')
  })

  it('offers "⋯" to feature it only on your own profile (specs/backend-answer-1020 BA-04)', () => {
    const name = 'Options for the poll Where does $BTC close 2026?'
    const { unmount } = renderWithIntl(<PollCard poll={pollItem()} />)
    expect(screen.queryByRole('button', { name })).toBeNull()
    unmount()
    renderWithIntl(
      <FeaturedMenuContext
        value={{ isFeatured: () => false, full: false, max: 3, pending: false, set: vi.fn() }}
      >
        <PollCard poll={pollItem()} menu />
      </FeaturedMenuContext>,
    )
    expect(screen.getByRole('button', { name })).toHaveAttribute('aria-haspopup', 'menu')
  })

  it('shows the question, options with their share and the totals', () => {
    renderWithIntl(<PollCard poll={pollItem()} />)

    expect(screen.getByRole('article', { name: 'Where does $BTC close 2026?' })).toBeInTheDocument()
    expect(screen.getByText('Poll')).toBeInTheDocument()
    expect(screen.getByText('25%')).toBeInTheDocument()
    expect(screen.getByText('75%')).toBeInTheDocument()
    expect(screen.getByText('Closes in 4 days')).toBeInTheDocument()
  })

  it('hides the results until voting (ON_VOTE)', () => {
    const hidden = pollItem({
      resultsVisible: false,
      totalVotes: null,
      options: [
        { id: 'a', label: 'Yes', votes: null, share: null },
        { id: 'b', label: 'No', votes: null, share: null },
      ],
    })
    renderWithIntl(<PollCard poll={hidden} />)
    expect(screen.queryByText(/%/)).toBeNull()
    expect(screen.getByText('Vote to see the results')).toBeInTheDocument()
    expect(screen.queryByText(/votes/)).toBeNull()
  })

  it('shows a closed poll with its final results', () => {
    renderWithIntl(<PollCard poll={pollItem({ isClosed: true })} />)
    expect(screen.getByText('100 votes')).toBeInTheDocument()
    expect(screen.getByText('Closed')).toBeInTheDocument()
    expect(screen.getByText('75%')).toBeInTheDocument()
  })

  it('marks the viewer vote as pressed while it can still change', () => {
    renderWithIntl(<PollCard poll={pollItem({ viewerOptionId: 'b' })} />)
    expect(screen.getByRole('button', { name: /Below 150K/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('marks the viewer vote as text when the poll is read-only', () => {
    renderWithIntl(<PollCard poll={pollItem({ viewerOptionId: 'b', isClosed: true })} />)
    expect(screen.queryByRole('button', { name: /Below 150K/ })).toBeNull()
    expect(screen.getByText('(Your vote)').closest('li')).toHaveTextContent('Below 150K')
  })

  it('shows the community logo next to the question, or none without a community (FC-02)', () => {
    const { unmount } = renderWithIntl(<PollCard poll={pollItem()} />)
    expect(screen.getAllByTestId('user-avatar').at(-1)).toHaveTextContent('BT')
    unmount()
    renderWithIntl(<PollCard poll={pollItem({ community: null })} />)
    expect(screen.getAllByTestId('user-avatar')).toHaveLength(1)
  })

  it('shows how many comments the poll has, like a post (BC-03)', () => {
    renderWithIntl(<PollCard poll={pollItem({ commentCount: 12_400 })} />)
    const button = screen.getByRole('button', { name: '12,400 comments' })
    expect(button).toHaveTextContent('12.4K')
  })
})
