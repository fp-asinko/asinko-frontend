import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { CollapseButton, CommentFold, RepliesFold, REVEAL_EVENT } from './comment-fold'

function reveal(id: string) {
  act(() => {
    window.dispatchEvent(new CustomEvent(REVEAL_EVENT, { detail: id }))
  })
}

function renderFold() {
  return renderWithIntl(
    <ul>
      <li id="comment-top" className="thread-item">
        <CommentFold
          handle="@maria"
          avatar={<span>avatar</span>}
          meta={<p>@maria</p>}
          body={
            <>
              <p>Top body</p>
              <CollapseButton />
            </>
          }
          replies={<li id="comment-child">Child body</li>}
        />
      </li>
    </ul>,
  )
}

describe('CommentFold (specs/comment-threads CT-06, CT-09, CT-12)', () => {
  it('closes from the line strip, as from ⊖', async () => {
    const { container } = renderFold()
    // The strip is for the mouse only: hidden from assistive tech, so found by its class.
    const strip = container.querySelector('.thread-strip')!
    await userEvent.click(strip)
    expect(screen.getByText('Top body')).not.toBeVisible()
    expect(screen.getByRole('button', { name: "Expand @maria's comment" })).toHaveFocus()
  })

  it('opens again when a comment inside it is revealed from its link', async () => {
    renderFold()
    await userEvent.click(screen.getByRole('button', { name: "Collapse @maria's comment" }))
    expect(screen.getByText('Child body')).not.toBeVisible()
    reveal('comment-child')
    expect(screen.getByText('Child body')).toBeVisible()
  })

  it('stays closed when the revealed comment is elsewhere', async () => {
    renderFold()
    await userEvent.click(screen.getByRole('button', { name: "Collapse @maria's comment" }))
    reveal('comment-elsewhere')
    expect(screen.getByText('Top body')).not.toBeVisible()
  })
})

describe('RepliesFold (CT-08, CT-12)', () => {
  it('opens when one of its replies is revealed from its link', () => {
    renderWithIntl(
      <ul>
        <RepliesFold label="2 more replies" ids={['comment-a', 'comment-b']}>
          <li id="comment-a">Deep reply</li>
        </RepliesFold>
      </ul>,
    )
    expect(screen.queryByText('Deep reply')).not.toBeInTheDocument()
    reveal('comment-b')
    expect(screen.getByText('Deep reply')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '2 more replies' })).not.toBeInTheDocument()
  })
})
