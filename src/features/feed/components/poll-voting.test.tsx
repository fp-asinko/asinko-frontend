import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthGateProvider } from '@/components/organisms/auth-gate'
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
    action.votePoll.mockResolvedValue({ ok: false, error: 'api.errors.UNAVAILABLE' })
    renderPoll()

    await userEvent.click(screen.getByRole('button', { name: 'No' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not save your vote. Try again.',
    )
    expect(screen.getByRole('button', { name: 'No' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('opens the account modal without a session, marking and sending nothing (G-04)', async () => {
    renderWithIntl(
      <AuthGateProvider signedIn={false}>
        <PollVoting
          id={hidden.id}
          options={hidden.options}
          totalVotes={hidden.totalVotes}
          viewerOptionId={null}
          resultsVisible={false}
          isClosed={false}
          allowVoteChange
          closing={null}
          comments={null}
        />
      </AuthGateProvider>,
    )
    // With the modal open the page behind it is hidden from the accessibility tree.
    const no = screen.getByRole('button', { name: 'No' })
    await userEvent.click(no)

    expect(
      await screen.findByRole('dialog', { name: 'Vote to see where you stand' }),
    ).toBeInTheDocument()
    expect(action.votePoll).not.toHaveBeenCalled()
    expect(no).toHaveAttribute('aria-pressed', 'false')
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
      expect(container.querySelector('[data-bar].animate-bar-grow')).not.toBeNull()
    })
  })

  describe('minimal polls (feed-cards revision 2)', () => {
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
    const fills = (container: HTMLElement) => [...container.querySelectorAll('[data-bar]')]
    const consensusOf = (container: HTMLElement) => container.querySelector('[data-consensus]')

    it('shows the clean boxes, without fills, while the results are hidden (FC-18)', () => {
      const { container } = renderPoll()
      expect(screen.getByRole('button', { name: 'Yes' })).toBeInTheDocument()
      expect(fills(container)).toHaveLength(0)
    })

    it('fills each box to its share and highlights the leading option, the rest softer (FC-20, FC-21)', () => {
      const { container } = renderPoll(pollItem())
      const [below, above] = fills(container)
      // Above 150K has 25%, Below 150K 75%: Below leads.
      expect(below).toHaveStyle({ transform: 'scaleX(0.25)' })
      expect(below).toHaveClass('opacity-50')
      expect(above).toHaveStyle({ transform: 'scaleX(0.75)' })
      expect(above).not.toHaveClass('opacity-50')
      expect(screen.getByText('Below 150K')).toHaveClass('font-semibold')
      expect(screen.getByText('Above 150K')).toHaveClass('text-muted-foreground')
      // One color for every option: no per-option tokens.
      expect(container.innerHTML).not.toMatch(/bg-poll-/)
    })

    it('highlights every option tied at the top', () => {
      const { container } = renderPoll(
        pollItem({
          options: [
            { id: 'a', label: 'Yes', votes: 5, share: 0.5 },
            { id: 'b', label: 'No', votes: 5, share: 0.5 },
          ],
          totalVotes: 10,
        }),
      )
      for (const fill of fills(container)) expect(fill).not.toHaveClass('opacity-50')
    })

    it('marks the viewer vote with a check even when it does not lead (FC-22)', () => {
      const { container } = renderPoll(pollItem({ viewerOptionId: 'a' }))
      const checks = container.querySelectorAll('[data-mine]')
      expect(checks).toHaveLength(1)
      expect(screen.getByRole('button', { name: /Above 150K/ })).toContainElement(
        checks[0] as HTMLElement,
      )
      expect(screen.getByRole('button', { name: /Above 150K/ })).toHaveAttribute(
        'aria-pressed',
        'true',
      )
    })

    it('keeps the same focused button when the results arrive (WCAG 2.4.3)', async () => {
      action.votePoll.mockResolvedValue(results('a'))
      renderPoll()
      const yes = screen.getByRole('button', { name: 'Yes' })
      await userEvent.click(yes)
      await screen.findByText('80%')
      expect(yes).toBeInTheDocument()
      expect(yes).toHaveFocus()
    })

    it('says where the vote stands in one quiet line, once the server answers (FC-23)', async () => {
      let answer: (value: unknown) => void = () => {}
      action.votePoll.mockReturnValue(new Promise((resolve) => (answer = resolve)))
      const { container } = renderPoll()

      await userEvent.click(screen.getByRole('button', { name: 'No' }))
      expect(consensusOf(container)).toBeNull()

      answer(results('b'))
      await screen.findByText('20%')
      const line = consensusOf(container)!
      expect(line.tagName).toBe('P')
      expect(line).toHaveTextContent('20% of the community thinks like you')
      expect(line).toHaveClass('animate-fade-up', 'delay-after-bars')
      // Inserted text is not read: the live region says it with the saved vote (WCAG 4.1.3).
      expect(screen.getByRole('status')).toHaveTextContent(
        'Vote saved. 20% of the community thinks like you.',
      )
    })

    it('enters again at once when a changed vote changes the tier', async () => {
      action.votePoll.mockResolvedValueOnce(results('b')).mockResolvedValueOnce(results('a'))
      const { container } = renderPoll()

      await userEvent.click(screen.getByRole('button', { name: 'No' }))
      await screen.findByText('20% of the community thinks like you', { selector: 'p' })
      await userEvent.click(screen.getByRole('button', { name: /Yes/ }))
      await screen.findByText('80% of the community thinks like you', { selector: 'p' })
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
  })
})
