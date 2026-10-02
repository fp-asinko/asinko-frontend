import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { pollItem } from '../feed-items.fixture'
import type { PollItem } from '../feed.types'
import { PollVoting } from './poll-voting'

const action = vi.hoisted(() => ({ votePoll: vi.fn() }))
vi.mock('../actions/vote-poll.action', () => action)

const hidden = pollItem({
  resultsVisible: false,
  totalVotes: null,
  options: [
    { id: 'a', label: 'Yes', votes: null, share: null },
    { id: 'b', label: 'No', votes: null, share: null },
  ],
})

function renderPoll(poll: PollItem = hidden) {
  return renderWithIntl(
    <PollVoting
      id={poll.id}
      options={poll.options}
      totalVotes={poll.totalVotes}
      viewerOptionId={poll.viewerOptionId}
      resultsVisible={poll.resultsVisible}
      isClosed={poll.isClosed}
      allowVoteChange={poll.allowVoteChange}
      closing="Closes in 3 days"
      comments={<button type="button">Comments</button>}
    />,
  )
}

describe('PollVoting (H-13, H-15)', () => {
  beforeEach(() => action.votePoll.mockReset())

  it('offers each option as a button and reveals the results after voting', async () => {
    action.votePoll.mockResolvedValue({
      ok: true,
      data: {
        options: [
          { id: 'a', label: 'Yes', votes: 3, share: 0.75 },
          { id: 'b', label: 'No', votes: 1, share: 0.25 },
        ],
        totalVotes: 4,
        viewerOptionId: 'a',
        resultsVisible: true,
      },
    })
    renderPoll()
    expect(screen.getByText('Vote to see the results')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Yes' }))
    expect(action.votePoll).toHaveBeenCalledWith({ pollId: hidden.id, optionId: 'a' })
    expect(await screen.findByText('75%')).toBeInTheDocument()
    expect(screen.getByText('4 votes')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Yes/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByText('Vote to see the results')).toBeNull()
  })

  it('goes back and says why when the vote fails', async () => {
    action.votePoll.mockResolvedValue({ ok: false, error: 'api.errors.UNAUTHENTICATED' })
    renderPoll()

    await userEvent.click(screen.getByRole('button', { name: 'No' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('You need an account to vote.')
    expect(screen.getByRole('button', { name: 'No' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('is read-only when closed', () => {
    renderPoll(pollItem({ isClosed: true }))
    expect(screen.queryByRole('button', { name: /150K/ })).toBeNull()
    expect(screen.getByText('Closes in 3 days')).toBeInTheDocument()
  })

  it('is read-only once voted when the vote cannot change', () => {
    renderPoll(pollItem({ viewerOptionId: 'a', allowVoteChange: false }))
    expect(screen.queryByRole('button', { name: /150K/ })).toBeNull()
    expect(screen.getByText('(Your vote)')).toBeInTheDocument()
  })

  it('keeps the comments slot in the footer', () => {
    renderPoll()
    expect(screen.getByRole('button', { name: 'Comments' })).toBeInTheDocument()
  })
})
