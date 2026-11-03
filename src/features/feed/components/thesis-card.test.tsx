import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { thesisItem } from '../feed-items.fixture'
import { ThesisCard } from './thesis-card'

vi.mock('@/lib/communities/join-community.action', () => ({ joinCommunity: vi.fn() }))
vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))
vi.mock('../actions/vote-post.action', () => ({ votePost: vi.fn() }))
vi.mock('../actions/vote-comment.action', () => ({ voteComment: vi.fn() }))
vi.mock('../actions/vote-thesis.action', () => ({ voteThesis: vi.fn() }))

describe('ThesisCard in a feed (specs/thesis-detail TD-02 to TD-05)', () => {
  it('has the header of any card, and says it is a thesis', () => {
    renderWithIntl(<ThesisCard thesis={thesisItem()} />)
    expect(
      screen.getByRole('article', { name: 'BTC will close above $150K before December 2026' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'macro' })).toHaveAttribute('href', '/hub/macro')
    expect(screen.getByRole('link', { name: 'maria' })).toBeInTheDocument()
    expect(screen.getByText('Thesis')).toBeInTheDocument()
  })

  it('shows its state, asset and time left, and the profile summary', () => {
    renderWithIntl(<ThesisCard thesis={thesisItem()} />)
    expect(screen.getByText('Open')).toHaveAttribute('data-state', 'open')
    expect(screen.getByRole('link', { name: '$BTC' })).toHaveAttribute('href', '/asset/BTC')
    // In the unit that reads best: "in 3 weeks".
    expect(screen.getByText(/^Closes in /)).toBeInTheDocument()
    expect(screen.getByText(/^Above \$150,000 by /)).toBeInTheDocument()
    expect(screen.getByText('High').closest('p')).toHaveTextContent('Conviction')
  })

  it('says how a resolved one ended, without the time left', () => {
    renderWithIntl(
      <ThesisCard
        thesis={thesisItem({
          state: 'correct',
          resolution: { price: 162000, at: '2026-12-03T23:59:59.000Z', source: 'automatic' },
        })}
      />,
    )
    expect(screen.getByText('Correct')).toBeInTheDocument()
    expect(screen.getByText('Resolved at $162,000')).toBeInTheDocument()
    expect(screen.queryByText(/^Closes/)).not.toBeInTheDocument()
  })

  it('votes, counts its arguments and shares, as a post (TD-04)', () => {
    renderWithIntl(<ThesisCard thesis={thesisItem()} />)
    expect(screen.getByRole('button', { name: /upvote/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '4 arguments' })).toHaveAttribute(
      'href',
      '/thesis/thesis-1',
    )
    expect(screen.getByRole('button', { name: 'Share' })).toBeInTheDocument()
  })

  it('opens its page from the claim; on the page, the claim is its h1 (TD-05, TD-06)', () => {
    const { unmount } = renderWithIntl(<ThesisCard thesis={thesisItem()} />)
    expect(
      screen.getByRole('link', { name: 'BTC will close above $150K before December 2026' }),
    ).toHaveAttribute('href', '/thesis/thesis-1')
    unmount()

    renderWithIntl(<ThesisCard thesis={thesisItem()} variant="detail" />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('BTC will close above')
    expect(
      screen.queryByRole('link', { name: 'BTC will close above $150K before December 2026' }),
    ).not.toBeInTheDocument()
  })

  it('does not offer to join the community the feed is filtered by (CP-07)', () => {
    renderWithIntl(<ThesisCard thesis={thesisItem()} feedCommunity="macro" />)
    expect(screen.queryByRole('button', { name: /join/i })).not.toBeInTheDocument()
  })
})
