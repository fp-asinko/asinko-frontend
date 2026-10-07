import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { CommentsToggle } from './comments-toggle'

const action = vi.hoisted(() => ({ loadCommentsPreview: vi.fn() }))
vi.mock('../actions/load-comments-preview.action', () => action)
vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

const ID = '00000000-0000-4000-8000-000000000001'

function renderToggle() {
  return renderWithIntl(
    <CommentsToggle kind="post" id={ID}>
      6 comments
    </CommentsToggle>,
  )
}

describe('CommentsToggle (H-28)', () => {
  beforeEach(() => action.loadCommentsPreview.mockReset())

  it('loads the preview the first time it opens, with the locale', async () => {
    action.loadCommentsPreview.mockResolvedValue({ ok: true, data: <p>First comment</p> })
    renderToggle()
    const button = screen.getByRole('button', { name: /6 comments/ })
    expect(button).toHaveAttribute('aria-expanded', 'false')

    await userEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(await screen.findByText('First comment')).toBeInTheDocument()
    expect(action.loadCommentsPreview).toHaveBeenCalledWith({ kind: 'post', id: ID, locale: 'en' })
    const panel = document.getElementById(button.getAttribute('aria-controls')!)!
    expect(panel).toContainElement(screen.getByText('First comment'))
  })

  it('announces the loading and shows a decorative skeleton meanwhile (FC-07)', async () => {
    let answer: (value: unknown) => void = () => {}
    action.loadCommentsPreview.mockReturnValue(new Promise((resolve) => (answer = resolve)))
    renderToggle()

    await userEvent.click(screen.getByRole('button', { name: /6 comments/ }))
    expect(screen.getByRole('status')).toHaveTextContent('Loading comments…')
    expect(screen.getByTestId('comments-skeleton')).toHaveAttribute('aria-hidden', 'true')

    answer({ ok: true, data: <p>First comment</p> })
    expect(await screen.findByText('First comment')).toBeInTheDocument()
    expect(screen.queryByTestId('comments-skeleton')).toBeNull()
  })

  it('reuses the preview when toggled again; closed, it stays mounted but inert (M-03)', async () => {
    action.loadCommentsPreview.mockResolvedValue({ ok: true, data: <p>First comment</p> })
    renderToggle()
    const button = screen.getByRole('button', { name: /6 comments/ })

    await userEvent.click(button)
    await screen.findByText('First comment')
    const panel = document.getElementById(button.getAttribute('aria-controls')!)!

    await userEvent.click(button)
    // Kept for the closing animation, but out of the focus order and of screen readers.
    expect(panel).toHaveAttribute('inert')
    expect(panel).toHaveAttribute('aria-hidden', 'true')

    await userEvent.click(button)
    expect(panel).not.toHaveAttribute('inert')
    expect(screen.getByText('First comment')).toBeVisible()
    expect(action.loadCommentsPreview).toHaveBeenCalledTimes(1)
  })

  it('says when it fails and retries on the next open', async () => {
    action.loadCommentsPreview
      .mockResolvedValueOnce({ ok: false, error: 'api.errors.UNAVAILABLE' })
      .mockResolvedValueOnce({ ok: true, data: <p>Back</p> })
    renderToggle()
    const button = screen.getByRole('button', { name: /6 comments/ })

    await userEvent.click(button)
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load the comments')
    await userEvent.click(button)
    await userEvent.click(button)
    expect(await screen.findByText('Back')).toBeInTheDocument()
  })

  it('opens and loads when asked from outside, and stays open on the next request (FC-27)', async () => {
    action.loadCommentsPreview.mockResolvedValue({ ok: true, data: <p>First comment</p> })
    const view = renderWithIntl(
      <CommentsToggle kind="poll" id={ID} openRequest={0}>
        6 comments
      </CommentsToggle>,
    )
    const button = screen.getByRole('button', { name: /6 comments/ })
    expect(button).toHaveAttribute('aria-expanded', 'false')

    view.rerender(
      <CommentsToggle kind="poll" id={ID} openRequest={1}>
        6 comments
      </CommentsToggle>,
    )
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(await screen.findByText('First comment')).toBeInTheDocument()

    view.rerender(
      <CommentsToggle kind="poll" id={ID} openRequest={2}>
        6 comments
      </CommentsToggle>,
    )
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(action.loadCommentsPreview).toHaveBeenCalledOnce()
  })
})

describe('CommentsToggle: all comments (specs/post-create-detail PC-17)', () => {
  beforeEach(() => action.loadCommentsPreview.mockReset())

  it("links to the post's page under the comments", async () => {
    action.loadCommentsPreview.mockResolvedValue({ ok: true, data: <p>First comment</p> })
    renderWithIntl(
      <CommentsToggle kind="post" id={ID} href="/post/abc/a-title">
        6 comments
      </CommentsToggle>,
    )
    await userEvent.click(screen.getByRole('button', { name: /6 comments/ }))
    expect(await screen.findByRole('link', { name: 'See all comments' })).toHaveAttribute(
      'href',
      '/post/abc/a-title',
    )
  })

  it('stays "Coming soon" without a page (polls)', async () => {
    action.loadCommentsPreview.mockResolvedValue({ ok: true, data: <p>First comment</p> })
    renderWithIntl(
      <CommentsToggle kind="poll" id={ID}>
        6 comments
      </CommentsToggle>,
    )
    await userEvent.click(screen.getByRole('button', { name: /6 comments/ }))
    expect(await screen.findByRole('button', { name: 'See all comments' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  })
})
