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

  describe('polls like the prototype (feed-cards revision 1)', () => {
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
    const consensusOf = (container: HTMLElement) => container.querySelector('[data-consensus]')

    it('shows clean buttons, without squares or bars, while the results are hidden (FC-18)', () => {
      const { container } = renderPoll()
      expect(screen.getByRole('button', { name: 'Yes' })).toBeInTheDocument()
      expect(container.querySelector('[data-marker]')).toBeNull()
      expect(container.querySelector('[data-bar]')).toBeNull()
    })

    it('shows soft rows, each a button to vote, when the results are visible without a vote (R1-Q3)', () => {
      const { container } = renderPoll(pollItem())
      const markers = [...container.querySelectorAll('[data-marker]')]
      expect(markers).toHaveLength(2)
      expect(container.querySelectorAll('[data-bar]')).toHaveLength(2)
      // Each option its own color, all soft: nobody voted (FC-16).
      expect(new Set(markers.map((marker) => marker.className.match(/bg-poll-\d/)?.[0])).size).toBe(
        2,
      )
      for (const marker of markers) expect(marker).toHaveClass('opacity-45')
      expect(screen.getByRole('button', { name: /Above 150K/ })).toHaveAttribute(
        'aria-pressed',
        'false',
      )
    })

    it('brings the viewer vote to full color and bold, the rest stays soft (FC-16)', () => {
      const { container } = renderPoll(pollItem({ viewerOptionId: 'b' }))
      const [other, mine] = [...container.querySelectorAll('[data-marker]')]
      expect(other).toHaveClass('opacity-45')
      expect(mine).not.toHaveClass('opacity-45')
      expect(screen.getByRole('button', { name: /Below 150K/ })).toHaveAttribute(
        'aria-pressed',
        'true',
      )
    })

    it('keeps the focused option when a vote turns the buttons into rows (WCAG 2.4.3)', async () => {
      action.votePoll.mockResolvedValue(results('a'))
      renderPoll()
      const yes = screen.getByRole('button', { name: 'Yes' })
      await userEvent.click(yes)
      await screen.findByText('80%')
      expect(yes).toBeInTheDocument()
      expect(yes).toHaveFocus()
    })

    it('heads the results with the consensus once the server answers (FC-17)', async () => {
      let answer: (value: unknown) => void = () => {}
      action.votePoll.mockReturnValue(new Promise((resolve) => (answer = resolve)))
      const { container } = renderPoll()

      await userEvent.click(screen.getByRole('button', { name: 'No' }))
      expect(consensusOf(container)).toBeNull()

      answer(results('b'))
      await screen.findByText('20%')
      const banner = consensusOf(container)!
      expect(banner).toHaveTextContent('20% of the community thinks like you')
      expect(banner).toHaveTextContent('You are in the minority. Early, or wrong?')
      expect(banner).toHaveClass('animate-fade-up', 'delay-after-bars')
      // Above the rows, as in the prototype.
      const list = container.querySelector('ul')!
      expect(banner.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
      // Inserted text is not read: the live region says it with the saved vote (WCAG 4.1.3).
      expect(screen.getByRole('status')).toHaveTextContent(
        'Vote saved. 20% of the community thinks like you. You are in the minority. Early, or wrong?',
      )
    })

    it('enters again at once when a changed vote changes the tier', async () => {
      action.votePoll.mockResolvedValueOnce(results('b')).mockResolvedValueOnce(results('a'))
      const { container } = renderPoll()

      await userEvent.click(screen.getByRole('button', { name: 'No' }))
      await screen.findByText(/minority/, { selector: 'p' })
      await userEvent.click(screen.getByRole('button', { name: /Yes/ }))
      await screen.findByText('You are with the majority. Is the consensus right?', {
        selector: 'p',
      })
      expect(consensusOf(container)).toHaveClass('animate-fade-up')
      expect(consensusOf(container)).not.toHaveClass('delay-after-bars')
    })

    it('shows the consensus of a vote cast earlier at once, without animation', () => {
      const { container } = renderPoll(pollItem({ viewerOptionId: 'b' }))
      expect(consensusOf(container)).toHaveTextContent('75% of the community thinks like you')
      expect(consensusOf(container)).not.toHaveClass('animate-fade-up')
    })

    it('stays quiet below 5 votes (R1-Q1)', () => {
      const { container } = renderPoll(
        pollItem({
          viewerOptionId: 'a',
          totalVotes: 4,
          options: [
            { id: 'a', label: 'Yes', votes: 3, share: 0.75 },
            { id: 'b', label: 'No', votes: 1, share: 0.25 },
          ],
        }),
      )
      expect(consensusOf(container)).toBeNull()
    })

    it('says when the community is split', () => {
      const tie = pollItem({
        viewerOptionId: 'a',
        totalVotes: 10,
        options: [
          { id: 'a', label: 'Yes', votes: 5, share: 0.5 },
          { id: 'b', label: 'No', votes: 5, share: 0.5 },
        ],
      })
      const { container } = renderPoll(tie)
      expect(consensusOf(container)).toHaveTextContent('The community is split down the middle.')
    })
  })
})
