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

  it('keeps the focused option a button once the vote locks, and announces it (WCAG 2.4.3)', async () => {
    action.votePoll.mockResolvedValue({
      ok: true,
      data: { ...hidden, viewerOptionId: 'a', resultsVisible: true, totalVotes: 1 },
    })
    renderPoll({ ...hidden, allowVoteChange: false })

    const yes = screen.getByRole('button', { name: 'Yes' })
    await userEvent.click(yes)
    expect(await screen.findByRole('status')).toHaveTextContent('Vote saved')
    expect(yes).toBeInTheDocument()
    expect(yes).toHaveFocus()
    expect(yes).toHaveAttribute('aria-disabled', 'true')

    await userEvent.click(screen.getByRole('button', { name: 'No' }))
    expect(action.votePoll).toHaveBeenCalledTimes(1)
  })

  describe('motion (home-motion M-02)', () => {
    it('does not animate results that were already visible on load', () => {
      const { container } = renderPoll(pollItem())
      expect(container.querySelector('ul')).not.toHaveAttribute('data-revealed')
    })

    it('grows the bars from 0 when a vote reveals the results', async () => {
      action.votePoll.mockResolvedValue({
        ok: true,
        data: {
          options: [
            { id: 'a', label: 'Yes', votes: 1, share: 1 },
            { id: 'b', label: 'No', votes: 0, share: 0 },
          ],
          totalVotes: 1,
          viewerOptionId: 'a',
          resultsVisible: true,
        },
      })
      const { container } = renderPoll()
      await userEvent.click(screen.getByRole('button', { name: 'Yes' }))
      expect(await screen.findByText('100%')).toHaveClass('animate-fade-in')
      expect(container.querySelector('ul')).toHaveAttribute('data-revealed', 'true')
      expect(container.querySelector('[data-bar] .animate-bar-grow')).not.toBeNull()
    })
  })

  describe('color and consensus (feed-cards)', () => {
    const results = (viewerOptionId: string) => ({
      ok: true,
      data: {
        options: [
          { id: 'a', label: 'Yes', votes: 8, share: 0.8 },
          { id: 'b', label: 'No', votes: 2, share: 0.2 },
        ],
        totalVotes: 10,
        viewerOptionId,
        resultsVisible: true,
      },
    })

    it('gives each option its own color and a bar (FC-04)', () => {
      const { container } = renderPoll(pollItem())
      const markers = [...container.querySelectorAll('[data-marker]')].map((m) => m.className)
      expect(new Set(markers).size).toBe(2)
      expect(container.querySelectorAll('[data-bar]')).toHaveLength(2)
    })

    it('marks the voted option and keeps the box geometry: no bars before results', () => {
      const { container } = renderPoll()
      expect(container.querySelectorAll('[data-marker]')).toHaveLength(2)
      expect(container.querySelector('[data-bar]')).toBeNull()
    })

    it('says where the vote stands only once the server answers (FC-05)', async () => {
      let answer: (value: unknown) => void = () => {}
      action.votePoll.mockReturnValue(new Promise((resolve) => (answer = resolve)))
      renderPoll()

      await userEvent.click(screen.getByRole('button', { name: 'No' }))
      expect(screen.queryByText(/minority/)).toBeNull()

      answer(results('b'))
      const message = await screen.findByText('You are in the minority: 20% chose the same')
      expect(message).toHaveClass('animate-fade-up')
    })

    it('shows the consensus of a vote cast earlier at once, without animation', () => {
      renderPoll(pollItem({ viewerOptionId: 'b' }))
      expect(screen.getByText('You voted with the majority: 75% chose the same')).not.toHaveClass(
        'animate-fade-up',
      )
    })

    it('stays quiet below 10 votes (Q2)', () => {
      renderPoll(
        pollItem({
          viewerOptionId: 'a',
          totalVotes: 4,
          options: [
            { id: 'a', label: 'Yes', votes: 3, share: 0.75 },
            { id: 'b', label: 'No', votes: 1, share: 0.25 },
          ],
        }),
      )
      expect(screen.queryByText(/majority/)).toBeNull()
    })
  })
})
