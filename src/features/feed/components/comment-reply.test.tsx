import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthGateProvider } from '@/components/organisms/auth-gate'
import { renderWithIntl } from '@/test/render-with-intl'
import { CommentReply } from './comment-reply'
import { CommentThread, PendingComments } from './comment-thread'

const actions = vi.hoisted(() => ({ createComment: vi.fn() }))
// Mentions have their own tests (specs/mention-autocomplete): out of this component's.
vi.mock('@/lib/mentions/search-mentions.action', () => ({ searchMentions: vi.fn() }))
vi.mock('@/components/molecules/mention-assist', () => ({ MentionField: () => null }))
vi.mock('../actions/create-comment.action', () => actions)

const POST = '00000000-0000-4000-8000-000000000999'
const COMMENT = '00000000-0000-4000-8000-000000000001'

function renderReply({ signedIn = true } = {}) {
  return renderWithIntl(
    <AuthGateProvider signedIn={signedIn}>
      <CommentThread>
        <CommentReply postId={POST} commentId={COMMENT}>
          <span>votes</span>
        </CommentReply>
        <PendingComments parentId={COMMENT} />
      </CommentThread>
    </AuthGateProvider>,
  )
}

describe('CommentReply (specs/post-create-detail PC-15)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('keeps the votes in its row and opens a reply box with the focus', async () => {
    renderReply()
    expect(screen.getByText('votes')).toBeInTheDocument()
    const reply = screen.getByRole('button', { name: 'Reply' })
    expect(reply).toHaveAttribute('aria-expanded', 'false')

    await userEvent.click(reply)
    expect(reply).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('textbox', { name: 'Your reply' })).toHaveFocus()
  })

  it('closes on Esc, Cancel or a second press, giving the focus back to Reply', async () => {
    renderReply()
    const reply = screen.getByRole('button', { name: 'Reply' })

    await userEvent.click(reply)
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(reply).toHaveFocus()

    await userEvent.click(reply)
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(reply).toHaveFocus()

    await userEvent.click(reply)
    await userEvent.click(reply)
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('closes once the reply is in, which shows under its comment meanwhile', async () => {
    let answer!: (value: unknown) => void
    actions.createComment.mockReturnValue(new Promise((done) => (answer = done)))
    renderReply()
    await userEvent.click(screen.getByRole('button', { name: 'Reply' }))
    await userEvent.type(screen.getByRole('textbox', { name: 'Your reply' }), 'My reply')
    await userEvent.click(screen.getByRole('button', { name: 'Send reply' }))

    expect(actions.createComment).toHaveBeenCalledWith({
      postId: POST,
      parentCommentId: COMMENT,
      body: 'My reply',
    })
    expect(within(screen.getByText('My reply').closest('li')!).getByText('Sending…')).toBeVisible()

    await act(async () => answer({ ok: true, data: { id: 'new' } }))
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reply' })).toHaveFocus()
  })

  it('without a session, opens the account modal instead of a box', async () => {
    renderReply({ signedIn: false })
    await userEvent.click(screen.getByRole('button', { name: 'Reply' }))
    expect(await screen.findByRole('dialog', { name: 'Join Asinko to comment' })).toBeVisible()
    expect(screen.queryAllByRole('textbox', { hidden: true })).toHaveLength(0)
  })
})
