import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createPortal } from 'react-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { router } from '@/test/navigation-mock'
import { renderWithIntl } from '@/test/render-with-intl'
import { CardLink } from './card-link'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

function renderCard() {
  renderWithIntl(
    <CardLink href="/post/1/hello" aria-label="Hello">
      <h2>Hello</h2>
      <p>The body of the post.</p>
      <button type="button">Upvote</button>
      <a href="https://example.com/btc">$BTC</a>
      <div data-card-own-click>
        <p>A comment in the preview.</p>
      </div>
      {createPortal(<div role="dialog">A dialog from the card</div>, document.body)}
    </CardLink>,
  )
}

describe('CardLink (PO, 2026-10-09: the whole card opens its post, as Reddit)', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => window.getSelection()?.removeAllRanges())

  it('opens the post from anywhere on the card', async () => {
    renderCard()
    await userEvent.click(screen.getByText('The body of the post.'))
    expect(router.push).toHaveBeenCalledWith('/post/1/hello')
  })

  it('leaves its buttons, links, the comments preview and its dialogs to themselves', async () => {
    renderCard()
    await userEvent.click(screen.getByRole('button', { name: 'Upvote' }))
    fireEvent.click(screen.getByRole('link', { name: '$BTC' }))
    await userEvent.click(screen.getByText('A comment in the preview.'))
    await userEvent.click(screen.getByText('A dialog from the card'))
    expect(router.push).not.toHaveBeenCalled()
  })

  it('does not open while text is being selected', async () => {
    renderCard()
    const body = screen.getByText('The body of the post.')
    const range = document.createRange()
    range.selectNodeContents(body)
    window.getSelection()?.addRange(range)
    fireEvent.click(body)
    expect(router.push).not.toHaveBeenCalled()
  })

  it('opens another tab with Ctrl or Cmd, in the page language', () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null)
    renderCard()
    fireEvent.click(screen.getByText('The body of the post.'), { ctrlKey: true })
    expect(open).toHaveBeenCalledWith('/en/post/1/hello', '_blank', 'noopener')
    expect(router.push).not.toHaveBeenCalled()
  })

  it('prefetches the post on hover', async () => {
    renderCard()
    await userEvent.hover(screen.getByText('The body of the post.'))
    expect(router.prefetch).toHaveBeenCalledWith('/post/1/hello')
  })
})
