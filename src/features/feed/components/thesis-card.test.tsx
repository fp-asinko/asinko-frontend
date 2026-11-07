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
vi.mock('../actions/answer-thesis.action', () => ({ answerThesis: vi.fn() }))

describe('ThesisCard in a feed (specs/thesis-detail TD-02 to TD-05, specs/thesis-ticket)', () => {
  it('opens with the header of every post: group and author first, then THESIS (TK-01)', () => {
    renderWithIntl(<ThesisCard thesis={thesisItem()} />)
    const card = screen.getByRole('article', {
      name: 'BTC will close above $150K before December 2026',
    })
    // After the group's initials (its avatar): the group, the author, then the badge; its state
    // down in the ticket, beside the deadline (PO, 2026-11-05).
    expect(card).toHaveTextContent(/^MAmacro.*maria.*Thesis.*\$BTC.*Deadline\s*Open/)
    // Seen, in gray (PO, 2026-11-05): only on its page, in a phone, it keeps just the icon.
    expect(screen.getByText('Thesis')).not.toHaveClass('sr-only')
  })

  it('names its group only when it is not the asset’s own (TK-02)', () => {
    const { unmount } = renderWithIntl(<ThesisCard thesis={thesisItem()} />)
    expect(screen.getByRole('link', { name: 'macro' })).toHaveAttribute('href', '/hub/macro')
    expect(screen.getByRole('link', { name: 'maria' })).toBeInTheDocument()
    unmount()

    renderWithIntl(
      <ThesisCard
        thesis={thesisItem({
          community: {
            slug: 'BTC',
            name: 'Bitcoin',
            handle: '$BTC',
            path: '/asset/BTC',
            kind: 'asset',
            avatarUrl: null,
            personal: false,
            viewerIsMember: false,
          },
        })}
      />,
    )
    // Only the ticket's: the asset is said once, and no Join for it here.
    expect(screen.getAllByRole('link', { name: /\$BTC/ })).toHaveLength(1)
    expect(screen.queryByRole('button', { name: /join/i })).toBeNull()
  })

  it('leads with the ticket, and puts the claim second, in gray (TK-03, TK-09)', () => {
    renderWithIntl(<ThesisCard thesis={thesisItem()} />)
    expect(screen.getByRole('link', { name: /\$BTC/ })).toHaveAttribute('href', '/asset/BTC')
    expect(screen.getByText(/^\+79\.5% from \$83,584/)).toBeInTheDocument()
    const claim = screen.getByRole('heading', { level: 2 })
    expect(claim).toHaveClass('type-post-body', 'text-muted-foreground', 'line-clamp-2')
    expect(screen.getByText('Bitcoin').compareDocumentPosition(claim)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
  })

  it('says how a resolved one ended, in the deadline’s place (TK-07)', () => {
    renderWithIntl(
      <ThesisCard
        thesis={thesisItem({
          state: 'correct',
          resolution: { price: 162000, at: '2026-12-03T23:59:59.000Z', source: 'automatic' },
        })}
      />,
    )
    // Closed: no state chip, its result says it (PO, 2026-11-05).
    expect(document.querySelector('[data-state]')).toBeNull()
    expect(screen.getByText(/^Correct on Dec 3, 2026 at \$162,000/)).toBeInTheDocument()
    expect(screen.queryByText('Deadline')).not.toBeInTheDocument()
  })

  it('votes, counts its arguments and shares, as a post (TD-04)', () => {
    renderWithIntl(<ThesisCard thesis={thesisItem()} />)
    expect(screen.getByRole('button', { name: /upvote/i })).toBeInTheDocument()
    // To its arguments, on For: it has more of them (specs/thesis-arguments TA-08).
    expect(screen.getByRole('link', { name: '4 arguments' })).toHaveAttribute(
      'href',
      '/thesis/thesis-1#arguments',
    )
    expect(screen.getByRole('button', { name: 'Share' })).toBeInTheDocument()
  })

  it('takes its arguments count to the side with more (specs/thesis-arguments TA-08)', () => {
    renderWithIntl(<ThesisCard thesis={thesisItem({ argumentCount: { pro: 1, contra: 2 } })} />)
    expect(screen.getByRole('link', { name: '3 arguments' })).toHaveAttribute(
      'href',
      '/thesis/thesis-1?side=contra#arguments',
    )
  })

  it('opens its page from the claim; on the page, the claim is its h1 (TD-05, TD-06)', () => {
    const { unmount } = renderWithIntl(<ThesisCard thesis={thesisItem()} />)
    expect(
      screen.getByRole('link', { name: 'BTC will close above $150K before December 2026' }),
    ).toHaveAttribute('href', '/thesis/thesis-1')
    unmount()

    renderWithIntl(<ThesisCard thesis={thesisItem()} variant="detail" />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('BTC will close above')
    // Every number once, in the ticket (Q4, PO 2026-11-03).
    expect(screen.getByRole('region', { name: 'The bet' })).toBeInTheDocument()
    expect(screen.getAllByText('Conviction')).toHaveLength(1)
    expect(
      screen.queryByRole('link', { name: 'BTC will close above $150K before December 2026' }),
    ).not.toBeInTheDocument()
  })

  it('does not offer to join the community the feed is filtered by (CP-07)', () => {
    renderWithIntl(<ThesisCard thesis={thesisItem()} feedCommunity="macro" />)
    expect(screen.queryByRole('button', { name: /join/i })).not.toBeInTheDocument()
  })
})

describe('ThesisCard and "Will it happen?" (specs/thesis-agree)', () => {
  it('asks right after the claim, on an open one (AG-01, PO 2026-11-06, AG-03)', () => {
    renderWithIntl(<ThesisCard thesis={thesisItem()} />)
    const group = screen.getByRole('group', { name: 'Will it happen?' })
    expect(group.compareDocumentPosition(screen.getByRole('heading', { level: 2 }))).toBe(
      Node.DOCUMENT_POSITION_PRECEDING,
    )
    // The votes stay, in the actions (Q1).
    expect(screen.getByRole('button', { name: /upvote/i })).toBeInTheDocument()
  })

  it('shows a closed one’s result only if anyone answered, and nothing without the field', () => {
    const closed = { state: 'correct' as const }
    const { unmount } = renderWithIntl(
      <ThesisCard
        thesis={thesisItem({
          ...closed,
          agreement: { yes: 3, no: 1, viewerVote: null, canVote: false },
        })}
      />,
    )
    expect(screen.getByText('75% yes · 25% no · 4 votes')).toBeInTheDocument()
    unmount()

    const { unmount: again } = renderWithIntl(
      <ThesisCard
        thesis={thesisItem({
          ...closed,
          agreement: { yes: 0, no: 0, viewerVote: null, canVote: false },
        })}
      />,
    )
    expect(screen.queryByText('Will it happen?')).toBeNull()
    again()

    renderWithIntl(<ThesisCard thesis={thesisItem({ agreement: null })} />)
    expect(screen.queryByText('Will it happen?')).toBeNull()
  })
})
