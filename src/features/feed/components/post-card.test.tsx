import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FeaturedMenuContext } from '@/components/organisms/featured'
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
  it('shows byline, title, Markdown body with mentions and actions', () => {
    renderWithIntl(<PostCard post={postItem()} />)

    expect(
      screen.getByRole('article', { name: 'Whales accumulated 48,000 $BTC' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'maria' })).toBeInTheDocument()
    expect(screen.getByText('74% accuracy, high')).toBeInTheDocument()
    expect(screen.getByText('2 hours ago')).toBeInTheDocument()
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

  it('says why Explore shows it above the header, never on its own page (specs/explore-v1)', () => {
    const reason = { type: 'country', countryCode: 'AR' } as const
    const { unmount } = renderWithIntl(<PostCard post={{ ...postItem(), reason }} />)
    const line = screen.getByText('Popular in Argentina')
    const byline = screen.getByRole('link', { name: 'maria' })
    // Read first: before the byline in the document.
    expect(line.compareDocumentPosition(byline) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    unmount()

    renderWithIntl(<PostCard post={{ ...postItem(), reason }} variant="detail" />)
    expect(screen.queryByText('Popular in Argentina')).not.toBeInTheDocument()
  })

  it('carries its id and path for the impressions on a card, not on its own page (specs/explore-v1)', () => {
    const post = postItem()
    const { unmount } = renderWithIntl(<PostCard post={post} />)
    const card = screen.getByRole('article')
    expect(card).toHaveAttribute('data-content-id', post.id)
    expect(card).toHaveAttribute('data-content-path', post.path)
    unmount()

    renderWithIntl(<PostCard post={post} variant="detail" />)
    expect(screen.getByRole('article')).not.toHaveAttribute('data-content-id')
  })

  it('links the community in the byline', () => {
    renderWithIntl(<PostCard post={postItem({ body: 'No mentions here.' })} />)
    expect(screen.getByRole('link', { name: '$BTC' })).toHaveAttribute('href', '/asset/BTC')
  })

  it('shows an image post with next/image, named by its description (BA-04)', () => {
    const { unmount } = renderWithIntl(
      <PostCard
        post={postItem({
          media: { type: 'image', url: '/mocks/chart.svg', alt: 'BTC price since 2020' },
        })}
      />,
    )
    expect(screen.getByRole('img', { name: 'BTC price since 2020' })).toBeInTheDocument()
    unmount()
    // Without a description, the post's title.
    renderWithIntl(
      <PostCard
        post={postItem({ media: { type: 'image', url: '/mocks/chart.svg', alt: null } })}
      />,
    )
    expect(screen.getByRole('img', { name: 'Whales accumulated 48,000 $BTC' })).toHaveAttribute(
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

  it('shows its tag before the title, keeping the title as the name (specs/drafts-tags DT-10)', () => {
    renderWithIntl(<PostCard post={postItem({ tag: 'Analysis' })} />)
    expect(screen.getByText('Analysis')).toBeInTheDocument()
    expect(
      screen.getByRole('article', { name: 'Whales accumulated 48,000 $BTC' }),
    ).toBeInTheDocument()
  })

  it('shows a deleted post without body, tag or actions', () => {
    renderWithIntl(<PostCard post={postItem({ deleted: true, body: '', tag: 'Analysis' })} />)
    expect(screen.getByRole('heading', { name: '[deleted]' })).toBeInTheDocument()
    expect(screen.queryByText('Analysis')).toBeNull()
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

describe('PostCard as a preview (specs/submit-tools ST-01, ST-02)', () => {
  it('shows the post being written: no link into it, no join, the actions at zero and not pressable', () => {
    renderWithIntl(
      <PostCard
        post={postItem({ body: 'Ask [@maria](asinko:ticker) about rates.' })}
        variant="preview"
      />,
    )
    const title = screen.getByRole('heading', { level: 2 })
    expect(title.querySelector('a')).toBeNull()
    // Nothing leads away from the post being written: the group and the author as text.
    expect(screen.queryAllByRole('link')).toEqual([])
    expect(screen.queryByRole('button', { name: /Join/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /Upvote|Share/ })).toBeNull()
    // A mention of a draft: in bold, without a link (D-1).
    expect(screen.getByText('@maria', { selector: 'strong' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'maria' })).toBeNull()
  })

  it('shows its related ones as pills under the body, not when deleted (specs/backend-answer-1020 BA-07)', () => {
    const related = [{ handle: '$GGAL', path: '/asset/GGAL' }]
    const { unmount } = renderWithIntl(<PostCard post={postItem({ related })} />)
    const pills = screen.getByRole('list', { name: 'Related' })
    expect(screen.getByRole('link', { name: '$GGAL' })).toHaveAttribute('href', '/asset/GGAL')
    // Between the body and the votes.
    expect(
      pills.compareDocumentPosition(screen.getByRole('button', { name: /upvote/i })) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    unmount()
    renderWithIntl(<PostCard post={postItem({ related, deleted: true })} />)
    expect(screen.queryByRole('list', { name: 'Related' })).toBeNull()
  })

  it('offers "⋯" to feature it only on your own profile (specs/profile-showcase PS-07)', () => {
    const name = 'Options for the post Whales accumulated 48,000 $BTC'
    const { unmount } = renderWithIntl(<PostCard post={postItem()} menu />)
    expect(screen.queryByRole('button', { name })).toBeNull()
    unmount()
    renderWithIntl(
      <FeaturedMenuContext
        value={{
          isFeatured: (kind, id) => ([] as string[]).includes(`${kind}:${id}`),
          full: false,
          max: 3,
          pending: false,
          set: vi.fn(),
        }}
      >
        <PostCard post={postItem()} menu />
      </FeaturedMenuContext>,
    )
    expect(screen.getByRole('button', { name })).toHaveAttribute('aria-haspopup', 'menu')
  })
})

describe('PostCard: thoughts and posts without a body (specs/thoughts)', () => {
  const thought = (overrides = {}) =>
    postItem({
      thought: true,
      title: '',
      path: '/post/post-1/the-market-can-stay-irrational',
      body: 'The market can stay irrational longer than you can stay solvent.',
      media: null,
      ...overrides,
    })

  it('shows a thought as a quote with its badge, named for who cannot see it (TH-06)', () => {
    renderWithIntl(<PostCard post={thought()} />)
    const card = screen.getByRole('article', { name: 'Thought by maria' })
    expect(card).toHaveTextContent('Thought')
    const quote = screen.getByText(/The market can stay irrational/)
    expect(quote.closest('.italic')).not.toBeNull()
    // The keyboard's way into its page, as a post's title.
    expect(screen.getByRole('link', { name: 'Thought by maria' })).toHaveAttribute(
      'href',
      '/post/post-1/the-market-can-stay-irrational',
    )
    // Votes and comments, as a post.
    expect(screen.getByRole('button', { name: /comments/ })).toBeInTheDocument()
  })

  it('signs a thought with the name, else the @ (PO, 2026-10-26)', () => {
    const { unmount } = renderWithIntl(<PostCard post={thought()} />)
    expect(screen.getByText('— @maria')).toBeInTheDocument()
    unmount()
    const named = thought()
    renderWithIntl(
      <PostCard post={{ ...named, author: { ...named.author!, displayName: 'María Gómez' } }} />,
    )
    expect(screen.getByText('— María Gómez')).toBeInTheDocument()
  })

  it('does not sign a post', () => {
    renderWithIntl(<PostCard post={postItem({})} />)
    expect(screen.queryByText(/^— /)).toBeNull()
  })

  it('cuts a long thought with "See more" (TH-07)', () => {
    renderWithIntl(<PostCard post={thought({ body: 'Patience. '.repeat(80) })} />)
    expect(screen.getByText('See more')).toBeInTheDocument()
  })

  it('on its own page, its heading names it and the quote shows whole (TH-08)', () => {
    renderWithIntl(<PostCard post={thought()} variant="detail" />)
    expect(screen.getByRole('heading', { level: 1, name: 'Thought by maria' })).toHaveClass(
      'sr-only',
    )
    expect(screen.getByText(/The market can stay irrational/)).toBeVisible()
  })

  it('shows a post without a body by its title alone, with no empty paragraph (TH-02)', () => {
    const { container } = renderWithIntl(<PostCard post={postItem({ body: '', media: null })} />)
    expect(screen.getByRole('heading', { name: 'Whales accumulated 48,000 $BTC' })).toBeVisible()
    expect(container.querySelector('.type-post-body')).toBeNull()
    expect(screen.queryByText('See more')).toBeNull()
  })
})
