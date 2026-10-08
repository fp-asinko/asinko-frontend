import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CommentAnchor } from './comment-anchor'
import { REVEAL_EVENT } from './comment-fold'

describe('CommentAnchor (specs/comment-threads CT-12)', () => {
  afterEach(() => window.history.replaceState(null, '', '/'))

  it('reveals the linked comment, brings it into view, focuses and tints it', async () => {
    window.history.replaceState(null, '', '/en/post/1/hello#comment-c7')
    const scrollIntoView = vi.fn()
    Element.prototype.scrollIntoView = scrollIntoView
    const revealed = vi.fn()
    window.addEventListener(REVEAL_EVENT, (event) => revealed((event as CustomEvent).detail))
    render(
      <ul>
        <li id="comment-c7" tabIndex={-1}>
          Shared
        </li>
        <CommentAnchor />
      </ul>,
    )
    expect(revealed).toHaveBeenCalledWith('comment-c7')
    const comment = screen.getByText('Shared')
    await waitFor(() => expect(comment).toHaveFocus())
    expect(scrollIntoView).toHaveBeenCalled()
    expect(comment).toHaveAttribute('data-flash')
  })

  it('ignores a fragment that is not a comment', () => {
    window.history.replaceState(null, '', '/en/post/1/hello#<img>')
    const revealed = vi.fn()
    window.addEventListener(REVEAL_EVENT, revealed)
    render(<CommentAnchor />)
    expect(revealed).not.toHaveBeenCalled()
  })
})
