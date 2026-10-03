import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { postItem } from '../feed-items.fixture'
import { PostCard } from './post-card'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))
vi.mock('../actions/load-comments-preview.action', () => ({ loadCommentsPreview: vi.fn() }))
vi.mock('../actions/vote-post.action', () => ({ votePost: vi.fn() }))
vi.mock('../actions/vote-poll.action', () => ({ votePoll: vi.fn() }))

describe('PostCard (H-12)', () => {
  it('shows byline, title, Markdown body with mentions, tag and actions', () => {
    renderWithIntl(<PostCard post={postItem()} />)

    expect(
      screen.getByRole('article', { name: 'Whales accumulated 48,000 $BTC' }),
    ).toBeInTheDocument()
    expect(screen.getByText('@maria')).toBeInTheDocument()
    expect(screen.getByText('74% accuracy, high')).toBeInTheDocument()
    expect(screen.getByText('2 hours ago')).toBeInTheDocument()
    expect(screen.getByText('On-chain')).toBeInTheDocument()
    // The byline community and the body mention both link to the filtered Home.
    for (const link of screen.getAllByRole('link', { name: '$BTC' })) {
      expect(link).toHaveAttribute('href', '/?community=btc')
    }
    expect(screen.getByText('6 comments')).toBeInTheDocument()
    expect(screen.getByText('1,284 points')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Share' })).toHaveAttribute('aria-disabled', 'true')
  })

  it('links the community in the byline', () => {
    renderWithIntl(<PostCard post={postItem({ body: 'No mentions here.' })} />)
    expect(screen.getByRole('link', { name: '$BTC' })).toHaveAttribute('href', '/?community=btc')
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
    renderWithIntl(<PostCard post={postItem({ deleted: true, body: '', tag: 'On-chain' })} />)
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
