import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { CardComments } from './card-comments'
import { AddedComments } from './comment-count'

const actions = vi.hoisted(() => ({ commentFromCard: vi.fn(), searchMentions: vi.fn() }))
vi.mock('../actions/comment-from-card.action', () => ({
  commentFromCard: actions.commentFromCard,
}))
vi.mock('@/lib/mentions/search-mentions.action', () => ({
  searchMentions: actions.searchMentions,
}))
// The box's default action (the post page's): never called from a card, but imported.
vi.mock('../actions/create-comment.action', () => ({ createComment: vi.fn() }))

const ID = '00000000-0000-4000-8000-000000000001'

function renderPanel({ empty = false } = {}) {
  const add = vi.fn()
  renderWithIntl(
    <AddedComments value={{ added: 0, add }}>
      <CardComments kind="poll" id={ID} empty={empty}>
        <p>{empty ? 'No comments yet.' : 'The server preview'}</p>
      </CardComments>
    </AddedComments>,
  )
  return { add }
}

async function comment(text: string) {
  const box = screen.getByRole('textbox', { name: 'Join the conversation' })
  await userEvent.click(box)
  await userEvent.type(box, text)
  await userEvent.click(screen.getByRole('button', { name: 'Comment' }))
  return box
}

describe('CardComments (specs/card-comment)', () => {
  beforeEach(() => {
    actions.commentFromCard.mockReset().mockResolvedValue({ ok: true, data: { id: 'c-1' } })
  })

  it('has the box under the preview, the same as the post page (CC-01)', () => {
    renderPanel()
    const preview = screen.getByText('The server preview')
    const box = screen.getByRole('textbox', { name: 'Join the conversation' })
    expect(preview.compareDocumentPosition(box) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    // No id: a feed has many cards (the post page's box keeps its own).
    expect(box).not.toHaveAttribute('id')
  })

  it('sends from the card, shows it first, empties the box and counts it (CC-02, CC-03)', async () => {
    const { add } = renderPanel()
    const box = await comment('Middle one, rates first.')

    expect(actions.commentFromCard).toHaveBeenCalledWith({
      kind: 'poll',
      id: ID,
      body: 'Middle one, rates first.',
    })
    const mine = await screen.findByText('Middle one, rates first.')
    expect(
      mine.compareDocumentPosition(screen.getByText('The server preview')) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(screen.getByText('You')).toBeInTheDocument()
    expect(box).toHaveValue('')
    expect(add).toHaveBeenCalledTimes(1)
    expect(
      screen.getAllByRole('status').some((each) => each.textContent === 'Comment posted.'),
    ).toBe(true)
  })

  it('drops the empty preview once something is sent', async () => {
    renderPanel({ empty: true })
    expect(screen.getByText('No comments yet.')).toBeInTheDocument()
    await comment('First!')
    expect(await screen.findByText('First!')).toBeInTheDocument()
    expect(screen.queryByText('No comments yet.')).toBeNull()
  })

  it('gives the text back with the reason when it fails (CC-04)', async () => {
    actions.commentFromCard.mockResolvedValue({ ok: false, error: 'api.errors.UNAVAILABLE' })
    const { add } = renderPanel()
    const box = await comment('Will this go?')
    expect(await screen.findByText('Could not post your comment. Try again.')).toBeInTheDocument()
    expect(box).toHaveValue('Will this go?')
    expect(add).not.toHaveBeenCalled()
  })
})
