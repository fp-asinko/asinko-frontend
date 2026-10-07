import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthGateProvider } from '@/components/organisms/auth-gate'
import { renderWithIntl } from '@/test/render-with-intl'
import type { CommentNode } from '../feed.types'
import { CommentComposer } from './comment-composer'
import { CommentThread } from './comment-thread'
import { CommentTree } from './comment-tree'

const actions = vi.hoisted(() => ({ createComment: vi.fn(), voteComment: vi.fn() }))
vi.mock('../actions/create-comment.action', () => ({ createComment: actions.createComment }))
vi.mock('../actions/vote-comment.action', () => ({ voteComment: actions.voteComment }))
vi.mock('../actions/vote-post.action', () => ({ votePost: vi.fn() }))
vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

const POST = '00000000-0000-4000-8000-000000000999'
let count = 0

function node(over: Partial<CommentNode> = {}, replies: CommentNode[] = []): CommentNode {
  count += 1
  return {
    id: `00000000-0000-4000-8000-${String(count).padStart(12, '0')}`,
    author: {
      username: 'maria',
      path: '/user/maria',
      handle: '@maria',
      avatarUrl: null,
      accuracyRate: null,
    },
    body: `Comment ${count}`,
    createdAt: new Date().toISOString(),
    edited: false,
    deleted: false,
    score: 1,
    viewerVote: null,
    replies,
    ...over,
  }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => (resolve = done))
  return { promise, resolve }
}

function renderThread(comments: CommentNode[], { signedIn = true } = {}) {
  return renderWithIntl(
    <AuthGateProvider signedIn={signedIn}>
      <CommentThread>
        <CommentComposer postId={POST} />
        <CommentTree postId={POST} comments={comments} />
      </CommentThread>
    </AuthGateProvider>,
  )
}

describe('CommentTree (specs/post-create-detail PC-14)', () => {
  beforeEach(() => {
    count = 0
    vi.clearAllMocks()
  })

  it('shows each comment with its author linked to the profile, its votes and Reply', () => {
    renderThread([node({ body: 'Top', edited: true }, [node({ body: 'Nested' })])])
    expect(screen.getByText('Top')).toBeInTheDocument()
    expect(screen.getByText('Nested')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: '@maria' })[0]).toHaveAttribute(
      'href',
      '/user/maria',
    )
    expect(screen.getByText('edited')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Reply' })).toHaveLength(2)
    expect(screen.getAllByRole('button', { name: 'Upvote' })).toHaveLength(2)
  })

  it('keeps a deleted comment as [deleted], without votes nor Reply, over its replies', () => {
    renderThread([node({ deleted: true, author: null, body: '' }, [node({ body: 'Still here' })])])
    expect(screen.getAllByText('[deleted]').length).toBeGreaterThan(0)
    expect(screen.getByText('Still here')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Reply' })).toHaveLength(1)
  })

  it('folds the replies from level 4 and opens them on demand', async () => {
    renderThread([
      node({ body: 'Level 1' }, [
        node({ body: 'Level 2' }, [
          node({ body: 'Level 3' }, [node({ body: 'Level 4' }, [node({ body: 'Level 5' })])]),
        ]),
      ]),
    ])
    expect(screen.getByText('Level 3')).toBeInTheDocument()
    expect(screen.queryByText('Level 4')).not.toBeInTheDocument()

    const toggle = screen.getByRole('button', { name: /See 2 replies/ })
    await userEvent.click(toggle)
    expect(screen.getByText('Level 4')).toBeInTheDocument()
    expect(screen.getByText('Level 5')).toBeInTheDocument()
    expect(toggle).toHaveTextContent('Hide replies')
  })

  it('opens a reply box with the focus, and Esc gives it back to Reply', async () => {
    renderThread([node({ body: 'Top' })])
    const reply = screen.getByRole('button', { name: 'Reply' })
    await userEvent.click(reply)
    expect(screen.getAllByRole('textbox')).toHaveLength(2)
    expect(screen.getAllByRole('textbox')[1]).toHaveFocus()

    await userEvent.keyboard('{Escape}')
    expect(screen.getAllByRole('textbox')).toHaveLength(1)
    expect(reply).toHaveFocus()
  })
})

describe('Commenting (PC-15)', () => {
  beforeEach(() => {
    count = 0
    vi.clearAllMocks()
  })

  it('shows a reply at once at the end of its thread, and closes the box when it is in', async () => {
    const answer = deferred<unknown>()
    actions.createComment.mockReturnValue(answer.promise)
    const [top] = [node({ body: 'Top' }, [node({ body: 'Older reply' })])]
    renderThread([top!])

    await userEvent.click(screen.getAllByRole('button', { name: 'Reply' })[0]!)
    const box = screen.getAllByRole('textbox')[1]!
    await userEvent.type(box, 'My reply')
    await userEvent.click(within(box.closest('form')!).getByRole('button', { name: 'Reply' }))

    expect(actions.createComment).toHaveBeenCalledWith({
      postId: POST,
      parentCommentId: top!.id,
      body: 'My reply',
    })
    const pending = screen.getByText('My reply').closest('li')!
    expect(within(pending).getByText('Sending…')).toBeInTheDocument()
    expect(
      screen.getByText('Older reply').compareDocumentPosition(pending) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(box).toHaveValue('')

    await act(async () => answer.resolve({ ok: true, data: { id: 'new' } }))
    expect(screen.getAllByRole('textbox')).toHaveLength(1)
  })

  it('brings the text back with the reason if sending fails', async () => {
    actions.createComment.mockResolvedValue({ ok: false, error: 'api.errors.UNAVAILABLE' })
    renderThread([])
    await userEvent.type(screen.getByRole('textbox', { name: 'Your comment' }), 'Hello')
    await userEvent.click(screen.getByRole('button', { name: 'Comment' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not post your comment')
    expect(screen.getByRole('textbox', { name: 'Your comment' })).toHaveValue('Hello')
    expect(screen.queryByText('Sending…')).not.toBeInTheDocument()
  })

  it('sends nothing while the box is empty', async () => {
    renderThread([])
    const send = screen.getByRole('button', { name: 'Comment' })
    expect(send).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(send)
    expect(actions.createComment).not.toHaveBeenCalled()
  })

  it('without a session, sending opens the account modal instead', async () => {
    renderThread([], { signedIn: false })
    await userEvent.type(screen.getByRole('textbox', { name: 'Your comment' }), 'Hello')
    await userEvent.click(screen.getByRole('button', { name: 'Comment' }))
    expect(await screen.findByRole('dialog', { name: 'Join Asinko to comment' })).toBeVisible()
    expect(actions.createComment).not.toHaveBeenCalled()
  })

  it('without a session, Reply opens the account modal, not a box', async () => {
    renderThread([node({ body: 'Top' })], { signedIn: false })
    await userEvent.click(screen.getByRole('button', { name: 'Reply' }))
    expect(await screen.findByRole('dialog', { name: 'Join Asinko to comment' })).toBeVisible()
    expect(screen.getAllByRole('textbox', { hidden: true })).toHaveLength(1)
  })
})
