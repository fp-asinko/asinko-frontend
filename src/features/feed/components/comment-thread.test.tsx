import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { startTransition } from 'react'
import { describe, expect, it } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { CommentThread, PendingComments, useThread } from './comment-thread'

/** Sends a comment that never ends, under `parentId`. */
function Sender({ parentId, body }: { parentId: string | null; body: string }) {
  const { addPending } = useThread()
  return (
    <button
      type="button"
      onClick={() =>
        startTransition(async () => {
          addPending({ key: body, parentId, body })
          await new Promise(() => {})
        })
      }
    >
      Send {body}
    </button>
  )
}

describe('CommentThread and PendingComments (specs/post-create-detail PC-15)', () => {
  it('shows each comment being sent only under its own parent, as plain text', async () => {
    renderWithIntl(
      <CommentThread>
        <Sender parentId={null} body="**On the post**" />
        <Sender parentId="c1" body="On c1" />
        <section aria-label="post">
          <PendingComments parentId={null} />
        </section>
        <section aria-label="c1">
          <PendingComments parentId="c1" />
        </section>
      </CommentThread>,
    )
    expect(screen.getByRole('region', { name: 'post' })).toBeEmptyDOMElement()

    await userEvent.click(screen.getByRole('button', { name: 'Send **On the post**' }))
    await userEvent.click(screen.getByRole('button', { name: 'Send On c1' }))

    const post = screen.getByRole('region', { name: 'post' })
    const pending = screen.getByText('**On the post**').closest('li')!
    expect(post).toContainElement(pending)
    expect(pending).toHaveAttribute('aria-busy', 'true')
    expect(post).not.toHaveTextContent('On c1')
    expect(screen.getByRole('region', { name: 'c1' })).toHaveTextContent('On c1')
    expect(screen.getAllByText('You')).toHaveLength(2)
  })

  it('hangs each one from the thread with the class it is given (specs/comment-threads CT-10)', async () => {
    renderWithIntl(
      <CommentThread>
        <Sender parentId="c1" body="A reply" />
        <ul aria-label="replies">
          <PendingComments parentId="c1" itemClassName="thread-child thread-elbow" />
        </ul>
      </CommentThread>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Send A reply' }))
    expect(screen.getByText('A reply').closest('li')).toHaveClass('thread-child', 'thread-elbow')
  })
})
