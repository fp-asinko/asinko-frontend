import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { UserAvatar } from '@/components/molecules/user-avatar'
import { AuthGateProvider } from '@/components/organisms/auth-gate'
import { renderWithIntl } from '@/test/render-with-intl'
import { pollItem } from '../feed-items.fixture'
import type { PollItem } from '../feed.types'
import { PollVoting } from './poll-voting'

const action = vi.hoisted(() => ({ votePoll: vi.fn() }))
vi.mock('../actions/vote-poll.action', () => action)
const comments = vi.hoisted(() => ({ loadCommentsPreview: vi.fn() }))
vi.mock('../actions/load-comments-preview.action', () => comments)

const hidden = pollItem({
  resultsVisible: false,
  totalVotes: null,
  options: [
    { id: 'a', label: 'Yes', votes: null, share: null },
    { id: 'b', label: 'No', votes: null, share: null },
  ],
})

function renderPoll(poll: PollItem = hidden, { viewerName }: { viewerName?: string } = {}) {
  const ui = (
    <PollVoting
      id={poll.id}
      options={poll.options}
      totalVotes={poll.totalVotes}
      viewerOptionId={poll.viewerOptionId}
      resultsVisible={poll.resultsVisible}
      isClosed={poll.isClosed}
      allowVoteChange={poll.allowVoteChange}
      closing="Closes in 3 days"
      commentsLabel="Comments"
    />
  )
  return renderWithIntl(
    viewerName ? (
      <AuthGateProvider signedIn viewerAvatar={<UserAvatar name={viewerName} size="xs" />}>
        {ui}
      </AuthGateProvider>
    ) : (
      ui
    ),
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
          commentsLabel="Comments"
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

  it('keeps the comments button in the footer', () => {
    renderPoll()
    expect(screen.getByRole('button', { name: 'Comments' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })

  it('keeps the focused option a button once the vote locks, and announces it (WCAG 2.4.3)', async () => {
    action.votePoll.mockResolvedValue({
      ok: true,
      data: { ...hidden, viewerOptionId: 'a', resultsVisible: true, totalVotes: 1 },
    })
    renderPoll({ ...hidden, allowVoteChange: false })

    const yes = screen.getByRole('button', { name: 'Yes' })
    await userEvent.click(yes)
    expect(
      await screen.findByText('Vote saved.', { selector: '[role=status] span' }),
    ).toBeInTheDocument()
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
      expect((await screen.findByText('100%')).parentElement).toHaveClass('animate-fade-in')
      expect(container.querySelector('ul')).toHaveAttribute('data-revealed', 'true')
      expect(container.querySelector('[data-bar].animate-bar-grow')).not.toBeNull()
    })
  })

  describe('minimal polls (feed-cards revisions 2 and 4)', () => {
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

    it('marks the viewer vote with their avatar even when it does not lead (FC-24)', () => {
      const { container } = renderPoll(pollItem({ viewerOptionId: 'a' }), { viewerName: 'maria' })
      const mine = container.querySelectorAll('[data-mine]')
      expect(mine).toHaveLength(1)
      const option = screen.getByRole('button', { name: /Above 150K/ })
      expect(option).toContainElement(mine[0] as HTMLElement)
      expect(option).toHaveAttribute('aria-pressed', 'true')
      expect(mine[0]).toContainElement(screen.getByTestId('user-avatar'))
      expect(screen.getByTestId('user-avatar')).toHaveTextContent('MA')
    })

    it('falls back to the check without a known viewer name (FC-22)', () => {
      const { container } = renderPoll(pollItem({ viewerOptionId: 'a' }))
      expect(container.querySelector('svg[data-mine]')).not.toBeNull()
      expect(screen.queryByTestId('user-avatar')).toBeNull()
    })

    it('shows the votes and, smaller, the share of each option (FC-25)', () => {
      renderPoll(pollItem())
      expect(screen.getByText('75')).toHaveClass('font-semibold')
      expect(screen.getByText('75%')).toHaveClass('type-meta', 'text-muted-foreground')
      expect(screen.getByText('25')).toBeInTheDocument()
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

    it('unfolds a note above the options once the server answers, after the bars (FC-26, FC-28)', async () => {
      let answer: (value: unknown) => void = () => {}
      action.votePoll.mockReturnValue(new Promise((resolve) => (answer = resolve)))
      const { container } = renderPoll()

      await userEvent.click(screen.getByRole('button', { name: 'No' }))
      expect(consensusOf(container)).toBeNull()

      answer(results('b'))
      await screen.findByText('20%')
      const note = consensusOf(container)!
      expect(note).toHaveAttribute('data-consensus', 'minority')
      expect(note).toHaveTextContent('20% share your view.')
      expect(note).toHaveTextContent(
        'The other 80% bet differently. What are they seeing that you are not?',
      )
      // Above the options, unfolding after the bars.
      const list = container.querySelector('ul')!
      expect(note.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
      const unfold = note.parentElement!.parentElement!
      expect(unfold).toHaveClass('grid-rows-[1fr]', 'delay-400')
      // Inserted text is not read: the live region says it with the saved vote (WCAG 4.1.3).
      // The comments toggle has its own status: find the poll's by its text.
      expect(
        screen
          .getAllByRole('status')
          .some((status) =>
            status.textContent?.startsWith(
              'Vote saved. 20% share your view. The other 80% bet differently.',
            ),
          ),
      ).toBe(true)
    })

    it('asks the majority what the others could be seeing', async () => {
      action.votePoll.mockResolvedValue(results('a'))
      const { container } = renderPoll()
      await userEvent.click(screen.getByRole('button', { name: 'Yes' }))
      await screen.findByText('80% share your view.')
      expect(consensusOf(container)).toHaveTextContent(
        'You are with the majority. What could the other 20% be seeing?',
      )
    })

    it('changes the note at once, without waiting for the bars, when a vote changes the tier', async () => {
      action.votePoll.mockResolvedValueOnce(results('b')).mockResolvedValueOnce(results('a'))
      const { container } = renderPoll()

      await userEvent.click(screen.getByRole('button', { name: 'No' }))
      await screen.findByText('20% share your view.')
      await userEvent.click(screen.getByRole('button', { name: /Yes/ }))
      await screen.findByText('80% share your view.')
      expect(consensusOf(container)!.parentElement!.parentElement).not.toHaveClass('delay-400')
    })

    it('shows the note of a vote cast earlier from the start (FC-28)', () => {
      const { container } = renderPoll(pollItem({ viewerOptionId: 'b' }))
      const note = consensusOf(container)!
      expect(note).toHaveTextContent('75% share your view.')
      expect(note.parentElement!.parentElement).toHaveClass('grid-rows-[1fr]')
      expect(note.parentElement!.parentElement).not.toHaveClass('delay-400')
    })

    it('opens the comments from the note (FC-27)', async () => {
      comments.loadCommentsPreview.mockResolvedValue({ ok: true, data: <p>First comment</p> })
      renderPoll(pollItem({ viewerOptionId: 'b' }))
      await userEvent.click(screen.getByRole('button', { name: 'Tell us why' }))
      expect(screen.getByRole('button', { name: 'Comments' })).toHaveAttribute(
        'aria-expanded',
        'true',
      )
      expect(await screen.findByText('First comment')).toBeInTheDocument()
    })

    it('has no note before voting nor below 5 votes (R1-Q1)', () => {
      const { container, unmount } = renderPoll(pollItem())
      expect(consensusOf(container)).toBeNull()
      unmount()
      const few = renderPoll(
        pollItem({
          viewerOptionId: 'a',
          totalVotes: 4,
          options: [
            { id: 'a', label: 'Yes', votes: 3, share: 0.75 },
            { id: 'b', label: 'No', votes: 1, share: 0.25 },
          ],
        }),
      )
      expect(consensusOf(few.container)).toBeNull()
    })
  })
})
