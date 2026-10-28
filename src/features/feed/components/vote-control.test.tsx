import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthGateProvider } from '@/components/organisms/auth-gate'
import { renderWithIntl } from '@/test/render-with-intl'
import { VoteControl } from './vote-control'

const action = vi.hoisted(() => ({ votePost: vi.fn() }))
vi.mock('../actions/vote-post.action', () => action)
const commentAction = vi.hoisted(() => ({ voteComment: vi.fn() }))
vi.mock('../actions/vote-comment.action', () => commentAction)

const ID = '00000000-0000-4000-8000-000000000001'

/** A promise the test resolves by hand, to look at the optimistic state in between. */
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => (resolve = done))
  return { promise, resolve }
}

describe('VoteControl (H-15)', () => {
  beforeEach(() => action.votePost.mockReset())

  it('announces the score and the pressed state of each arrow', () => {
    renderWithIntl(<VoteControl id={ID} score={1284} viewerVote={1} />)
    expect(screen.getByRole('button', { name: 'Upvote' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Downvote' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(screen.getByText('1,284 points, you upvoted')).toBeInTheDocument()
  })

  it('keeps the focus on the arrow while saving and ignores a second press', async () => {
    const answer = deferred<unknown>()
    action.votePost.mockReturnValue(answer.promise)
    renderWithIntl(<VoteControl id={ID} score={10} viewerVote={null} />)
    const up = screen.getByRole('button', { name: 'Upvote' })

    await userEvent.click(up)
    expect(up).toHaveFocus()
    expect(up).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(up)
    expect(action.votePost).toHaveBeenCalledTimes(1)

    answer.resolve({ ok: true, data: { score: 11, viewerVote: 1 } })
    expect(await screen.findByText('11 points, you upvoted')).toBeInTheDocument()
  })

  it('shows the vote at once and keeps the server score', async () => {
    const answer = deferred<unknown>()
    action.votePost.mockReturnValue(answer.promise)
    renderWithIntl(<VoteControl id={ID} score={10} viewerVote={null} />)

    await userEvent.click(screen.getByRole('button', { name: 'Upvote' }))
    expect(screen.getByText('11 points, you upvoted')).toBeInTheDocument()
    expect(action.votePost).toHaveBeenCalledWith({ postId: ID, value: 1 })

    answer.resolve({ ok: true, data: { score: 12, viewerVote: 1 } })
    expect(await screen.findByText('12 points, you upvoted')).toBeInTheDocument()
  })

  it('switches from downvote to upvote in one step (score +2)', async () => {
    action.votePost.mockResolvedValue({ ok: true, data: { score: 11, viewerVote: 1 } })
    renderWithIntl(<VoteControl id={ID} score={9} viewerVote={-1} />)
    await userEvent.click(screen.getByRole('button', { name: 'Upvote' }))
    expect(await screen.findByText('11 points, you upvoted')).toBeInTheDocument()
  })

  it('removes the vote when the active arrow is pressed again', async () => {
    action.votePost.mockResolvedValue({ ok: true, data: { score: null, viewerVote: null } })
    renderWithIntl(<VoteControl id={ID} score={11} viewerVote={1} />)

    await userEvent.click(screen.getByRole('button', { name: 'Upvote' }))
    expect(action.votePost).toHaveBeenCalledWith({ postId: ID, value: null })
    expect(await screen.findByText('10 points')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Upvote' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('goes back and says why when the vote fails', async () => {
    action.votePost.mockResolvedValue({ ok: false, error: 'api.errors.UNAVAILABLE' })
    renderWithIntl(<VoteControl id={ID} score={10} viewerVote={null} />)

    await userEvent.click(screen.getByRole('button', { name: 'Downvote' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not save your vote')
    expect(screen.getByText('10 points')).toBeInTheDocument()
  })

  it('opens the account modal without a session, marking and sending nothing (G-04)', async () => {
    renderWithIntl(
      <AuthGateProvider signedIn={false}>
        <VoteControl id={ID} score={10} viewerVote={null} />
      </AuthGateProvider>,
    )
    const upvote = screen.getByRole('button', { name: 'Upvote' })
    await userEvent.click(upvote)

    expect(
      await screen.findByRole('dialog', { name: 'Vote to make your take count' }),
    ).toBeInTheDocument()
    expect(action.votePost).not.toHaveBeenCalled()
    expect(upvote).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText('10')).toBeInTheDocument()
  })

  it('opens the account modal when the session ended meanwhile, and goes back', async () => {
    action.votePost.mockResolvedValue({ ok: false, error: 'api.errors.UNAUTHENTICATED' })
    renderWithIntl(
      <AuthGateProvider signedIn>
        <VoteControl id={ID} score={10} viewerVote={null} />
      </AuthGateProvider>,
    )
    // With the modal open the page behind it is hidden from the accessibility tree.
    const upvote = screen.getByRole('button', { name: 'Upvote' })
    await userEvent.click(upvote)

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).toBeNull()
    await vi.waitFor(() => expect(upvote).toHaveAttribute('aria-pressed', 'false'))
  })

  it.each([
    ['en', '12.4K'],
    ['es', /12,4\smil/],
    ['pt', /12,4\smil/],
  ] as const)(
    'shows big scores compact in %s, the full number for screen readers',
    (locale, shown) => {
      renderWithIntl(<VoteControl id={ID} score={12_400} viewerVote={null} />, { locale })
      expect(screen.getByText(shown)).toBeInTheDocument()
      expect(screen.getByText(/12[.,\s]?400/)).toHaveClass('sr-only')
    },
  )

  describe('motion (home-motion M-01)', () => {
    // The pill holds each button inside its hover hint (PO, 2026-10-27).
    const pill = () => screen.getByRole('button', { name: 'Upvote' }).parentElement!.parentElement!

    it('does not animate on load', () => {
      renderWithIntl(<VoteControl id={ID} score={10} viewerVote={1} />)
      expect(pill()).not.toHaveAttribute('data-animate')
    })

    it('pops the arrow in the direction of the vote', async () => {
      action.votePost.mockResolvedValue({ ok: true, data: { score: 9, viewerVote: -1 } })
      renderWithIntl(<VoteControl id={ID} score={10} viewerVote={null} />)

      await userEvent.click(screen.getByRole('button', { name: 'Downvote' }))
      expect(pill()).toHaveAttribute('data-animate', 'down')
      expect(screen.getByRole('button', { name: 'Downvote' }).querySelector('svg')).toHaveClass(
        'animate-vote-pop',
      )
    })

    it('does not pop when removing the vote (Q2), but the number still rolls', async () => {
      action.votePost.mockResolvedValue({ ok: true, data: { score: null, viewerVote: null } })
      renderWithIntl(<VoteControl id={ID} score={11} viewerVote={1} />)

      await userEvent.click(screen.getByRole('button', { name: 'Upvote' }))
      expect(pill()).not.toHaveAttribute('data-animate')
      expect(await screen.findByText('10', { selector: '[aria-hidden]' })).toHaveClass(
        'animate-count-down',
      )
    })
  })
})

describe('VoteControl on a comment (specs/post-create-detail PC-16)', () => {
  it('votes the comment, not a post', async () => {
    commentAction.voteComment.mockResolvedValue({ ok: true, data: { score: 4, viewerVote: 1 } })
    renderWithIntl(<VoteControl kind="comment" id={ID} size="sm" score={3} viewerVote={null} />)
    await userEvent.click(screen.getByRole('button', { name: 'Upvote' }))
    expect(commentAction.voteComment).toHaveBeenCalledWith({ commentId: ID, value: 1 })
    expect(action.votePost).not.toHaveBeenCalled()
    expect(await screen.findByText('4 points, you upvoted')).toBeInTheDocument()
  })

  it("comes without the pill in the post page's comments (specs/comment-threads CT-03)", () => {
    renderWithIntl(<VoteControl kind="comment" id={ID} size="plain" score={3} viewerVote={null} />)
    const upvote = screen.getByRole('button', { name: 'Upvote' })
    expect(upvote).toHaveClass('size-8')
    expect(upvote.parentElement!.parentElement).toHaveClass('bg-transparent')
  })
})
