import { screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { pollItem, postItem } from '../feed-items.fixture'
import { parseFeedParams } from '../schemas/feed-params.schema'
import type { CommunityRef } from '../feed.types'
import type { FeedParams } from '../schemas/feed-params.schema'
import { CommunityChip } from './community-chip'
import { FeedListView, FeedTop, type FeedState } from './feed-view'

/** The center column as the page composes it: the top and the list (specs/feed-navigation). */
function FeedView({
  params,
  state,
  viewerName,
}: {
  params: FeedParams
  state: FeedState & { community?: CommunityRef | null }
  viewerName: string | null
}) {
  return (
    <>
      <FeedTop
        params={params}
        viewerName={viewerName}
        chip={
          params.community && <CommunityChip params={params} community={state.community ?? null} />
        }
      />
      <FeedListView params={params} state={state} />
    </>
  )
}

vi.mock('@/lib/communities/join-community.action', () => ({ joinCommunity: vi.fn() }))
vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))
vi.mock('../actions/load-comments-preview.action', () => ({ loadCommentsPreview: vi.fn() }))
vi.mock('../actions/vote-post.action', () => ({ votePost: vi.fn() }))
vi.mock('../actions/vote-poll.action', () => ({ votePoll: vi.fn() }))
vi.mock('../actions/load-more-feed.action', () => ({ loadMoreFeed: vi.fn() }))

const params = (raw: Record<string, string> = {}) => parseFeedParams(raw)

describe('FeedTop and FeedListView, as the page composes them', () => {
  it('renders composer, tabs, filters and the cards in order', () => {
    renderWithIntl(
      <FeedView
        params={params()}
        state={{ status: 'ok', items: [postItem(), pollItem()], nextCursor: null, community: null }}
        viewerName="demo"
      />,
    )
    expect(screen.getByRole('button', { name: 'What are you thinking?' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
    const cards = screen.getAllByRole('article')
    expect(cards).toHaveLength(2)
    expect(within(cards[1]!).getByText('Poll')).toBeInTheDocument()
  })

  it('offers to load more only when there is a next page (H-16)', () => {
    const { unmount } = renderWithIntl(
      <FeedView
        params={params()}
        state={{ status: 'ok', items: [postItem()], nextCursor: 'next', community: null }}
        viewerName="demo"
      />,
    )
    expect(screen.getByRole('button', { name: 'Load more' })).toBeInTheDocument()
    unmount()
    renderWithIntl(
      <FeedView
        params={params()}
        state={{ status: 'ok', items: [postItem()], nextCursor: null, community: null }}
        viewerName="demo"
      />,
    )
    expect(screen.queryByRole('button', { name: 'Load more' })).toBeNull()
  })

  it('shows the community chip with ?community, linking back to the unfiltered feed', () => {
    renderWithIntl(
      <FeedView
        params={params({ community: 'btc' })}
        state={{
          status: 'ok',
          items: [postItem()],
          nextCursor: null,
          community: { slug: 'btc', name: 'Bitcoin', handle: '$BTC' },
        }}
        viewerName="demo"
      />,
    )
    expect(screen.getByRole('link', { name: 'Remove the $BTC filter' })).toHaveAttribute(
      'href',
      '/',
    )
  })

  it('invites to For you when Following is empty (H-17)', () => {
    renderWithIntl(
      <FeedView
        params={params({ feed: 'following' })}
        state={{ status: 'ok', items: [], nextCursor: null, community: null }}
        viewerName="demo"
      />,
    )
    expect(screen.getByText('You do not follow any communities yet.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'See For you' })).toHaveAttribute('href', '/')
  })

  it('explains an empty Polls page and an empty community', () => {
    const { unmount } = renderWithIntl(
      <FeedView
        params={params({ filter: 'polls' })}
        state={{ status: 'ok', items: [], nextCursor: null, community: null }}
        viewerName={null}
      />,
    )
    expect(screen.getByText('No polls in what is loaded so far.')).toBeInTheDocument()
    unmount()
    renderWithIntl(
      <FeedView
        params={params({ community: 'defi' })}
        state={{ status: 'ok', items: [], nextCursor: null, community: null }}
        viewerName={null}
      />,
    )
    expect(screen.getByText('Nothing posted in #defi yet.')).toBeInTheDocument()
  })

  it('says when the general feed is empty', () => {
    renderWithIntl(
      <FeedView
        params={params()}
        state={{ status: 'ok', items: [], nextCursor: null, community: null }}
        viewerName={null}
      />,
    )
    expect(screen.getByText('Nothing posted yet.')).toBeInTheDocument()
  })

  it('asks for an account when Following needs one', () => {
    renderWithIntl(
      <FeedView
        params={params({ feed: 'following' })}
        state={{ status: 'needs-account' }}
        viewerName={null}
      />,
    )
    expect(
      screen.getByText('You need an account to see the communities you follow.'),
    ).toBeInTheDocument()
    // The ways in, right there (specs/guest-experience Q2).
    expect(screen.getByRole('button', { name: 'Create account' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument()
  })
})
