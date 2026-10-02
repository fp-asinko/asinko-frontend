import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { VoteControl } from './vote-control'

const action = vi.hoisted(() => ({ votePost: vi.fn() }))
vi.mock('../actions/vote-post.action', () => action)

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
    renderWithIntl(<VoteControl postId={ID} score={1284} viewerVote={1} />)
    expect(screen.getByRole('button', { name: 'Upvote' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Downvote' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(screen.getByText('1,284 points, you upvoted')).toBeInTheDocument()
  })

  it('shows the vote at once and keeps the server score', async () => {
    const answer = deferred<unknown>()
    action.votePost.mockReturnValue(answer.promise)
    renderWithIntl(<VoteControl postId={ID} score={10} viewerVote={null} />)

    await userEvent.click(screen.getByRole('button', { name: 'Upvote' }))
    expect(screen.getByText('11 points, you upvoted')).toBeInTheDocument()
    expect(action.votePost).toHaveBeenCalledWith({ postId: ID, value: 1 })

    answer.resolve({ ok: true, data: { score: 12, viewerVote: 1 } })
    expect(await screen.findByText('12 points, you upvoted')).toBeInTheDocument()
  })

  it('switches from downvote to upvote in one step (score +2)', async () => {
    action.votePost.mockResolvedValue({ ok: true, data: { score: 11, viewerVote: 1 } })
    renderWithIntl(<VoteControl postId={ID} score={9} viewerVote={-1} />)
    await userEvent.click(screen.getByRole('button', { name: 'Upvote' }))
    expect(await screen.findByText('11 points, you upvoted')).toBeInTheDocument()
  })

  it('removes the vote when the active arrow is pressed again', async () => {
    action.votePost.mockResolvedValue({ ok: true, data: { score: null, viewerVote: null } })
    renderWithIntl(<VoteControl postId={ID} score={11} viewerVote={1} />)

    await userEvent.click(screen.getByRole('button', { name: 'Upvote' }))
    expect(action.votePost).toHaveBeenCalledWith({ postId: ID, value: null })
    expect(await screen.findByText('10 points')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Upvote' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('goes back and says why when the vote fails', async () => {
    action.votePost.mockResolvedValue({ ok: false, error: 'api.errors.UNAVAILABLE' })
    renderWithIntl(<VoteControl postId={ID} score={10} viewerVote={null} />)

    await userEvent.click(screen.getByRole('button', { name: 'Downvote' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not save your vote')
    expect(screen.getByText('10 points')).toBeInTheDocument()
  })

  it('asks for an account without a session', async () => {
    action.votePost.mockResolvedValue({ ok: false, error: 'api.errors.UNAUTHENTICATED' })
    renderWithIntl(<VoteControl postId={ID} score={10} viewerVote={null} />)

    await userEvent.click(screen.getByRole('button', { name: 'Upvote' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('You need an account to vote.')
  })

  it.each([
    ['en', '12.4K'],
    ['es', /12,4\smil/],
    ['pt', /12,4\smil/],
  ] as const)(
    'shows big scores compact in %s, the full number for screen readers',
    (locale, shown) => {
      renderWithIntl(<VoteControl postId={ID} score={12_400} viewerVote={null} />, { locale })
      expect(screen.getByText(shown)).toBeInTheDocument()
      expect(screen.getByText(/12[.,\s]?400/)).toHaveClass('sr-only')
    },
  )
})
