import { screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { pollItem, postItem } from '../feed-items.fixture'
import { parseFeedParams } from '../schemas/feed-params.schema'
import { FeedView } from './feed-view'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

const params = (raw: Record<string, string> = {}) => parseFeedParams(raw)

describe('FeedView', () => {
  it('renders composer, tabs, filters and the cards in order', () => {
    renderWithIntl(
      <FeedView
        params={params()}
        state={{ status: 'ok', items: [postItem(), pollItem()] }}
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

  it('shows the community chip with ?comunidad, linking back to the unfiltered feed', () => {
    renderWithIntl(
      <FeedView
        params={params({ comunidad: 'btc' })}
        state={{ status: 'ok', items: [postItem()] }}
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
        params={params({ feed: 'siguiendo' })}
        state={{ status: 'ok', items: [] }}
        viewerName="demo"
      />,
    )
    expect(screen.getByText('You do not follow any communities yet.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'See For you' })).toHaveAttribute('href', '/')
  })

  it('explains an empty Polls page and an empty community', () => {
    const { unmount } = renderWithIntl(
      <FeedView
        params={params({ filtro: 'polls' })}
        state={{ status: 'ok', items: [] }}
        viewerName={null}
      />,
    )
    expect(screen.getByText('No polls in what is loaded so far.')).toBeInTheDocument()
    unmount()
    renderWithIntl(
      <FeedView
        params={params({ comunidad: 'defi' })}
        state={{ status: 'ok', items: [] }}
        viewerName={null}
      />,
    )
    expect(screen.getByText('Nothing posted in #defi yet.')).toBeInTheDocument()
  })

  it('says when the general feed is empty', () => {
    renderWithIntl(
      <FeedView params={params()} state={{ status: 'ok', items: [] }} viewerName={null} />,
    )
    expect(screen.getByText('Nothing posted yet.')).toBeInTheDocument()
  })

  it('asks for an account when Following needs one', () => {
    renderWithIntl(
      <FeedView
        params={params({ feed: 'siguiendo' })}
        state={{ status: 'needs-account' }}
        viewerName={null}
      />,
    )
    expect(
      screen.getByText('You need an account to see the communities you follow.'),
    ).toBeInTheDocument()
  })
})
