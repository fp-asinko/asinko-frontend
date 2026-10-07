import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthGateProvider } from '@/components/organisms/auth-gate'
import { renderWithIntl } from '@/test/render-with-intl'
import { CommentComposer } from './comment-composer'
import { CommentThread, PendingComments } from './comment-thread'

const actions = vi.hoisted(() => ({ createComment: vi.fn() }))
vi.mock('../actions/create-comment.action', () => actions)

const POST = '00000000-0000-4000-8000-000000000999'

function renderComposer({ signedIn = true } = {}) {
  return renderWithIntl(
    <AuthGateProvider signedIn={signedIn}>
      <CommentThread>
        <CommentComposer postId={POST} />
        <PendingComments parentId={null} />
      </CommentThread>
    </AuthGateProvider>,
  )
}

const box = () => screen.getByRole('textbox', { name: 'Your comment' })
const send = () => screen.getByRole('button', { name: 'Comment' })

describe('CommentComposer (specs/post-create-detail PC-15)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows the comment at once, empties the box and announces it', async () => {
    let answer!: (value: unknown) => void
    actions.createComment.mockReturnValue(new Promise((done) => (answer = done)))
    renderComposer()
    await userEvent.type(box(), '  Hello  ')
    await userEvent.click(send())

    expect(actions.createComment).toHaveBeenCalledWith({
      postId: POST,
      parentCommentId: null,
      body: 'Hello',
    })
    expect(screen.getByText('Hello')).toBeVisible()
    expect(box()).toHaveValue('')
    expect(screen.getByRole('status')).toHaveTextContent('Sending…')

    await act(async () => answer({ ok: true, data: { id: 'new' } }))
    expect(screen.getByRole('status')).toHaveTextContent('Comment posted.')
    // Without a page refresh in the test, the optimistic comment simply ends.
    expect(screen.queryByText('Hello')).not.toBeInTheDocument()
  })

  it('brings the text back with the reason if sending fails', async () => {
    actions.createComment.mockResolvedValue({ ok: false, error: 'api.errors.UNAVAILABLE' })
    renderComposer()
    await userEvent.type(box(), 'Hello')
    await userEvent.click(send())
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not post your comment')
    expect(box()).toHaveValue('Hello')
    expect(box()).toHaveAttribute('aria-invalid', 'true')
    expect(screen.queryByText('Sending…')).not.toBeInTheDocument()
  })

  it('sends nothing while the box is empty', async () => {
    renderComposer()
    expect(send()).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(send())
    expect(actions.createComment).not.toHaveBeenCalled()
  })

  it('without a session, sending opens the account modal instead', async () => {
    renderComposer({ signedIn: false })
    await userEvent.type(box(), 'Hello')
    await userEvent.click(send())
    expect(await screen.findByRole('dialog', { name: 'Join Asinko to comment' })).toBeVisible()
    expect(actions.createComment).not.toHaveBeenCalled()
  })
})
