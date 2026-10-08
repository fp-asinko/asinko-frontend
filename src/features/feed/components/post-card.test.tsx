import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { postItem } from '../feed-items.fixture'
import { PostCard } from './post-card'

vi.mock('@/lib/communities/join-community.action', () => ({ joinCommunity: vi.fn() }))
vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))
vi.mock('../actions/load-comments-preview.action', () => ({ loadCommentsPreview: vi.fn() }))
vi.mock('../actions/vote-post.action', () => ({ votePost: vi.fn() }))
vi.mock('../actions/vote-comment.action', () => ({ voteComment: vi.fn() }))
vi.mock('../actions/vote-poll.action', () => ({ votePoll: vi.fn() }))

describe('PostCard (H-12)', () => {
  it('shows byline, title, Markdown body with mentions and actions, without a tag', () => {
    renderWithIntl(<PostCard post={postItem()} />)

    expect(
      screen.getByRole('article', { name: 'Whales accumulated 48,000 $BTC' }),
    ).toBeInTheDocument()
    expect(screen.getByText('@maria')).toBeInTheDocument()
    expect(screen.getByText('74% accuracy, high')).toBeInTheDocument()
    expect(screen.getByText('2 hours ago')).toBeInTheDocument()
    // Post tags are not shown (specs/feed-cards § 14).
    expect(screen.queryByText('On-chain')).not.toBeInTheDocument()
    // The byline community and the body mention both link to the filtered Home.
    for (const link of screen.getAllByRole('link', { name: '$BTC' })) {
      expect(link).toHaveAttribute('href', '/asset/BTC')
    }
    expect(screen.getByText('6 comments')).toBeInTheDocument()
    expect(screen.getByText('1,284 points')).toBeInTheDocument()
    // Share works now (specs/comment-threads Q4): no longer "coming soon".
    expect(screen.getByRole('button', { name: 'Share' })).not.toHaveAttribute('aria-disabled')
  })

  it('orders the actions as Reddit: votes, then comments, then share', () => {
    renderWithIntl(<PostCard post={postItem()} />)
    const upvote = screen.getByRole('button', { name: /upvote/i })
    const comments = screen.getByText('6 comments')
    const share = screen.getByRole('button', { name: 'Share' })
    expect(upvote.compareDocumentPosition(comments) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(comments.compareDocumentPosition(share) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('links the community in the byline', () => {
    renderWithIntl(<PostCard post={postItem({ body: 'No mentions here.' })} />)
    expect(screen.getByRole('link', { name: '$BTC' })).toHaveAttribute('href', '/asset/BTC')
  })

  it('shows an image post with next/image', () => {
    renderWithIntl(
      <PostCard post={postItem({ media: { type: 'image', url: '/mocks/chart.svg' } })} />,
    )
    expect(screen.getByRole('img', { name: 'Image attached to the post' })).toHaveAttribute(
      'src',
      '/mocks/chart.svg',
    )
  })

  it('shows a link post with its real domain, opened safely', () => {
    renderWithIntl(
      <PostCard
        post={postItem({
          media: { type: 'link', url: 'https://www.example.com/a', domain: 'example.com' },
        })}
      />,
    )
    const link = screen.getByRole('link', { name: /example\.com/ })
    expect(link).toHaveAttribute('href', 'https://www.example.com/a')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer nofollow ugc')
    expect(link).toHaveTextContent('(opens in a new tab)')
  })

  it('marks an edited post', () => {
    renderWithIntl(<PostCard post={postItem({ edited: true })} />)
    expect(screen.getByText('edited')).toBeInTheDocument()
  })

  it('shows a deleted post without body, tag or actions', () => {
    renderWithIntl(<PostCard post={postItem({ deleted: true, body: '' })} />)
    expect(screen.getByRole('heading', { name: '[deleted]' })).toBeInTheDocument()
    expect(screen.queryByText('On-chain')).toBeNull()
    expect(screen.queryByText(/points/)).toBeNull()
  })

  it('shows a system post as Asinko, without accuracy', () => {
    renderWithIntl(<PostCard post={postItem({ author: null })} />)
    expect(screen.getByText('Asinko')).toBeInTheDocument()
    expect(screen.queryByText(/accuracy/)).toBeNull()
  })

  it('clamps a long body and expands it with See more, without JavaScript', async () => {
    renderWithIntl(<PostCard post={postItem({ body: 'word '.repeat(120) })} />)
    const toggle = screen.getByText('See more')
    expect(toggle.closest('details')).not.toHaveAttribute('open')
    await userEvent.click(toggle)
    expect(toggle.closest('details')).toHaveAttribute('open')
  })

  it('does not offer See more for short bodies', () => {
    renderWithIntl(<PostCard post={postItem()} />)
    expect(screen.queryByText('See more')).toBeNull()
  })
})

describe('PostCard detail variant (specs/post-create-detail PC-13)', () => {
  const longBody = Array.from({ length: 10 }, (_, i) => `Line ${i + 1}`).join('\n\n')

  it('titles the page with an h1 and shows the whole body, without "See more"', () => {
    renderWithIntl(<PostCard post={postItem({ body: longBody })} variant="detail" />)
    expect(
      screen.getByRole('heading', { level: 1, name: 'Whales accumulated 48,000 $BTC' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Line 10')).toBeInTheDocument()
    expect(screen.queryByText('See more')).not.toBeInTheDocument()
  })

  it('points the comment count to the comments below instead of opening a preview', () => {
    renderWithIntl(<PostCard post={postItem()} variant="detail" />)
    expect(screen.getByRole('link', { name: '6 comments' })).toHaveAttribute('href', '#comments')
  })

  it('keeps the h2 and "See more" in the feed', () => {
    renderWithIntl(<PostCard post={postItem({ body: longBody })} />)
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
    expect(screen.getByText('See more')).toBeInTheDocument()
  })
})

describe('PostCard into the detail (specs/post-create-detail PC-17)', () => {
  it("links its title to the post's page, but not on the page itself", () => {
    const { unmount } = renderWithIntl(<PostCard post={postItem()} />)
    expect(screen.getByRole('link', { name: 'Whales accumulated 48,000 $BTC' })).toHaveAttribute(
      'href',
      '/post/post-1/whales-accumulated-48-000-btc',
    )
    unmount()
    renderWithIntl(<PostCard post={postItem()} variant="detail" />)
    expect(
      screen.queryByRole('link', { name: 'Whales accumulated 48,000 $BTC' }),
    ).not.toBeInTheDocument()
  })

  it('does not link a deleted post', () => {
    renderWithIntl(<PostCard post={postItem({ deleted: true })} />)
    expect(screen.queryByRole('link', { name: '[deleted]' })).not.toBeInTheDocument()
  })
})

describe('PostCard leading slot (specs/post-detail-refresh PD-01)', () => {
  it('puts what comes first, the back button of the page, before the header', () => {
    renderWithIntl(
      <PostCard post={postItem()} variant="detail" leading={<button type="button">Back</button>} />,
    )
    const back = screen.getByRole('button', { name: 'Back' })
    const group = screen.getAllByRole('link')[0]!
    expect(back.compareDocumentPosition(group) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})
