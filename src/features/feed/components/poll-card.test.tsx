import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { pollItem } from '../feed-items.fixture'
import { PollCard } from './poll-card'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

describe('PollCard (H-13)', () => {
  it('shows the question, options with their share and the totals', () => {
    renderWithIntl(<PollCard poll={pollItem()} />)

    expect(screen.getByRole('article', { name: 'Where does $BTC close 2026?' })).toBeInTheDocument()
    expect(screen.getByText('Poll')).toBeInTheDocument()
    expect(screen.getByText('25%')).toBeInTheDocument()
    expect(screen.getByText('75%')).toBeInTheDocument()
    expect(screen.getByText(/100 votes · closes in 4 days/)).toBeInTheDocument()
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
    expect(screen.getByText(/Vote to see the results/)).toBeInTheDocument()
  })

  it('shows a closed poll with its final results', () => {
    renderWithIntl(<PollCard poll={pollItem({ isClosed: true })} />)
    expect(screen.getByText(/100 votes · Closed/)).toBeInTheDocument()
    expect(screen.getByText('75%')).toBeInTheDocument()
  })

  it('marks the viewer vote', () => {
    renderWithIntl(<PollCard poll={pollItem({ viewerOptionId: 'b' })} />)
    expect(screen.getByText('(Your vote)')).toBeInTheDocument()
    expect(screen.getByText('(Your vote)').closest('li')).toHaveTextContent('Below 150K')
  })
})
